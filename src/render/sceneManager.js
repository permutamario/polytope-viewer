// src/render/sceneManager.js
import * as THREE from '../../vendor/three.module.js';
import CameraControls from '../../vendor/camera-controls/camera-controls.module.js';
import { buildMesh } from './meshBuilder.js';
import { detectPlatform } from '../core/utils.js';

// Install camera-controls with THREE subset
CameraControls.install({ THREE });

let renderer, scene, camera, cameraControls;
const clock = new THREE.Clock();
let currentMesh;
let autoRotate = false;
const AUTO_ROTATE_SPEED = Math.PI / 8; // radians per second

/**
 * Calculate appropriate camera distance based on polytope size
 * @param {Object} polytope - The polytope object with vertices
 * @param {Boolean} isMobile - Whether we're on mobile or desktop
 * @returns {Number} - The recommended camera distance
 */
function calculateCameraDistance(polytope, isMobile) {
    // If no vertices, return a default distance
    if (!polytope.vertices || polytope.vertices.length === 0) {
        return 5;
    }
    
    // Find the maximum distance from center to any vertex
    let maxDistance = 0;
    const center = polytope.center || [0, 0, 0];
    for (const vertex of polytope.vertices) {
        const dx = vertex[0] - center[0];
        const dy = vertex[1] - center[1];
        const dz = vertex[2] - center[2];
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        maxDistance = Math.max(maxDistance, distance);
    }
    
    // Apply a padding factor to ensure the polytope fits in view
    // Use a larger factor for mobile to zoom out more
    const paddingFactor = isMobile ? 4 : 2.5;
    
    // Return the adjusted distance
    return maxDistance * paddingFactor;
}

/**
 * Initialize and start the Three.js rendering pipeline using camera-controls.
 */
export function setupScene(state) {
    // Renderer initialization
    renderer = new THREE.WebGLRenderer({ antialias: !detectPlatform(), preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create a container for the renderer if it doesn't exist
    let viewerCanvas = document.getElementById('viewer-canvas');
    if (!viewerCanvas) {
        viewerCanvas = document.createElement('div');
        viewerCanvas.id = 'viewer-canvas';
        document.body.appendChild(viewerCanvas);
    }

    // Append the renderer to the viewer canvas
    viewerCanvas.appendChild(renderer.domElement);

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

    // CameraControls
    cameraControls = new CameraControls(camera, renderer.domElement);
    cameraControls.mouseButtons.right = CameraControls.ACTION.OFFSET;
    cameraControls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
    cameraControls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_OFFSET;
    cameraControls.touches.three = CameraControls.ACTION.TOUCH_OFFSET;
    cameraControls.enableDamping = true;
    cameraControls.minPolarAngle = -Infinity;
    cameraControls.maxPolarAngle = Infinity;

    // Expose for external use
    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;
    state.cameraControls = cameraControls;

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // React to setting changes
    state.on('settingsChanged', ({ key, value }) => updateSettings(key, value, state));

    // Load and set initial polytope
    const initial = state.data.geometries['Permutahedron'];
    state.setSetting('currentPolytope', initial);

    // Build and add mesh
    currentMesh = buildMesh(state.settings.currentPolytope, state);
    scene.add(currentMesh);

    // Set the target to the polytope center (this is the orbit point)
    const center = state.settings.currentPolytope.center;
    //cameraControls.setOrbitPoint(center[0], center[1], center[2], false);
    
    // Calculate and set appropriate initial camera distance
    const initialDistance = calculateCameraDistance(state.settings.currentPolytope, detectPlatform());
    const cameraPosition = new THREE.Vector3(center[0], center[1], center[2] + initialDistance);
    cameraControls.setLookAt(
        cameraPosition.x, 
        cameraPosition.y, 
        cameraPosition.z,
        center[0],
        center[1],
        center[2],
        true
    );

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Auto-rotate if enabled
    if (autoRotate) {
        // Use the rotate method of cameraControls to properly rotate around the target
        cameraControls.rotate(-AUTO_ROTATE_SPEED * delta, 0, false);
    }

    // Update the controls - this is critical for making the rotation work
    cameraControls.update(delta);
    renderer.render(scene, camera);
}

function onWindowResize() {
    // Update camera aspect ratio based on window dimensions
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Resize renderer to match window dimensions
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Apply setting changes to the scene and mesh.
 */
function updateSettings(key, value, state) {
    switch (key) {
    case 'currentPolytope':
        if (currentMesh) scene.remove(currentMesh);
        currentMesh = buildMesh(state.settings.currentPolytope, state);
        scene.add(currentMesh);
        
        // Update the target/orbit point to the new polytope's center
        const center = state.settings.currentPolytope.center;
        //cameraControls.setOrbitPoint(center[0], center[1], center[2], false);
        
        // Calculate appropriate camera distance based on polytope size
        const isMobile = detectPlatform();
        const distance = calculateCameraDistance(state.settings.currentPolytope, isMobile);
        
        // Position the camera at the calculated distance along the z-axis
        const cameraPosition = new THREE.Vector3(
            center[0], 
            center[1], 
            center[2] + distance
        );
        cameraControls.reset();
        cameraControls.setPosition(center[0], center[1], center[2] + 3*distance, false);
        cameraControls.setLookAt(
            cameraPosition.x, 
            cameraPosition.y, 
            cameraPosition.z,
            center[0],
            center[1],
            center[2],
            true
        );
        //cameraControls.setTarget(center[0]+ 100,center[1],center[2]);
        
        break;

    case 'faceColor':
        if (currentMesh && state.settings.colorScheme === 'Single Color') {
            scene.remove(currentMesh);
            currentMesh = buildMesh(state.settings.currentPolytope, state);
            scene.add(currentMesh);
        }
        break;

    case 'colorScheme':
        if (currentMesh) scene.remove(currentMesh);
        currentMesh = buildMesh(state.settings.currentPolytope, state);
        scene.add(currentMesh);
        break;

    case 'faceOpacity':
        if (currentMesh) {
            // Handle array of materials case
            if (Array.isArray(currentMesh.material)) {
                currentMesh.material.forEach(mat => {
                    mat.opacity = value;
                    mat.transparent = value < 1;
                    mat.needsUpdate = true;
                    
                    // Ensure proper depth handling for transparency
                    mat.depthWrite = value >= 0.95;
                });
            } 
            // Handle single material case
            else if (currentMesh.material) {
                currentMesh.material.opacity = value;
                currentMesh.material.transparent = value < 1;
                currentMesh.material.needsUpdate = true;
                
                // Ensure proper depth handling for transparency
                currentMesh.material.depthWrite = value >= 0.95;
            }
        }
        break;

    case 'showEdges':
        if (currentMesh) {
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
        autoRotate = value;
        break;

        // Extend with other settings as needed
    }
}
/**
 * Clean up resources when needed.
 */
export function disposeScene() {
    window.removeEventListener('resize', onWindowResize);
    cameraControls.dispose();
    renderer.dispose();
    scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
}
