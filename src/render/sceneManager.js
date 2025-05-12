// File: src/render/sceneManager.js (with VR and controller interactions)

import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';
import { applyRenderMode } from './render_modes.js';

CameraControls.install({ THREE });

let renderer, scene, camera, cameraControls, meshGroup, appState;
let controller1, controller2; // VR controllers
let controllerGrip1, controllerGrip2; // Controller models
const clock = new THREE.Clock();

// VR interaction state
const vrInteraction = {
  rotating: false,
  scaling: false,
  panning: false,
  lastPosition1: new THREE.Vector3(),
  lastPosition2: new THREE.Vector3(),
  initialDistance: 0,
  initialScale: 1
};

// Create a simple controller representation
function createControllerModel() {
  const geometry = new THREE.CylinderGeometry(0.01, 0.02, 0.08, 16);
  geometry.rotateX(-Math.PI / 2); // Orient the cylinder along the controller
  const material = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.5
  });
  const mesh = new THREE.Mesh(geometry, material);
  
  // Add a pointer/beam
  const pointerGeometry = new THREE.CylinderGeometry(0.002, 0.001, 0.2, 8);
  pointerGeometry.rotateX(-Math.PI / 2);
  pointerGeometry.translate(0, 0, -0.1); // Position the pointer forward
  const pointerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
  mesh.add(pointer);
  
  // Add grip
  const gripGeometry = new THREE.SphereGeometry(0.025, 16, 16);
  const gripMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2196f3,
    roughness: 0.3,
    metalness: 0.8
  });
  const grip = new THREE.Mesh(gripGeometry, gripMaterial);
  grip.position.y = 0.04; // Offset from controller center
  mesh.add(grip);
  
  return mesh;
}

// Set up VR controllers
function setupVRControllers(renderer, scene) {
  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.userData.index = 0;
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  scene.add(controller1);
  
  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.userData.index = 1;
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  scene.add(controller2);
  
  // Add visual models for the controllers
  const controllerModel1 = createControllerModel();
  const controllerModel2 = createControllerModel();
  controller1.add(controllerModel1);
  controller2.add(controllerModel2);
  
  return { controller1, controller2 };
}

// Handle controller select (primary button) press - rotate
function onSelectStart(event) {
  const controller = event.target;
  vrInteraction.rotating = true;
  
  // Record current position for rotation reference
  controller.getWorldPosition(vrInteraction.lastPosition1);
  console.log(`Controller ${controller.userData.index} select start`);
}

function onSelectEnd(event) {
  vrInteraction.rotating = false;
  console.log(`Controller ${event.target.userData.index} select end`);
}

// Handle controller squeeze (grip button) press - pan/zoom
function onSqueezeStart(event) {
  const controller = event.target;
  
  if (controller.userData.index === 0) {
    controller1.getWorldPosition(vrInteraction.lastPosition1);
  } else {
    controller2.getWorldPosition(vrInteraction.lastPosition2);
  }
  
  // If both controllers are squeezing, enter scaling (zoom) mode
  if (controller1.userData.squeezing && controller2.userData.squeezing) {
    vrInteraction.scaling = true;
    
    // Calculate initial distance between controllers
    const pos1 = new THREE.Vector3();
    const pos2 = new THREE.Vector3();
    controller1.getWorldPosition(pos1);
    controller2.getWorldPosition(pos2);
    vrInteraction.initialDistance = pos1.distanceTo(pos2);
    
    // Record initial scale
    vrInteraction.initialScale = meshGroup.scale.x;
  } else {
    // Single controller squeeze = pan
    vrInteraction.panning = true;
  }
  
  controller.userData.squeezing = true;
  console.log(`Controller ${controller.userData.index} squeeze start`);
}

function onSqueezeEnd(event) {
  const controller = event.target;
  controller.userData.squeezing = false;
  
  // Reset interaction states if needed
  if (controller1 && controller2 && 
      !controller1.userData.squeezing && !controller2.userData.squeezing) {
    vrInteraction.panning = false;
    vrInteraction.scaling = false;
  }
  
  console.log(`Controller ${controller.userData.index} squeeze end`);
}

