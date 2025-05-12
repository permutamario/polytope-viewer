// src/render/exportManager.js
import { detectPlatform } from '../core/utils.js';
import { getState } from '../core/stateManager.js';
// Don't use ES module import since GIF.js isn't exported as an ES module
// The library is likely loaded via script tag and available globally

/**
 * Export the current WebGL canvas as a PNG image.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 */
export function exportPNG(renderer, scene, camera) {
  if (!renderer || !scene || !camera) {
    console.error("Cannot export: Renderer or scene not initialized.");
    alert("Cannot export image: Viewer not ready.");
    return;
  }
  try {
    // Ensure last frame is rendered
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'polytope_export.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to export canvas to PNG:", error);
    alert("Error exporting image. Check console for details.");
  }
}

/**
 * Export an animated GIF of the rotating polytope.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {number} duration - total seconds to record (default 3)
 * @param {number} fps      - frames per second (default 15)
 * @param {number} quality  - GIF.js quality (1-30, lower = better) (default 10)
 */
export function exportGIF(renderer, scene, camera, duration = 3, fps = 15, quality = 10) {
  // Alert user that we're starting GIF creation
  console.log(`Creating GIF: ${duration}s @ ${fps} FPS, quality ${quality}`);

  // Adjust parameters for mobile
  const useMobile = detectPlatform();
  const actualFps = fps;
  const actualQuality = quality;
  const actualDuration = duration;

  if (!renderer || !scene || !camera) {
    console.error("Cannot export GIF: Viewer not initialized.");
    alert("Cannot export GIF: Viewer not ready.");
    return;
  }

  // First check - verify GIF library is available
  if (typeof window.GIF === 'undefined') {
    console.error("GIF.js library not loaded.");
    alert("GIF export requires the GIF.js library. Please check the console for more details.");
    return;
  }

  // Create on-screen progress indicator
  const progressDiv = document.createElement('div');
  Object.assign(progressDiv.style, {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', padding: '20px',
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    borderRadius: '5px', zIndex: 1000,
    fontFamily: 'sans-serif'
  });
  progressDiv.textContent = 'Recording frames...';
  document.body.appendChild(progressDiv);

  // Save prior autorotation state and force-enable autorotation
  const wasAutorotating = getState().settings.animation;
  getState().setSetting("animation", true);

  try {
    // Prepare GIF.js encoder with full path to worker
    const gif = new window.GIF({
      workers: 2,
      quality: actualQuality,
      // Fix worker path if needed - ensure this resolves correctly
      workerScript: '././vendor/gif.js/gif.worker.js'  // Use absolute path from root
    });

    // Progress callback
    gif.on('progress', p => {
      console.log(`GIF processing: ${Math.round(p * 100)}%`);  // Add console logging
      progressDiv.textContent = `Processing frames: ${Math.round(p * 100)}%`;
    });

    // Finished callback
    gif.on('finished', blob => {
      // Restore autorotating
      getState().setSetting("animation", wasAutorotating);

      // Remove progress indicator
      document.body.removeChild(progressDiv);

      // Download GIF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'polytope_animation.gif';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke object URL shortly after
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });

    // Error handler
    gif.on('error', error => {
      console.error("GIF generation error:", error);
      progressDiv.textContent = `Error: ${error.message || "GIF creation failed"}`;
      setTimeout(() => {
        document.body.removeChild(progressDiv);
        getState().setSetting("animation", wasAutorotating);
      }, 3000);
    });

    // Calculate total frames & rotation increment
    const totalFrames = Math.floor(actualDuration * actualFps);
    const totalRotation = Math.PI; // 360° turn
    const rotationIncrement = totalRotation / totalFrames;
    let framesCaptured = 0;

    // Capture loop
    function capture() {
      if (framesCaptured >= totalFrames) {
        progressDiv.textContent = 'Processing GIF...';
        setTimeout(() => gif.render(), 100); // Slight delay before processing
        return;
      }
      
      // Update progress
      progressDiv.textContent = `Recording frames: ${Math.round((framesCaptured / totalFrames) * 100)}%`;
      
      // Render and add frame
      renderer.render(scene, camera);
      gif.addFrame(renderer.domElement, { copy: true, delay: 1000 / actualFps });
      framesCaptured++;

      // Rotate the entire scene subtly
      scene.rotation && (scene.rotation.y += rotationIncrement);

      // Queue next frame
      requestAnimationFrame(capture);
    }

    // Start capturing
    capture();
  } catch (error) {
    console.error("Failed to initialize GIF export:", error);
    progressDiv.textContent = `Error: ${error.message || "GIF initialization failed"}`;
    setTimeout(() => {
      document.body.removeChild(progressDiv);
      getState().setSetting("animation", wasAutorotating);
    }, 3000);
  }
}

