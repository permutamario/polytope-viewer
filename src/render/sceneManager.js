// File: src/render/sceneManager.js (fixed VR camera controls)

import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';
import { applyRenderMode } from './render_modes.js';

CameraControls.install({ THREE });

let renderer, scene, camera, cameraControls, meshGroup, appState;
let controller1, controller2; // VR controllers
const clock = new THREE.Clock();

// Debug container for logging in VR
let debugPanel;

// VR camera rig
let cameraRig;

// VR interaction state
const vrControls = {
  // Rotation (trigger)
  rotating: false,
  rotateController: null,
  lastControllerPosition: new THREE.Vector3(),
  // Movement (thumbstick)
  moveSpeed: 0.05,
  rotateSpeed: 2.0,
  lastThumbstickY: 0,
  // Constants
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 15,
  // Starting position and orientation
  initialPosition: new THREE.Vector3(0, 0, 5),
  lookAtTarget: new THREE.Vector3(0, 0, 0)
};

// Log to debug panel in VR
function logDebug(message) {
  if (debugPanel) {
    const context = debugPanel.userData.context;
    const canvas = debugPanel.userData.canvas;
    
    // Clear previous content
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add new message
    context.fillStyle = 'white';
    context.font = '16px monospace';
    
    // Split message and draw each line
    const lines = message.split('\n');
    lines.forEach((line, i) => {
      context.fillText(line, 10, 25 + (i * 20));
    });
    
    // Update texture
    debugPanel.material.map.needsUpdate = true;
  }
}

// Create a simple controller representation
function createControllerModel() {
  const group = new THREE.Group();
  
  // Controller body
  const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.08, 16);
  bodyGeometry.rotateX(-Math.PI / 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);
  
  // Laser pointer for visualization
  const laserGeometry = new THREE.CylinderGeometry(0.001, 0.001, 5, 8);
  laserGeometry.rotateX(-Math.PI / 2);
  laserGeometry.translate(0, 0, -2.5); // Position forward 
  const laserMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.7
  });
  const laser = new THREE.Mesh(laserGeometry, laserMaterial);
  group.add(laser);
  
  // Trigger button indicator (red sphere)
  const triggerGeometry = new THREE.SphereGeometry(0.01, 16, 16);
  const triggerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
  trigger.position.set(0, -0.025, 0.03);
  group.add(trigger);
  group.userData.trigger = trigger;
  
  // Thumbstick
  const stickBaseGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.005, 16);
  const stickBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const stickBase = new THREE.Mesh(stickBaseGeometry, stickBaseMaterial);
  stickBase.rotation.x = Math.PI / 2;
  stickBase.position.set(0, 0.02, 0.04);
  group.add(stickBase);
  
  // Thumbstick handle that will move
  const stickGeometry = new THREE.SphereGeometry(0.006, 16, 16);
  const stickMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
  const stick = new THREE.Mesh(stickGeometry, stickMaterial);
  stick.position.set(0, 0.02, 0.04);
  group.add(stick);
  group.userData.thumbstick = stick;
  
  return group;
}

// Create debug panel for diagnostics in VR
function createDebugPanel() {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const context = canvas.getContext('2d');
  
  // Create initial background
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = '16px monospace';
  context.fillText('VR Debug Panel', 10, 25);
  
  // Create mesh with canvas texture
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const geometry = new THREE.PlaneGeometry(0.4, 0.3);
  const panel = new THREE.Mesh(geometry, material);
  
  // Store canvas and context for updates
  panel.userData = {
    canvas,
    context
  };
  
  // Position at fixed location relative to camera in VR
  panel.position.set(0, -0.3, -0.5);
  return panel;
}