// Process controller interactions
function updateVRInteractions() {
  if (!meshGroup || !controller1 || !controller2) return;
  
  // Get current controller positions
  const currentPos1 = new THREE.Vector3();
  const currentPos2 = new THREE.Vector3();
  controller1.getWorldPosition(currentPos1);
  controller2.getWorldPosition(currentPos2);
  
  // ROTATION (select button)
  if (vrInteraction.rotating) {
    // Calculate movement direction
    const movement = new THREE.Vector3().subVectors(currentPos1, vrInteraction.lastPosition1);
    
    // Apply rotation based on controller movement
    meshGroup.rotation.y += movement.x * 2; // Horizontal movement = Y rotation
    meshGroup.rotation.x += movement.y * 2; // Vertical movement = X rotation
    
    // Update last position
    vrInteraction.lastPosition1.copy(currentPos1);
  }
  
  // SCALING/ZOOMING (both grip buttons)
  if (vrInteraction.scaling) {
    // Calculate current distance between controllers
    const currentDistance = currentPos1.distanceTo(currentPos2);
    
    // Calculate scale factor based on how controllers are moving
    const scaleFactor = currentDistance / vrInteraction.initialDistance;
    
    // Apply scaling
    const newScale = vrInteraction.initialScale * scaleFactor;
    meshGroup.scale.set(newScale, newScale, newScale);
  }
  
  // PANNING (single grip button)
  if (vrInteraction.panning && !vrInteraction.scaling) {
    // Only use active controller
    const activeController = controller1.userData.squeezing ? controller1 : controller2;
    const lastPos = controller1.userData.squeezing ? vrInteraction.lastPosition1 : vrInteraction.lastPosition2;
    const currentPos = controller1.userData.squeezing ? currentPos1 : currentPos2;
    
    // Calculate movement vector
    const movement = new THREE.Vector3().subVectors(currentPos, lastPos);
    
    // Apply movement to mesh position
    meshGroup.position.add(movement.multiplyScalar(2));
    
    // Update last position
    if (controller1.userData.squeezing) {
      vrInteraction.lastPosition1.copy(currentPos1);
    } else {
      vrInteraction.lastPosition2.copy(currentPos2);
    }
  }
}

// New function to create a simple VR button without needing external files
function createVRButton(renderer) {
  // Only create button if WebXR is supported
  if ('xr' in navigator) {
    const vrButton = document.createElement('button');
    vrButton.id = 'vr-button';
    vrButton.style.cssText = `
      position: absolute;
      bottom: 140px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      z-index: 999;
      font-family: sans-serif;
    `;
    vrButton.textContent = 'ENTER VR';
    
    let xrSession = null;
    
    // Handle starting VR session
    async function onSessionStarted(session) {
      session.addEventListener('end', onSessionEnded);
      await renderer.xr.setSession(session);
      vrButton.textContent = 'EXIT VR';
      xrSession = session;
      
      // Set up controllers when entering VR
      setupVRControllers(renderer, scene);
      
      // Disable regular controls in VR
      if (cameraControls) {
        cameraControls.enabled = false;
      }
      
      // Show VR usage instructions
      showVRInstructions();
    }
    
    // Handle ending VR session
    function onSessionEnded() {
      xrSession.removeEventListener('end', onSessionEnded);
      vrButton.textContent = 'ENTER VR';
      xrSession = null;
      
      // Re-enable regular controls
      if (cameraControls) {
        cameraControls.enabled = true;
      }
      
      // Reset polytope position and scale if it was modified in VR
      if (meshGroup) {
        meshGroup.position.set(0, 0, 0);
        meshGroup.scale.set(1, 1, 1);
      }
    }
    
    // Handle button click
    vrButton.onclick = function() {
      if (xrSession === null) {
        // Request a VR session
        const sessionInit = { 
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] 
        };
        navigator.xr.requestSession('immersive-vr', sessionInit)
          .then(onSessionStarted)
          .catch(error => {
            console.error('Failed to start VR session:', error);
            alert('Could not start VR session. VR might not be supported by your browser or device.');
          });
      } else {
        // End the current session
        xrSession.end();
      }
    };
    
    // Check if VR is supported
    navigator.xr.isSessionSupported('immersive-vr')
      .then(supported => {
        if (!supported) {
          vrButton.textContent = 'VR NOT SUPPORTED';
          vrButton.disabled = true;
          vrButton.style.backgroundColor = '#888';
          vrButton.style.cursor = 'not-allowed';
        }
      })
      .catch(error => {
        console.error('Error checking VR support:', error);
        vrButton.textContent = 'VR ERROR';
        vrButton.disabled = true;
        vrButton.style.backgroundColor = '#888';
      });
    
    document.body.appendChild(vrButton);
    return vrButton;
  }
  
  return null;
}