/**
 * Export the current polytope as SageMath code
 * @param {Object} polytope - The polytope object with vertices
 */
export function exportToSageMath(polytope) {
  if (!polytope || !polytope.vertices || polytope.vertices.length === 0) {
    console.error("Cannot export: No polytope data available.");
    alert("Cannot export: No polytope data available.");
    return;
  }
  
  try {
    // Format vertices as a Python list of lists
    const verticesStr = JSON.stringify(polytope.vertices)
      .replace(/\[/g, '[')  // Replace square brackets
      .replace(/\]/g, ']')  // Replace square brackets
      .replace(/\,/g, ', '); // Add space after commas
    
    // Create SageMath code
    const sageCode = `# SageMath code to create ${polytope.name} polytope
from sage.geometry.polyhedron.constructor import Polyhedron

# Vertices of the polytope
vertices = ${verticesStr}

# Create the polyhedron from vertices
polytope = Polyhedron(vertices=vertices)

# Uncomment to visualize (if in notebook)
# polytope.plot()
`;
    
    // Create and trigger download
    downloadTextFile(sageCode, `${polytope.name.toLowerCase().replace(/\s+/g, '_')}_sage.py`);
  } catch (error) {
    console.error("Failed to export polytope to SageMath:", error);
    alert("Error exporting to SageMath. Check console for details.");
  }
}


/**
 * Export the current polytope as GLTF/GLB format
 * This version is designed specifically for the polytope viewer project structure
 */