// Set up VR camera rig and controllers
function setupVREnvironment() {
  // Create a rig to move the camera
  cameraRig = new THREE.Group();
  scene.add(cameraRig);
  
  // Add camera to rig
  if (camera.parent !== cameraRig) {
    if (camera.parent) camera.parent.remove(camera);
    camera.position.set(0, 0, 0); // Reset camera position relative to rig
    cameraRig.add(camera);
  }
  
  // Position the rig
  cameraRig.position.copy(vrControls.initialPosition);
  // Make camera look at center
  camera.lookAt(vrControls.lookAtTarget);
  
  // Debug panel for troubleshooting
  debugPanel = createDebugPanel();
  camera.add(debugPanel);
  
  // Set up controllers
  setupVRControllers();
  
  // Log the setup
  logDebug('VR Environment initialized\nLook at target: ' + 
          vrControls.lookAtTarget.x.toFixed(2) + ',' + 
          vrControls.lookAtTarget.y.toFixed(2) + ',' + 
          vrControls.lookAtTarget.z.toFixed(2));
  
  return cameraRig;
}

// Set up VR controllers
function setupVRControllers() {
  // Release any previous controllers
  if (controller1) {
    controller1.removeEventListener('selectstart', onSelectStart);
    controller1.removeEventListener('selectend', onSelectEnd);
    if (controller1.parent) controller1.parent.remove(controller1);
  }
  
  if (controller2) {
    controller2.removeEventListener('selectstart', onSelectStart);
    controller2.removeEventListener('selectend', onSelectEnd);
    if (controller2.parent) controller2.parent.remove(controller2);
  }
  
  // Create new controllers
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('connected', onControllerConnected);
  controller1.add(createControllerModel());
  controller1.userData.index = 0;
  scene.add(controller1);
  
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('connected', onControllerConnected);
  controller2.add(createControllerModel());
  controller2.userData.index = 1;
  scene.add(controller2);
  
  logDebug('Controllers set up');
  
  return { controller1, controller2 };
}

// Handle controller connection event
function onControllerConnected(event) {
  const controller = event.target;
  controller.userData.gamepad = event.data.gamepad;
  
  logDebug(`Controller ${controller.userData.index} connected\n` + 
           `Handedness: ${event.data.handedness}\n` +
           `Buttons: ${controller.userData.gamepad.buttons.length}\n` +
           `Axes: ${controller.userData.gamepad.axes.length}`);
}

// Handle controller select (trigger) press
function onSelectStart(event) {
  const controller = event.target;
  
  // Start rotation mode and store controller reference
  vrControls.rotating = true;
  vrControls.rotateController = controller;
  
  // Store current controller position
  controller.getWorldPosition(vrControls.lastControllerPosition);
  
  // Change trigger indicator color
  if (controller.children[0] && controller.children[0].userData.trigger) {
    controller.children[0].userData.trigger.material.color.set(0x00ff00);
  }
  
  logDebug(`Controller ${controller.userData.index} trigger pressed`);
}

function onSelectEnd(event) {
  const controller = event.target;
  
  // End rotation mode
  vrControls.rotating = false;
  vrControls.rotateController = null;
  
  // Reset trigger indicator color
  if (controller.children[0] && controller.children[0].userData.trigger) {
    controller.children[0].userData.trigger.material.color.set(0xff0000);
  }
  
  logDebug(`Controller ${controller.userData.index} trigger released`);
}

