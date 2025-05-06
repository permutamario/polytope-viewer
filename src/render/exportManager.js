// src/render/exportManager.js
//import { isMobileDevice } from '../core/utils.js';
//import { toggleAutorotation } from './sceneManager.js';
//import GIF from '../../vendor/gif.js/gif.js';

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
  console.log(`Creating GIF: ${duration}s @ ${fps} FPS, quality ${quality}`);

  // Adjust parameters for mobile
  //const useMobile = isMobileDevice();
  const actualFps =  fps;
  const actualQuality =  quality;
  const actualDuration = duration;

  if (!renderer || !scene || !camera) {
    console.error("Cannot export GIF: Viewer not initialized.");
    alert("Cannot export GIF: Viewer not ready.");
    return;
  }

  if (typeof GIF === 'undefined') {
    console.error("GIF.js library not loaded.");
    alert("GIF export requires the GIF.js library.");
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
  const wasAutorotating = getState().animation
    getState().setSetting("animation",true)

  // Prepare GIF.js encoder
  const gif = new GIF({
    workers: 2,
    quality: actualQuality,
    workerScript: '../vendor/gif.js/gif.worker.js'
  });

  // Progress callback
  gif.on('progress', p => {
    progressDiv.textContent = `Processing frames: ${Math.round(p * 100)}%`;
  });

  // Finished callback
  gif.on('finished', blob => {
      // Restore autorotating
      getState.setSetting("animation",wasAutorotation)

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

  // Calculate total frames & rotation increment
  const totalFrames = Math.floor(actualDuration * actualFps);
  const totalRotation = Math.PI * 0.4; // 180° turn
  const rotationIncrement = totalRotation / totalFrames;
  let framesCaptured = 0;

  // Capture loop
  function capture() {
    if (framesCaptured >= totalFrames) {
      gif.render();
      return;
    }
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
 * Export the current polytope as Polymake code
 * @param {Object} polytope - The polytope object with vertices
 */
export function exportToPolymake(polytope) {
  if (!polytope || !polytope.vertices || polytope.vertices.length === 0) {
    console.error("Cannot export: No polytope data available.");
    alert("Cannot export: No polytope data available.");
    return;
  }
  
  try {
    // Format vertices as a Polymake matrix
    let verticesStr = "";
    polytope.vertices.forEach(vertex => {
      verticesStr += vertex.join(" ") + "\n";
    });
    
    // Create Polymake code
    const polymakeCode = `# Polymake code to create ${polytope.name} polytope

use application "polytope";

# Define the polytope from its vertices
my $p = new Polytope(POINTS=>
  [1 ${verticesStr.replace(/^/gm, "1 ")}]  # Homogeneous coordinates (prepend 1)
);

# Print basic information
print "Polytope: ${polytope.name}\\n";
print "Dimension: ", $p->DIM, "\\n";
print "Number of vertices: ", $p->N_VERTICES, "\\n";
print "F-vector: ", $p->F_VECTOR, "\\n";

# Uncomment to visualize
# $p->VISUAL;
`;
    
    // Create and trigger download
    downloadTextFile(polymakeCode, `${polytope.name.toLowerCase().replace(/\s+/g, '_')}_polymake.pl`);
  } catch (error) {
    console.error("Failed to export polytope to Polymake:", error);
    alert("Error exporting to Polymake. Check console for details.");
  }
}

/**
 * Helper function to download text content as a file
 * @param {string} content - The text content to download
 * @param {string} filename - The name of the file
 */
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
