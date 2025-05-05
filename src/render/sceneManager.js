
// src/render/sceneManager.js
import * as THREE from '../../vendor/three.module.js';
import { OrbitControls } from '../../vendor/examples/jsm/controls/OrbitControls.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';

let renderer, scene, camera, controls;
let currentMesh;

/**
 * Initialize and start the Three.js rendering pipeline.
 */
export function setupScene(state) {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: !detectPlatform(), preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);
  scene.add(camera);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = state.settings.animation;

  // Expose for export
  state.renderer = renderer;
  state.scene = scene;
  state.camera = camera;

  // Handle resize
  window.addEventListener('resize', onWindowResize);

  // Subscribe to setting changes
  state.on('settingsChanged', ({ key, value }) => updateSettings(key, value, state));

    // Load initial polytope
  const initial = state.data.geometries['Permutahedron'];
    state.setSetting('currentPolytope', initial);

    //Build Iniital Mesh
    currentMesh = buildMesh(state.settings.currentPolytope,state);
    scene.add(currentMesh);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Apply setting changes to the scene and mesh.
 */
function updateSettings(key, value, state) {
  switch (key) {
    case 'currentPolytope':
      if (currentMesh) {
        scene.remove(currentMesh);
        //currentMesh.geometry.dispose(); Need to implement this cleanup
        //currentMesh.material.dispose();
      }
      currentMesh = buildMesh(state.settings.currentPolytope, state);
      scene.add(currentMesh);
      break;

  case 'faceColor':
      if (currentMesh && currentMesh.material && state.settings.colorScheme == 'Single Color') {
          scene.remove(currentMesh);
	  currentMesh = buildMesh(state.settings.currentPolytope,state);
	  scene.add(currentMesh);
      }
      break;

  case 'colorScheme':
      if (currentMesh) {
	  scene.remove(currentMesh)
	  //currentMesh.geometry.dispose(); need to implement this cleanup
	  //currentMesh.material.dispose();
      }
      currentMesh = buildMesh(state.settings.currentPolytope,state);
      scene.add(currentMesh)
      break;
      

    case 'faceOpacity':
      if (currentMesh && currentMesh.material) {
        currentMesh.material.opacity = value;
        currentMesh.material.transparent = value < 1;
      }
      break;

    case 'showEdges':
      if (currentMesh) {
        // Remove existing edges
        currentMesh.children
          .filter(obj => obj.type === 'LineSegments')
          .forEach(obj => currentMesh.remove(obj));
        if (value) {
          const edges = new THREE.EdgesGeometry(currentMesh.geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
          currentMesh.add(line);
        }
      }
      break;

    case 'animation':
      controls.autoRotate = value;
      break;

    // Extend with other settings as needed
  }
}

/**
 * Clean up resources when needed.
 */
export function disposeScene() {
  window.removeEventListener('resize', onWindowResize);
  controls.dispose();
  renderer.dispose();
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
}
