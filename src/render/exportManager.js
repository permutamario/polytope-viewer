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
 * Alternative approach to export the polytope directly using a new THREE.js scene
 * This avoids issues with duplicate names and complex scene hierarchies
 * @param {Object} state - The application state containing the polytope and renderer
 * @param {Boolean} binary - Whether to export as binary GLB (true) or JSON GLTF (false)
 */
window.exportGLTFAlt = function(binary = true) {
  try {
    const state = window.polytope_viewer_state;
    if (!state || !state.currentPolytope) {
      console.error("Cannot export: No polytope available");
      return;
    }
    
    // Create a new temporary scene just for export
    const THREE = window.THREE; // Get THREE from window
    if (!THREE) {
      console.error("THREE.js not found in global scope");
      return;
    }
    
    // Import GLTFExporter dynamically
    import('../../vendor/three.js/examples/jsm/exporters/GLTFExporter.js')
      .then(({ GLTFExporter }) => {
        const tempScene = new THREE.Scene();
        tempScene.name = "PolytopeExport";
        
        // Create a group to hold the polytope
        const group = new THREE.Group();
        group.name = state.currentPolytope.name;
        
        // Access vertices and faces from the polytope
        const { vertices, faces } = state.currentPolytope;
        
        // Create a mesh for each face with proper naming
        faces.forEach((faceIndices, faceIndex) => {
          // Get the color for this face
          const colorScheme = state.settings.colorScheme;
          const color = colorScheme[faceIndex % colorScheme.length];
          
          // Create a material
          const material = new THREE.MeshStandardMaterial({
            color: color,
            flatShading: true,
            side: THREE.DoubleSide
          });
          material.name = `Material_${faceIndex}`;
          
          // Create geometry for this face
          const geometry = new THREE.BufferGeometry();
          
          // Create vertices array from face indices
          const positions = [];
          faceIndices.forEach(vertexIndex => {
            const vertex = vertices[vertexIndex];
            positions.push(vertex[0], vertex[1], vertex[2]);
          });
          
          // Create triangulation indices (simple fan triangulation)
          const indices = [];
          for (let i = 1; i < faceIndices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
          
          // Set attributes
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          geometry.name = `Geometry_${faceIndex}`;
          
          // Create mesh
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = `Face_${faceIndex}`;
          
          // Add to group
          group.add(mesh);
        });
        
        // Add the group to the scene
        tempScene.add(group);
        
        // Set up exporter with options
        const exporter = new GLTFExporter();
        const options = {
          binary: binary,
          truncateDrawRange: true,
          embedImages: true,
          forceIndices: true
        };
        
        // Export the scene
        exporter.parse(
          tempScene,
          (result) => {
            // Handle successful export
            const fileType = binary ? 'model/gltf-binary' : 'model/gltf+json';
            const extension = binary ? 'glb' : 'gltf';
            const fileName = `${state.currentPolytope.name.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
            
            // Create blob and download
            const blob = new Blob([binary ? result : JSON.stringify(result)], { type: fileType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            console.log(`Successfully exported polytope to ${extension.toUpperCase()}`);
            
            // Clean up temporary objects
            tempScene.traverse(object => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach(m => m.dispose());
                } else {
                  object.material.dispose();
                }
              }
            });
          },
          (error) => {
            console.error('Error during GLTF export:', error);
          },
          options
        );
      })
      .catch(error => {
        console.error('Failed to load GLTFExporter:', error);
      });
  } catch (error) {
    console.error("Failed to export polytope:", error);
  }
};

// Add a console message to inform about the alternative export method
console.log("Alternative GLTF export method available via exportGLTFAlt(). Try this if the standard export fails.");