window.exportGLTF = function(binary = true) {
  try {
    // Get the state from global scope or try to access it directly
    const state = window.getState ? window.getState() : null;
    
    if (!state) {
      console.error("Could not access application state. Make sure the viewer is initialized.");
      alert("Error: Could not access application state");
      return;
    }
    
    // Verify we have all required components
    if (!state.currentPolytope) {
      console.error("No polytope found in application state");
      alert("Error: No polytope is currently loaded");
      return;
    }
    
    if (!state.renderer || !state.scene || !state.camera) {
      console.error("Required rendering components not found");
      alert("Error: Required rendering components not found");
      return;
    }

    console.log("Current polytope found:", state.currentPolytope.name);
    console.log("Scene children count:", state.scene.children.length);
    
    // Import the GLTFExporter
    import('../../vendor/examples/jsm/exporters/GLTFExporter.js')
      .then(({ GLTFExporter }) => {
        // Create a new exporter
        const exporter = new GLTFExporter();
        
        // Log what we're trying to export
        console.log("Attempting to export scene with:");
        console.log("- Renderer:", state.renderer);
        console.log("- Scene:", state.scene);
        console.log("- Camera:", state.camera);
        
        // Find the mesh group containing the polytope
        let meshGroup = null;
        state.scene.traverse(obj => {
          if (obj.type === "Group" && obj.children.length > 0) {
            meshGroup = obj;
            console.log("Found mesh group with", obj.children.length, "children");
          }
        });
        
        if (!meshGroup) {
          console.error("Could not find the mesh group in the scene");
          alert("Error: Could not find the polytope mesh in the scene");
          return;
        }
        
        // Clone just the mesh group for export
        const exportObject = meshGroup.clone();
        
        // Ensure all objects have unique names
        const usedNames = new Set();
        exportObject.traverse(object => {
          if (!object.name || object.name === '') {
            object.name = `Object_${Math.floor(Math.random() * 100000)}`;
          }
          
          if (usedNames.has(object.name)) {
            let newName = `${object.name}_${Math.floor(Math.random() * 100000)}`;
            while (usedNames.has(newName)) {
              newName = `${object.name}_${Math.floor(Math.random() * 100000)}`;
            }
            object.name = newName;
          }
          
          usedNames.add(object.name);
        });
        
        // Options for the exporter
        const options = {
          binary: binary,
          onlyVisible: true,
          truncateDrawRange: true,
          animations: [],
          embedImages: true,
          forceIndices: true
        };
        
        console.log("Starting export with options:", options);
        
        // Perform the export
        exporter.parse(
          exportObject, 
          (result) => {
            const fileType = binary ? 'model/gltf-binary' : 'model/gltf+json';
            const extension = binary ? 'glb' : 'gltf';
            const fileName = `${state.currentPolytope.name.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
            
            console.log("Export successful, creating download for", fileName);
            
            // Convert to blob and trigger download
            const blob = new Blob([binary ? result : JSON.stringify(result)], { type: fileType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            console.log(`Successfully exported polytope to ${extension.toUpperCase()}`);
          },
          (error) => {
            console.error('Error during GLTF export:', error);
            alert(`Error exporting to ${binary ? 'GLB' : 'GLTF'}: ${error.message || 'Unknown error'}`);
          },
          options
        );
      })
      .catch(error => {
        console.error('Failed to load GLTFExporter:', error);
        console.error('Error details:', error.stack || error);
        alert(`Error: GLTFExporter module could not be loaded. Make sure three.js examples are available.`);
      });
  } catch (error) {
    console.error("Failed to export polytope to GLTF:", error);
    console.error("Error stack:", error.stack || error);
    alert("Error exporting to GLTF. Check console for details.");
  }
};

// Add a simpler alternative that builds from scratch
window.exportPolytopeModel = function(binary = true) {
  try {
    // Get state directly from the export
    const { getState } = window.require ? window.require('./src/core/stateManager.js') : { getState: null };
    const state = getState ? getState() : null;
    
    if (!state || !state.currentPolytope) {
      console.error("Could not access polytope data");
      alert("Error: Could not find polytope data");
      return;
    }
    
    const THREE = window.THREE;
    if (!THREE) {
      console.error("THREE.js not found in global scope");
      alert("Error: THREE.js not found in global scope");
      return;
    }
    
    console.log("Creating model from polytope:", state.currentPolytope.name);
    console.log("Vertices:", state.currentPolytope.vertices.length);
    console.log("Faces:", state.currentPolytope.faces.length);
    
    // Create a new scene with just the geometry
    const scene = new THREE.Scene();
    scene.name = "ExportedPolytope";
    
    // Create a group to hold all faces
    const group = new THREE.Group();
    group.name = state.currentPolytope.name;
    
    // Create a mesh for each face
    state.currentPolytope.faces.forEach((face, faceIndex) => {
      try {
        // Get vertices for this face
        const faceVertices = face.map(vertexIndex => state.currentPolytope.vertices[vertexIndex]);
        
        // Create a buffer geometry
        const geometry = new THREE.BufferGeometry();
        
        // Prepare vertex positions
        const positions = [];
        faceVertices.forEach(vertex => {
          positions.push(vertex[0], vertex[1], vertex[2]);
        });
        
        // Set position attribute
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // Create triangulation indices (simple fan triangulation)
        const indices = [];
        for (let i = 1; i < face.length - 1; i++) {
          indices.push(0, i, i + 1);
        }
        
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        // Create material - use color from the settings if available
        const colorScheme = state.settings.colorScheme || ['#ff0000', '#00ff00', '#0000ff'];
        const colorHex = colorScheme[faceIndex % colorScheme.length];
        const material = new THREE.MeshStandardMaterial({
          color: colorHex,
          flatShading: true,
          side: THREE.DoubleSide
        });
        
        // Create and add the mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `Face_${faceIndex}`;
        group.add(mesh);
      } catch (faceError) {
        console.error(`Error processing face ${faceIndex}:`, faceError);
      }
    });
    
    // Add the group to the scene
    scene.add(group);
    
    // Dynamic import of GLTFExporter
    import('../../vendor/three.js/examples/jsm/exporters/GLTFExporter.js')
      .then(({ GLTFExporter }) => {
        const exporter = new GLTFExporter();
        
        const options = {
          binary: binary,
          forceIndices: true,
          truncateDrawRange: true
        };
        
        exporter.parse(
          scene,
          (result) => {
            const fileType = binary ? 'model/gltf-binary' : 'model/gltf+json';
            const extension = binary ? 'glb' : 'gltf';
            const fileName = `${state.currentPolytope.name.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
            
            // Create download
            const blob = new Blob([binary ? result : JSON.stringify(result)], { type: fileType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            console.log(`Successfully exported polytope to ${extension.toUpperCase()}`);
            
            // Clean up
            scene.traverse(obj => {
              if (obj.geometry) obj.geometry.dispose();
              if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
              }
            });
          },
          (error) => {
            console.error("Export error:", error);
            alert("Error during export: " + (error.message || "Unknown error"));
          },
          options
        );
      })
      .catch(importError => {
        console.error("Error importing GLTFExporter:", importError);
        alert("Could not import GLTFExporter. Check the console for details.");
      });
  } catch (error) {
    console.error("Error in exportPolytopeModel:", error);
    alert("Error exporting polytope model. Check the console for details.");
  }
};

console.log("GLTF export utilities loaded. Use exportGLTF() or exportPolytopeModel() to export the current polytope.");