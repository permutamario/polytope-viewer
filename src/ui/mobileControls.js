// src/ui/mobileControls.js
import {
  createSlider,
  createCheckbox,
  createColorPicker,
  createDropdown,
  createButton
} from './baseControls.js';
import { exportPNG, exportGIF, exportToSageMath, exportToPolymake } from '../render/exportManager.js';

/**
 * Assemble and mount mobile header and footer controls with improved layout.
 */
export function setupMobileControls(state) {
  // Mark body as mobile
  document.body.classList.add('mobile-device');

  // Fixed header with polytope selector
  const header = document.createElement('div');
  header.className = 'mobile-header';
  
  // Create a container for proper alignment of the dropdown and label
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'control';
  
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
  
  // Add the dropdown to the container, then the container to the header
  dropdownContainer.appendChild(dropdown);
  header.appendChild(dropdownContainer);
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

  // Create checkbox controls with right-aligned checkboxes
  
  // Rotation toggle with right-aligned checkbox
  const rotateToggleContainer = document.createElement('div');
  rotateToggleContainer.className = 'control checkbox-control';
  const rotateLabel = document.createElement('label');
  rotateLabel.htmlFor = 'animation-toggle-mobile';
  rotateLabel.textContent = 'Rotate';
  
  const rotateInput = document.createElement('input');
  rotateInput.type = 'checkbox';
  rotateInput.id = 'animation-toggle-mobile';
  rotateInput.checked = state.settings.animation;
  rotateInput.addEventListener('change', e => state.setSetting('animation', e.target.checked));
  
  rotateToggleContainer.appendChild(rotateLabel);
  rotateToggleContainer.appendChild(rotateInput);
  menu.appendChild(rotateToggleContainer);

  // Face opacity slider
  const opacitySlider = createSlider({
    id: 'face-opacity-mobile',
    label: 'Face Opacity',
    min: 0,
    max: 1,
    step: 0.01,
    value: state.settings.faceOpacity,
    onChange: v => state.setSetting('faceOpacity', v)
  });
  menu.appendChild(opacitySlider);

  // Face color picker - Hidden in UI but still functional for state
  // We'll create it but not add it to the menu
  const colorPicker = createColorPicker({
    id: 'face-color-mobile',
    label: 'Face Color',
    value: state.settings.faceColor,
    onChange: v => {
      state.colorSchemes['Single Color'] = v;
      state.setSetting('faceColor', v);
    }
  });
  colorPicker.id = 'face-color-mobile-control';
  // Note: We're not appending it to the menu
  
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

  // Show edges toggle with right-aligned checkbox
  const edgesToggleContainer = document.createElement('div');
  edgesToggleContainer.className = 'control checkbox-control';
  const edgesLabel = document.createElement('label');
  edgesLabel.htmlFor = 'edge-toggle-mobile';
  edgesLabel.textContent = 'Show Edges';
  
  const edgesInput = document.createElement('input');
  edgesInput.type = 'checkbox';
  edgesInput.id = 'edge-toggle-mobile';
  edgesInput.checked = state.settings.showEdges;
  edgesInput.addEventListener('change', e => state.setSetting('showEdges', e.target.checked));
  
  edgesToggleContainer.appendChild(edgesLabel);
  edgesToggleContainer.appendChild(edgesInput);
  menu.appendChild(edgesToggleContainer);

  // Create container for export buttons to organize them in a row
  const exportButtonsContainer = document.createElement('div');
  exportButtonsContainer.className = 'export-buttons';
  
  // Export PNG button
  const pngBtn = createButton({
    id: 'export-png-mobile',
    label: 'Export PNG',
      onClick: () => exportPNG(state.renderer, state.scene, state.camera)
  });
  exportButtonsContainer.appendChild(pngBtn);

  // Export GIF button
  const gifBtn = createButton({
    id: 'export-gif-mobile',
    label: 'Export GIF',
      onClick: () => {
	  exportGIF(state.renderer, state.scene, state.camera)
	  //showNotification("Mario has not enabled me yet 😢");
      }
  });
    exportButtonsContainer.appendChild(gifBtn);

    const sageBtn = createButton({
	id: 'export-sage-mobile',
	label: 'Sage',
	onClick: () => exportToSageMath(state.settings.currentPolytope)
    });
    exportButtonsContainer.appendChild(sageBtn);

    // // Export Polymake button
    // const polymakeBtn = createButton({
    // 	id: 'export-polymake-mobile',
    // 	label: 'Polymake',
    // 	onClick: () => exportToPolymake(state.settings.currentPolytope)
    // });
    // exportButtonsContainer.appendChild(polymakeBtn);
    
  // Add the export buttons container to the menu
  menu.appendChild(exportButtonsContainer);
  
  document.body.appendChild(menu);
}



/**
 * Shows a temporary notification box
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the notification in ms
 */
function showNotification(message, duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    zIndex: '1000',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    fontSize: '16px',
    maxWidth: '80%'
  });
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    
    // Remove from DOM after fade out
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, duration);
}

