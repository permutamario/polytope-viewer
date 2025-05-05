// src/ui/desktopControls.js
import {
    createSlider,
    createCheckbox,
    createColorPicker,
    createDropdown,
    createButton
} from './baseControls.js';
import { exportPNG, exportGIF } from '../render/exportManager.js';

/**
 * Assemble and mount desktop sidebar controls.
 */
export function setupDesktopControls(state) {
    const container = document.createElement('div');
    container.id = 'controls';

    // Polytope selector
    const polySelect = createDropdown({
	id: 'polytope-select',
	label: 'Polytope',
	options: state.settings.polyNames,
	value: state.settings.currentPolytope.name,
	onChange: v => {
	    state.setSetting('currentPolytope', state.data.geometries[v]);
	}
    });
    container.appendChild(polySelect);

    // Rotation toggle
    const animToggle = createCheckbox({
	id: 'animation-toggle',
	label: 'Rotate',
	checked: state.settings.animation,
	onChange: v => state.setSetting('animation', v)
    });
    container.appendChild(animToggle);

    // Face opacity slider
    const opacitySlider = createSlider({
	id: 'face-opacity',
	label: 'Face Opacity',
	min: 0,
	max: 1,
	step: 0.01,
	value: state.settings.faceOpacity,
	onChange: v => state.setSetting('faceOpacity', v)
    });
    container.appendChild(opacitySlider);

    // Face color picker
    const faceColor = createColorPicker({
	id: 'face-color',
	label: 'Face Color',
	value: state.settings.faceColor,
	
	onChange: v => {
	    state.colorSchemes['Single Color'] = v;
	    state.setSetting('faceColor', v);
	}
    });
    container.appendChild(faceColor);

    // Color scheme chooser 
    const colorNames = Object.keys(state.colorSchemes)
    const schemeDropdown = createDropdown({
	id: 'color-scheme',
	label: 'Color Scheme',
	options: colorNames,
	value: state.settings.colorScheme,
	onChange: v => {
	    state.setSetting('colorScheme',v)
	}
    });
    container.appendChild(schemeDropdown);
					  

    
    // Show edges toggle
    const edgesToggle = createCheckbox({
	id: 'edge-toggle',
	label: 'Show Edges',
	checked: state.settings.showEdges,
	onChange: v => state.setSetting('showEdges', v)
    });
    container.appendChild(edgesToggle);

    // Export buttons
    const pngBtn = createButton({
	id: 'export-png',
	label: 'Export PNG',
	onClick: () => exportPNG(state.renderer, state.scene, state.camera)
    });
    container.appendChild(pngBtn);

    const gifBtn = createButton({
	id: 'export-gif',
	label: 'Export GIF',
	onClick: () => exportGIF(state.renderer, state.scene, state.camera)
    });
    container.appendChild(gifBtn);

    document.body.appendChild(container);
}
