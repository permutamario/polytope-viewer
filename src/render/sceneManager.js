// File: src/render/sceneManager.js

import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';

// Install camera-controls with THREE subset
CameraControls.install({ THREE });

let renderer;
let scene;
let camera;
let controls;
let meshGroup;
let appState;
const clock = new THREE.Clock();

/**
 * Initializes the entire scene: renderer, scene, camera, controls, and mesh.
 * @param {Object} state - The application state object
 */
export function setupScene(state) {
  appState = state;
  initializeRenderer();
  initializeScene();
  initializeCamera();
  initializeLights();
  initializeControls();
  setupResizeHandler();
  buildAndDisplayMesh();
  registerEventHandlers();
  animate();
}

/**
 * Creates and configures the WebGL renderer.
 */
function initializeRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: !detectPlatform(),
    preserveDrawingBuffer: true
  });
  renderer.sortObjects = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  appState.renderer = renderer;
}

/**
 * Sets up the Three.js scene.
 */
function initializeScene() {
  scene = new THREE.Scene();
  appState.scene = scene;
}

/**
 * Configures the perspective camera.
 */
function initializeCamera() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  scene.add(camera);
  appState.camera = camera;
}

/**
 * Adds ambient and directional lighting.
 */
function initializeLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 7.5);
  scene.add(directional);
}

/**
 * Sets up camera-controls for user interaction.
 */
function initializeControls() {
  controls = new CameraControls(camera, renderer.domElement);
  controls.enableDamping = true;
  appState.cameraControls = controls;
}

/**
 * Attaches the window resize handler.
 */
function setupResizeHandler() {
  window.addEventListener('resize', onWindowResize);
}

/**
 * Window resize event handler.
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Builds the mesh group and adds it to the scene, with edges if enabled.
 */
function buildAndDisplayMesh() {
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);
  if (appState.settings.showEdges) {
    addEdges(meshGroup);
  }
  frameCamera();
}

/**
 * Registers named event handlers for state changes.
 */
function registerEventHandlers() {
  appState.on('polytopeChanged', onPolytopeChanged);
  appState.on('settingsChanged', onSettingsChanged);
}

/**
 * Handler for polytopeChanged: rebuilds mesh and updates view.
 */
function onPolytopeChanged() {
  scene.remove(meshGroup);
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);
  if (appState.settings.showEdges) {
    addEdges(meshGroup);
  }
  frameCamera();
}

/**
 * Handler for settingsChanged: rebuilds or updates mesh according to key.
 * @param {{ key: string, value: any }} change
 */
function onSettingsChanged(change) {
  const key = change.key;
  if (key === 'colorScheme' || key === 'faceOpacity') {
    scene.remove(meshGroup);
    meshGroup = buildMesh(appState.currentPolytope, appState.settings);
    scene.add(meshGroup);
    if (appState.settings.showEdges) {
      addEdges(meshGroup);
    }
  } else if (key === 'showEdges') {
    if (appState.settings.showEdges) {
      addEdges(meshGroup);
    } else {
      removeEdges(meshGroup);
    }
  }
  // animation flag is handled in the render loop
}

/**
 * Continuously renders the scene and applies auto-rotation.
 */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (appState.settings.animation) {
    controls.rotate(-Math.PI / 8 * delta, 0, false);
  }
  controls.update(delta);
  renderer.render(scene, camera);
}

/**
 * Frames the camera to fit the current polytope in view.
 */
function frameCamera() {
  const polytope = appState.currentPolytope;
  const center = polytope.center || [0, 0, 0];
  const maxDistance = Math.max(
    1,
    ...polytope.vertices.map(v => Math.hypot(
      v[0] - center[0],
      v[1] - center[1],
      v[2] - center[2]
    ))
  );
  const factor = detectPlatform() ? 4 : 2.5;
  const distance = maxDistance * factor;
  controls.setLookAt(
    center[0], center[1], center[2] + distance,
    center[0], center[1], center[2],
    true
  );
}

/**
 * Adds edge helpers to each face mesh in the group.
 * @param {THREE.Group} group
 */
function addEdges(group) {
  group.children.forEach(faceMesh => {
    const edges = new THREE.EdgesGeometry(faceMesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        depthWrite: false,
        depthTest: true
      })
    );
    line.userData.isEdgeHelper = true;
    faceMesh.add(line);
  });
}

/**
 * Removes edge helpers from each face mesh in the group.
 * @param {THREE.Group} group
 */
function removeEdges(group) {
  group.children.forEach(faceMesh => {
    faceMesh.children
      .filter(child => child.userData.isEdgeHelper)
      .forEach(helper => faceMesh.remove(helper));
  });
}

/**
 * Disposes of all resources and event listeners.
 */
export function disposeScene() {
  window.removeEventListener('resize', onWindowResize);
  controls.dispose();
  renderer.dispose();
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}
