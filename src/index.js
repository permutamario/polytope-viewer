// src/index.js
//import './index.css.js';
import { detectPlatform } from './core/utils.js';
import { loadData } from './core/loader.js';
import { initializeState } from './core/stateManager.js';
import { setupDesktopControls } from './ui/desktopControls.js';
import { setupMobileControls } from './ui/mobileControls.js';
import { setupScene } from './render/sceneManager.js';

/**
 * Application entry point: loads data, sets up state, UI, and 3D scene.
 */
async function main() {
  const isMobile = detectPlatform();

  // 1. Load polytope manifest and geometries
  const data = await loadData();

  // 2. Initialize application state with loaded data
  const state = initializeState(data);

  // 3. Pick a default polytope and sync state/UI
  const defaultPoly = data.manifest[0]?.name;
  if (defaultPoly) {
    state.setSetting('currentPolytope', defaultPoly);
  }

  // 4. Build UI controls based on platform
  if (isMobile) {
    setupMobileControls(state);
  } else {
    setupDesktopControls(state);
  }

  // 5. Initialize Three.js scene with state-driven behavior
  setupScene(state);
}

main().catch(err => {
  console.error('Application failed to start:', err);
  const msg = document.createElement('div');
  msg.textContent = 'Error loading application. See console.';
  msg.style.color = 'red';
  document.body.appendChild(msg);
});
