// src/index.js
//import './index.css.js';
import { detectPlatform } from './core/utils.js';
import { loadData } from './core/loader.js';
import { initializeState } from './core/stateManager.js';
import { setupDesktopControls } from './ui/desktopControls.js';
import { setupMobileControls } from './ui/mobileControls.js';
import { setupScene } from './render/sceneManager.js';

import { renderModes, availableRenderModes } from './render/render_modes.js';

/**
 * Application entry point: loads builders, sets up state, UI, and 3D scene.
 */
async function main() {
    const isMobile = detectPlatform();

    // 1. Load the polytope manifest (map of { name: builderFn })
    const polytopeManifest = await loadData();
    console.log('Loaded polytope manifest:', polytopeManifest);

    // 2. Initialize application state with just the manifest
    const state = initializeState(polytopeManifest);
    console.log('Initialized State Manager');

    // 3. Populate list of available polytope names
    const names = Object.keys(polytopeManifest);
    state.polyNames = names;
    console.log("Populated names of Polytopes.", names);

    // 4. Read in render options
    state.renderModes = renderModes;
    state.settings.renderMode = renderModes['Standard']
    state.settings.renderModeName = 'Standard';

    // 5. Pick default polytope builder ("Permutahedron") and set its JSON
    state.setPolytope("Permutahedron");
    console.log(state.currentPolytope);
    console.log(state.currentPolytope.name);


    // 6. Build UI controls based on platform
    if (isMobile) {
	setupMobileControls(state);
	console.log('Built Mobile UI');
    } else {
	setupDesktopControls(state);
	console.log('Built Desktop UI');
    }

    // 7. Initialize Three.js scene
    setupScene(state);
    console.log('Scene initialized successfully');
}

main().catch(err => {
    console.error('Application failed to start:', err);
    const msg = document.createElement('div');
    msg.textContent = 'Error loading application. See console.';
    msg.style.color = 'red';
    document.body.appendChild(msg);
});
