

// src/ui/mobileControls.js
import {
  createSlider,
  createCheckbox,
  createColorPicker,
  createDropdown,
  createButton
} from './baseControls.js';
import { exportPNG, exportGIF } from '../render/exportManager.js';

/**
 * Assemble and mount mobile header and footer controls.
 */
export function setupMobileControls(state) {
  // Mark body as mobile
  document.body.classList.add('mobile-device');

  // Fixed header with polytope selector
  const header = document.createElement('div');
  header.className = 'mobile-header';
  const names = state.data.manifest.map(m => m.name);
  const dropdown = createDropdown({
    id: 'polytope-select-mobile',
    label: 'Polytope',
    options: names,
    value: state.settings.currentPolytope || names[0],
    onChange: v => state.setSetting('currentPolytope', v)
  });
  header.appendChild(dropdown);
  document.body.appendChild(header);

  // Options button in footer
  const optionsBtn = createButton({
    id: 'mobile-options-button',
    label: 'Options',
    onClick: () => menu.classList.toggle('hidden')
  });
  document.body.appendChild(optionsBtn);

  // Sliding options menu
  const menu = document.createElement('div');
  menu.className = 'mobile-options-menu hidden';

    // Reuse controls from desktop
    // Fix using a standard variable assignment
    const animToggle = createCheckbox({
	id: 'animation-toggle-mobile',
	label: 'Rotate',
	checked: state.settings.animation,
	onChange: v => state.setSetting('animation', v)
    });
    menu.appendChild(animToggle);

    menu.appendChild(createSlider({
	id: 'face-opacity-mobile',
	label: 'Opacity',
	min: 0,
	max: 1,
	step: 0.01,
	value: state.settings.faceOpacity,
	onChange: v => state.setSetting('faceOpacity', v)
    }));

    menu.appendChild(createColorPicker({
	id: 'face-color-mobile',
	label: 'Color',
	value: state.settings.faceColor,
	onChange: v => state.setSetting('faceColor', v)
    }));

    menu.appendChild(createCheckbox({
	id: 'edge-toggle-mobile',
	label: 'Edges',
	checked: state.settings.showEdges,
	onChange: v => state.setSetting('showEdges', v)
    }));

    menu.appendChild(createButton({
	id: 'export-png-mobile',
	label: 'PNG',
	onClick: () => exportPNG(state.renderer, state.scene, state.camera)
    }));

    menu.appendChild(createButton({
	id: 'export-gif-mobile',
	label: 'GIF',
	onClick: () => exportGIF(state.renderer, state.scene, state.camera)
    }));
  document.body.appendChild(menu);
}
