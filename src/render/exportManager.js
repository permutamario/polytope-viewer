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