// Process VR controller inputs each frame
function updateVRControls() {
  // Only process if in VR
  if (!renderer.xr.isPresenting) return;
  
  // ROTATION (using trigger to "grab" view and rotate)
  if (vrControls.rotating && vrControls.rotateController) {
    const controller = vrControls.rotateController;
    
    // Get current controller position
    const currentPosition = new THREE.Vector3();
    controller.getWorldPosition(currentPosition);
    
    // Calculate movement delta
    const delta = new THREE.Vector3().subVectors(
      currentPosition, 
      vrControls.lastControllerPosition
    );
    
    // Apply rotation to camera rig
    // Horizontal movement (left/right) rotates around Y axis
    cameraRig.rotateY(-delta.x * vrControls.rotateSpeed);
    
    // Vertical movement (up/down) adjusts camera pitch
    // We'll apply this to camera directly to avoid gimbal lock issues
    camera.rotateX(delta.y * vrControls.rotateSpeed);
    
    // Ensure camera stays limited in vertical rotation
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'XYZ');
    euler.x = Math.max(Math.min(euler.x, Math.PI/3), -Math.PI/3); // Limit to ±60 degrees
    camera.quaternion.setFromEuler(euler);
    
    // Update stored position for next frame
    vrControls.lastControllerPosition.copy(currentPosition);
  }
  
  // MOVEMENT (using thumbstick)
  if (controller1 && controller1.userData.gamepad) {
    const gamepad = controller1.userData.gamepad;
    
    if (gamepad.axes && gamepad.axes.length >= 2) {
      const [thumbstickX, thumbstickY] = gamepad.axes;
      
      // Only process significant movement to avoid drift
      if (Math.abs(thumbstickY) > 0.15) {
        // Forward/backward movement along camera direction
        const moveAmount = -thumbstickY * vrControls.moveSpeed;
        
        // Get camera forward direction (local z-axis)
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);
        
        // Scale direction by move amount and apply to camera rig
        cameraDirection.multiplyScalar(moveAmount);
        cameraRig.position.add(cameraDirection);
        
        // Update thumbstick visualization
        if (controller1.children[0] && controller1.children[0].userData.thumbstick) {
          controller1.children[0].userData.thumbstick.position.z = 0.04 + (thumbstickY * 0.01);
        }
        
        // Log movement
        logDebug(`Moving: ${moveAmount.toFixed(3)}\n` +
                `Position: ${cameraRig.position.x.toFixed(1)}, ${cameraRig.position.y.toFixed(1)}, ${cameraRig.position.z.toFixed(1)}`);
      } else {
        // Reset thumbstick visualization
        if (controller1.children[0] && controller1.children[0].userData.thumbstick) {
          controller1.children[0].userData.thumbstick.position.z = 0.04;
        }
      }
      
      // Store for next frame
      vrControls.lastThumbstickY = thumbstickY;
    }
  }
}

// Create VR button
function createVRButton(renderer) {
  if (!('xr' in navigator)) {
    const button = document.createElement('button');
    button.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background-color: #888;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-family: sans-serif;
      opacity: 0.5;
      cursor: not-allowed;
    `;
    button.textContent = 'VR NOT SUPPORTED';
    document.body.appendChild(button);
    return button;
  }
  
  const button = document.createElement('button');
  button.style.cssText = `
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
  button.textContent = 'ENTER VR';
  
  let currentSession = null;
  
  // Handle start of VR session
  async function onSessionStart(session) {
    button.textContent = 'EXIT VR';
    
    // Set session handler
    session.addEventListener('end', onSessionEnd);
    
    // Initialize the session
    await renderer.xr.setSession(session);
    currentSession = session;
    
    // Tell user VR is active
    console.log('VR session active');
    
    // Set up VR environment with camera rig and controllers
    setupVREnvironment();
    
    // Disable regular controls
    if (cameraControls) {
      cameraControls.enabled = false;
    }
    
    // Show VR instructions
    showVRInstructions();
  }
  
  // Handle end of VR session
  function onSessionEnd() {
    currentSession.removeEventListener('end', onSessionEnd);
    button.textContent = 'ENTER VR';
    currentSession = null;
    
    // Tell user VR is inactive
    console.log('VR session ended');
    
    // Reset camera back to normal mode
    if (cameraRig && camera) {
      // Remove camera from rig
      cameraRig.remove(camera);
      scene.add(camera);
      
      // Reset camera position to default
      resetCamera();
    }
    
    // Re-enable regular controls
    if (cameraControls) {
      cameraControls.enabled = true;
    }
  }
  
  // Button click handler
  button.onclick = function() {
    if (currentSession === null) {
      // Request VR session
      const sessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor']
      };
      
      navigator.xr.requestSession('immersive-vr', sessionInit)
        .then(onSessionStart)
        .catch(error => {
          console.error('Error starting VR session:', error);
          alert('Could not start VR. Make sure your headset is connected and your browser supports WebXR.');
        });
    } else {
      // End current session
      currentSession.end();
    }
  };
  
  // Check VR support
  navigator.xr.isSessionSupported('immersive-vr')
    .then(supported => {
      if (!supported) {
        button.textContent = 'VR NOT SUPPORTED';
        button.disabled = true;
        button.style.backgroundColor = '#888';
        button.style.cursor = 'not-allowed';
      }
    });
  
  document.body.appendChild(button);
  return button;
}

