// File: src/render/sceneManager.js

import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';
import { applyRenderMode } from './render_modes.js';

CameraControls.install({ THREE });

let renderer, scene, camera, cameraControls, meshGroup, appState;
const clock = new THREE.Clock();

function calculateCameraDistance(polytope, isMobile) {
  const center = polytope.center || [0, 0, 0];
  let maxD = 1;
  for (const v of polytope.vertices || []) {
    const d = Math.hypot(
      v[0] - center[0],
      v[1] - center[1],
      v[2] - center[2]
    );
    maxD = Math.max(maxD, d);
  }
  return maxD * (isMobile ? 4 : 2.5);
}

function updatePolytope(reset = true) {
  // remove old group
  if (meshGroup) scene.remove(meshGroup);

  // build either lines or meshes
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);

  // only apply material+lighting in NON-wireframe
  if (appState.settings.renderMode.material !== 'wireframe') {
    applyRenderMode(
      scene,
      meshGroup,
      appState.settings,
      appState.settings.renderModeName
    );
  }

  // only draw the old “showEdges” overlay if NOT wireframe
  if (
    appState.settings.showEdges &&
    appState.settings.renderMode.material !== 'wireframe'
  ) {
    meshGroup.children.forEach(face => {
      const geo = new THREE.EdgesGeometry(face.geometry);
      const lines = new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      face.add(lines);
    });
  }

  // initial render
  renderer.render(scene, camera);

  // optional “show‐off” spin
  if (reset) {
    cameraControls.reset();
    const center   = appState.currentPolytope.center || [0, 0, 0];
    const distance = calculateCameraDistance(
      appState.currentPolytope,
      detectPlatform()
    );
    cameraControls.setPosition(
      center[0],
      center[1],
      center[2] + 1.2 * distance,
      false
    );
    cameraControls.setLookAt(
      center[0],
      center[1],
      center[2] + distance,
      center[0],
      center[1],
      center[2],
      true
    );
    cameraControls.setTarget(center[0], center[1], center[2], true);
    cameraControls.rotate(Math.PI / 7, -Math.PI / 6, true);
  }
}

function updateSettings(key /*, value */) {
  if (
    key === 'showEdges' ||
    key === 'colorScheme' ||
    key === 'faceOpacity' ||
    key === 'renderModeName'
  ) {
    updatePolytope(false);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  cameraControls.update(clock.getDelta());
  renderer.render(scene, camera);
}

export function setupScene(state) {
  appState = state;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: !detectPlatform(),
    preserveDrawingBuffer: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // mount point
  let container = document.getElementById('viewer-canvas');
  if (!container) {
    container = document.createElement('div');
    container.id = 'viewer-canvas';
    document.body.appendChild(container);
  }
  container.appendChild(renderer.domElement);

  // Scene & Camera
  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  scene.add(camera);

  // Default lights (only used in non-wireframe modes)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  // CameraControls
  cameraControls = new CameraControls(camera, renderer.domElement);
  cameraControls.enableDamping = true;
  cameraControls.mouseButtons.left   = CameraControls.ACTION.ROTATE;
  cameraControls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  cameraControls.mouseButtons.right  = CameraControls.ACTION.OFFSET;
  cameraControls.touches.one   = CameraControls.ACTION.TOUCH_ROTATE;
  cameraControls.touches.two   = CameraControls.ACTION.TOUCH_DOLLY;
  cameraControls.touches.three = CameraControls.ACTION.TOUCH_OFFSET;
  cameraControls.minPolarAngle = -Infinity;
  cameraControls.maxPolarAngle = Infinity;

  // expose to state
  state.renderer       = renderer;
  state.scene          = scene;
  state.camera         = camera;
  state.cameraControls = cameraControls;

  // event listeners
  window.addEventListener('resize', onWindowResize);
  state.on('polytopeChanged', () => updatePolytope());
  state.on('settingsChanged', ({ key }) => updateSettings(key));

  // initial draw & loop
  updatePolytope();
  animate();
}
