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
  
  // Get polytope names from state
  const polyNames = state.settings.polyNames || Object.keys(state.data.geometries);
  
  const dropdown = createDropdown({
    id: 'polytope-select-mobile',
    label: 'Polytope',
    options: polyNames,
    value: state.settings.currentPolytope.name,
    onChange: v => {
      state.setSetting('currentPolytope', state.data.geometries[v]);
    }
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
  const animToggle = createCheckbox({
    id: 'animation-toggle-mobile',
    label: 'Rotate',
    checked: state.settings.animation,
    onChange: v => state.setSetting('animation', v)
  });
  menu.appendChild(animToggle);

  // Face opacity slider
  menu.appendChild(createSlider({
    id: 'face-opacity-mobile',
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.01,
    value: state.settings.faceOpacity,
    onChange: v => state.setSetting('faceOpacity', v)
  }));

  // Face color picker
  menu.appendChild(createColorPicker({
    id: 'face-color-mobile',
    label: 'Color',
    value: state.settings.faceColor,
    onChange: v => {
      state.colorSchemes['Single Color'] = v;
      state.setSetting('faceColor', v);
    }
  }));
  
  // Add color scheme dropdown that's present in desktop version
  const colorNames = Object.keys(state.colorSchemes);
  const schemeDropdown = createDropdown({
    id: 'color-scheme-mobile',
    label: 'Color Scheme',
    options: colorNames,
    value: state.settings.colorScheme,
    onChange: v => {
      state.setSetting('colorScheme', v);
    }
  });
  menu.appendChild(schemeDropdown);

  // Show edges toggle
  menu.appendChild(createCheckbox({
    id: 'edge-toggle-mobile',
    label: 'Edges',
    checked: state.settings.showEdges,
    onChange: v => state.setSetting('showEdges', v)
  }));

  // Export buttons
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