// Display VR instructions
function showVRInstructions() {
  const message = 
    "QUEST CONTROLS:\n" +
    "• TRIGGER: Press to rotate view\n" +
    "• THUMBSTICK: Push forward/back to move";
  
  // Create a floating panel
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.textAlign = 'center';
  
  // Draw text
  const lines = message.split('\n');
  const lineHeight = 36;
  lines.forEach((line, i) => {
    context.fillText(line, canvas.width/2, 60 + i * lineHeight);
  });
  
  // Create panel
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const geometry = new THREE.PlaneGeometry(0.8, 0.4);
  const panel = new THREE.Mesh(geometry, material);
  
  // Position in front of user
  panel.position.set(0, 1.5, -1.5);
  panel.name = 'instructions-panel';
  scene.add(panel);
  
  // Remove after delay
  setTimeout(() => {
    scene.remove(panel);
  }, 10000);
}

// Dispose resources for a mesh group
function disposeMeshGroup(group) {
  group.traverse(obj => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
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

  // remove old group
  if (meshGroup) {
    disposeMeshGroup(meshGroup);
    scene.remove(meshGroup);
    meshGroup = null;
  }

  // build either lines or meshes
  meshGroup = buildMesh(appState.currentPolytope, appState.settings);
  scene.add(meshGroup);

  // Restore previous rotation if available
  if (oldRotation) {
    meshGroup.rotation.copy(oldRotation);
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

  // Reset camera position
  if (reset) {
    resetCamera();
  }
}

// Reset camera to initial position
function resetCamera() {
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
  
  // Set initial VR position for when entering VR
  vrControls.initialPosition.set(0, 0, distance);
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

  // Only update regular controls if not in VR
  if (!renderer.xr.isPresenting) {
    cameraControls.update(delta);

    // Auto-rotate the mesh group if enabled
    if (appState.settings.animation && meshGroup) {
      meshGroup.rotation.y += 0.2 * delta; // adjust rotation speed as needed
    }
    
    renderer.render(scene, camera);
  } else {
    // In VR mode, handle the VR-specific controls
    updateVRControls();
  }
}

export function setupScene(state) {
  appState = state;

  // Renderer with transparent background
  renderer = new THREE.WebGLRenderer({
    antialias: !detectPlatform(),
    preserveDrawingBuffer: true,
    alpha: true // Enable transparency
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Set clear color with alpha = 0 for transparency
  renderer.setClearColor(0x000000, 0);
  
  // mount point
  let container = document.getElementById('viewer-canvas');
  if (!container) {
    container = document.createElement('div');
    container.id = 'viewer-canvas';
    document.body.appendChild(container);
  }
  container.appendChild(renderer.domElement);

  // Scene & Camera
  scene = new THREE.Scene();
  // Set scene background to transparent
  scene.background = null;
  
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  scene.add(camera);

  // Default lights
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
  
  // Set up VR animation loop
  renderer.setAnimationLoop(function() {
    // This loop runs continuously in VR mode
    if (renderer.xr.isPresenting) {
      // Update VR-specific logic
      updateVRControls();
      
      // Auto-rotate can work in VR too
      if (appState.settings.animation && meshGroup) {
        meshGroup.rotation.y += 0.002;
      }
      
      renderer.render(scene, camera);
    }
  });
  
  // Create VR button
  createVRButton(renderer);

  // expose to state
  state.renderer = renderer;
  state.scene = scene;
  state.camera = camera;
  state.cameraControls = cameraControls;

  // event listeners
  window.addEventListener('resize', onWindowResize);
  state.on('polytopeChanged', () => updatePolytope());
  state.on('settingsChanged', ({ key, value }) => updateSettings(key, value));

  // initial draw & loop
  updatePolytope();
  animate();
}