// File: src/render/sceneManager.js (with Meta Quest-optimized controls)

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
  grabbed: false,
  grabbing: false,
  lastPosition: new THREE.Vector3(),
  lastRotation: new THREE.Euler(),
  initialDistance: 0,
  initialScale: 1,
  // Store thumbstick state
  thumbstick: {
    lastValue: 0,
    zoomSpeed: 0.1
  }
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
  
  // Add trigger area visualization
  const triggerGeometry = new THREE.SphereGeometry(0.012, 16, 16);
  const triggerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff5722,
    roughness: 0.3,
    metalness: 0.8
  });
  const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
  trigger.position.y = -0.02; // Position at trigger location
  trigger.position.z = 0.02;
  mesh.add(trigger);
  
  // Add thumbstick visualization
  const thumbstickBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
  thumbstickBase.rotation.x = Math.PI/2;
  thumbstickBase.position.set(0, 0.02, 0.03);
  mesh.add(thumbstickBase);
  
  const thumbstickHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.007, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x2196f3 })
  );
  thumbstickHead.position.set(0, 0.02, 0.03); // Will be updated when thumbstick moves
  mesh.add(thumbstickHead);
  mesh.userData.thumbstickHead = thumbstickHead; // Store reference for animation
  
  return mesh;
}

// Set up VR controllers
function setupVRControllers(renderer, scene) {
  // Controller 1
  controller1 = renderer.xr.getController(0);
  controller1.userData.index = 0;
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('connected', onControllerConnected);
  controller1.addEventListener('disconnected', onControllerDisconnected);
  scene.add(controller1);
  
  // Controller 2
  controller2 = renderer.xr.getController(1);
  controller2.userData.index = 1;
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('connected', onControllerConnected);
  controller2.addEventListener('disconnected', onControllerDisconnected);
  scene.add(controller2);
  
  // Add visual models for the controllers
  const controllerModel1 = createControllerModel();
  const controllerModel2 = createControllerModel();
  controller1.add(controllerModel1);
  controller2.add(controllerModel2);
  
  return { controller1, controller2 };
}

// Handle controller connection
function onControllerConnected(event) {
  const controller = event.target;
  console.log(`Controller ${controller.userData.index} connected:`, event.data);
  
  // Store gamepad reference for accessing thumbstick data
  controller.userData.gamepad = event.data.gamepad;
}

// Handle controller disconnection
function onControllerDisconnected(event) {
  const controller = event.target;
  console.log(`Controller ${controller.userData.index} disconnected`);
  controller.userData.gamepad = null;
}

// Handle trigger press - grab for rotation
function onSelectStart(event) {
  const controller = event.target;
  vrInteraction.grabbed = true;
  vrInteraction.grabController = controller;
  
  // Record current position and rotation for reference
  controller.getWorldPosition(vrInteraction.lastPosition);
  if (meshGroup) {
    vrInteraction.lastRotation.copy(meshGroup.rotation);
  }
  
  console.log(`Controller ${controller.userData.index} grab start`);
}

function onSelectEnd(event) {
  vrInteraction.grabbed = false;
  vrInteraction.grabController = null;
  console.log(`Controller ${event.target.userData.index} grab end`);
}

// Process controller interactions
function updateVRInteractions() {
  if (!meshGroup) return;
  
  // GRAB & ROTATE (trigger button)
  if (vrInteraction.grabbed && vrInteraction.grabController) {
    const controller = vrInteraction.grabController;
    
    // Get current controller position
    const currentPosition = new THREE.Vector3();
    controller.getWorldPosition(currentPosition);
    
    // Calculate movement delta
    const delta = new THREE.Vector3().subVectors(currentPosition, vrInteraction.lastPosition);
    
    // Apply rotation based on controller movement
    // Horizontal movement (left/right) controls Y rotation
    meshGroup.rotation.y += delta.x * 3;
    
    // Vertical movement (up/down) controls X rotation
    meshGroup.rotation.x += delta.y * 3;
    
    // Update position for next frame
    vrInteraction.lastPosition.copy(currentPosition);
  }
  
  // THUMBSTICK ZOOM (left controller thumbstick Y-axis)
  // Check if controller1 gamepad is available
  if (controller1 && controller1.userData.gamepad) {
    const gamepad = controller1.userData.gamepad;
    
    // Get thumbstick Y value (up/down)
    // Gamepad axes typically have: [left stick X, left stick Y, right stick X, right stick Y]
    if (gamepad.axes.length >= 2) {
      const thumbstickY = gamepad.axes[1]; // Y-axis of left thumbstick
      
      // Only respond to significant thumbstick movement
      if (Math.abs(thumbstickY) > 0.1) {
        // Apply zoom based on thumbstick position
        // Push forward (negative Y) to zoom in, pull back (positive Y) to zoom out
        const scaleFactor = 1 + (thumbstickY * vrInteraction.thumbstick.zoomSpeed);
        meshGroup.scale.multiplyScalar(scaleFactor);
        
        // Update thumbstick visualization if it exists
        if (controller1.children[0] && controller1.children[0].userData.thumbstickHead) {
          const thumbstickHead = controller1.children[0].userData.thumbstickHead;
          thumbstickHead.position.z = 0.03 - (thumbstickY * 0.01);
        }
      } else {
        // Reset thumbstick visualization
        if (controller1.children[0] && controller1.children[0].userData.thumbstickHead) {
          const thumbstickHead = controller1.children[0].userData.thumbstickHead;
          thumbstickHead.position.z = 0.03;
        }
      }
      
      vrInteraction.thumbstick.lastValue = thumbstickY;
    }
  }
  
  // You could also add right controller thumbstick for other features if needed
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
        // Reset scale without overriding initial scale
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
    "META QUEST CONTROLS:\n" +
    "• TRIGGER: Grab to rotate polytope\n" +
    "• LEFT THUMBSTICK: Zoom in/out";
  
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
  state.on('settingsChanged', ({ key, value }) => updateSettings(key, value));

  // initial draw & loop
  updatePolytope();
  animate();
}