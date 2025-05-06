
// File: src/render/sceneManager.js

import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';

// Install CameraControls into THREE
CameraControls.install({ THREE });

let renderer, scene, camera, cameraControls, meshGroup, appState;
const clock = new THREE.Clock();

/**
 * Compute a good camera distance so the whole polytope fits.
 */
function calculateCameraDistance(polytope, isMobile) {
  const center = polytope.center || [0, 0, 0];
  let maxD = 1;
  for (const v of polytope.vertices || []) {
    const d = Math.hypot(v[0] - center[0], v[1] - center[1], v[2] - center[2]);
    maxD = Math.max(maxD, d);
  }
  const factor = isMobile ? 4 : 2.5;
  return maxD * factor;
}

/**
 * Build the mesh, add optional edges, reset and re-frame the camera & controls,
 * then spin the camera a bit to “show off” the new polytope.
 */
function updatePolytope(reset = true) {
  // remove old mesh
  if (meshGroup) scene.remove(meshGroup);

  // build new mesh
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);

  // add edges if requested
  if (appState.settings.showEdges) {
    meshGroup.children.forEach(face => {
      const geo = new THREE.EdgesGeometry(face.geometry);
      const lines = new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({
          color: 0x000000,
          transparent: true,
          depthWrite: false,
          depthTest: true
        })
      );
      lines.userData.isEdgeHelper = true;
      face.add(lines);
    });
  }
    renderer.render(scene,camera)
    if (reset) {
	// reset controls to clear any previous state
	cameraControls.reset();

	// compute center & distance
	const center = appState.currentPolytope.center || [0, 0, 0];
	const distance = calculateCameraDistance(appState.currentPolytope, detectPlatform());

	// position camera looking at center
	cameraControls.setPosition(center[0],center[1],center[2] + 1.2*distance,false);
	cameraControls.setLookAt(
	    center[0], center[1], center[2] + distance,
	    center[0], center[1], center[2],
	    true
	);

	// pivot all rotations about the center, but still allow dolly
	cameraControls.setTarget(center[0], center[1], center[2], true);

	// — “Show‐off” spin: a quick quarter‐turn around the vertical (y) axis
	//    Adjust angle or transition duration as desired.
	cameraControls.rotate(Math.PI/7, -Math.PI/6, true);
    }
}

/**
 * Apply individual setting changes that affect only appearance or animation.
 */
function updateSettings(key, value) {
  switch (key) {
  case 'showEdges':
      updatePolytope(false);
      break;
  case 'colorScheme':
      updatePolytope(false);
      break;
    case 'faceOpacity':
      updatePolytope(false);
      break;
    case 'animation':
      // animate() reads appState.settings.animation
      break;
    default:
      break;
  }
}

/**
 * Resize handler.
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Main render loop.
 */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (appState.settings.animation) {
    cameraControls.rotate(-Math.PI / 8 * delta, 0, false);
  }

  // only re-render when controls update
  if (cameraControls.update(delta)) {
    renderer.render(scene, camera);
  }
}

/**
 * Initialize everything.
 */
export function setupScene(state) {
  appState = state;

  // — Renderer
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

  // — Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  scene.add(camera);

  // — Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  // — CameraControls
  cameraControls = new CameraControls(camera, renderer.domElement);
  cameraControls.enableDamping = true;
  // map interactions
  cameraControls.mouseButtons.left   = CameraControls.ACTION.ROTATE;
  cameraControls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  cameraControls.mouseButtons.right  = CameraControls.ACTION.OFFSET;
  cameraControls.mouseButtons.wheel  = CameraControls.ACTION.DOLLY;
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

  // events
  window.addEventListener('resize', onWindowResize);
  state.on('polytopeChanged', updatePolytope);
  state.on('settingsChanged', ({ key, value }) => updateSettings(key, value));

  // initial build & start loop
  updatePolytope();
  animate();
}
