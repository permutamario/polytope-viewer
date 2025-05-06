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
      onClick: () => {
	  //exportGIF(state.renderer, state.scene, state.camera)
	  showNotification("Mario has not enabled me yet 😢");
      }
    });
    container.appendChild(gifBtn);

    document.body.appendChild(container);
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