// Display VR controls instructions
function showVRInstructions() {
  // Create a text geometry to display in VR
  const message = 
    "VR CONTROLS:\n" +
    "• TRIGGER: Rotate (point & hold)\n" +
    "• GRIP: Pan (single) or Zoom (both)";
  
  // Create a floating panel in VR space
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(0,0,0,0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.textAlign = 'center';
  
  // Split message lines and draw text
  const lines = message.split('\n');
  const lineHeight = 36;
  lines.forEach((line, i) => {
    context.fillText(line, canvas.width/2, 60 + i * lineHeight);
  });
  
  // Create texture and panel
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const geometry = new THREE.PlaneGeometry(1, 0.5);
  const panel = new THREE.Mesh(geometry, material);
  
  // Position the panel in front of the user
  panel.position.set(0, 1.4, -1.5);
  panel.name = 'instructions-panel';
  scene.add(panel);
  
  // Remove after a delay
  setTimeout(() => {
    scene.remove(panel);
    panel.material.dispose();
    panel.geometry.dispose();
  }, 10000);
}

/**
 * Recursively dispose every geometry & material in a group.
 */
function disposeMeshGroup(group) {
  group.traverse(obj => {
    // any three.js object that holds a geometry
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    // single material or array of materials
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}

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
  //Preserve existing rotation (if any)
  const oldRotation = meshGroup ? meshGroup.rotation.clone() : null;
  const oldPosition = meshGroup ? meshGroup.position.clone() : null;
  const oldScale = meshGroup ? meshGroup.scale.clone() : null;

  // remove old group
  if (meshGroup) {
    disposeMeshGroup(meshGroup);
    scene.remove(meshGroup);
    meshGroup = null;
  }

  // build either lines or meshes
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);

  // Restore previous transforms if available and not resetting
  if (!reset) {
    if (oldRotation) meshGroup.rotation.copy(oldRotation);
    if (oldPosition) meshGroup.position.copy(oldPosition);
    if (oldScale) meshGroup.scale.copy(oldScale);
  }

  // apply render mode if not wireframe
  if (appState.settings.renderMode.material !== 'wireframe') {
    applyRenderMode(
      scene,
      meshGroup,
      appState.settings
    );
  }

  // showEdges overlay
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

  // camera reset
  if (reset) {
    cameraControls.reset();
    const center = appState.currentPolytope.center || [0, 0, 0];
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
    
    // Reset the mesh group position and scale
    meshGroup.position.set(0, 0, 0);
    meshGroup.scale.set(1, 1, 1);
  }
}

function updateSettings(key, value) {
  switch (key) {
    case 'showEdges':
    case 'colorScheme':
    case 'faceOpacity':
    case 'renderModeName':
      updatePolytope(false);
      break;

  case 'animation':
      appState.settings.animation = value;
      updatePolytope(false);
      break;

    default:
      // do nothing for unrecognized keys
      break;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // Use requestAnimationFrame only if not in VR
  if (!renderer.xr.isPresenting) {
    requestAnimationFrame(animate);
  }
  
  const delta = clock.getDelta();

  // Only update controls if not in VR
  if (!renderer.xr.isPresenting) {
    cameraControls.update(delta);

    // Auto-rotate the mesh group if enabled
    if (appState.settings.animation && meshGroup) {
      meshGroup.rotation.y += 0.2 * delta; // adjust rotation speed as needed
    }
    
    renderer.render(scene, camera);
  }
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
  
  // Enable WebXR
  renderer.xr.enabled = true;
  
  // Set up VR animation loop (required for WebXR)
  renderer.setAnimationLoop(function() {
    // This will be used when in VR mode
    if (renderer.xr.isPresenting) {
      // Process VR controller interactions
      updateVRInteractions();
      
      // Auto-rotate can still work in VR if desired
      if (appState.settings.animation && meshGroup) {
        meshGroup.rotation.y += 0.002; // slower rotation in VR
      }
      
      renderer.render(scene, camera);
    }
  });
  
  // Create VR button
  createVRButton(renderer);

  // expose to state
  state.renderer       = renderer;
  state.scene          = scene;
  state.camera         = camera;
  state.cameraControls = cameraControls;

  // event listeners
  window.addEventListener('resize', onWindowResize);
  state.on('polytopeChanged', () => updatePolytope());
    state.on('settingsChanged', ({ key ,value}) => updateSettings(key,value));

  // initial draw & loop
  updatePolytope();
  animate();
}