// src/core/stateManager.js
import { EventEmitter } from './utils.js';

// Internal event emitter for change notifications
const emitter = new EventEmitter();

// Application state object
let state = {};

/**
 * Initialize the application state with loaded data.
 * Returns the state object with data, settings, and event methods.
 */
export function initializeState(data) {
  state = {
    // Loaded manifest & geometries
    data,

    // UI & rendering settings with sensible defaults
    settings: {
      animation: false,           // autorotate
      colorScheme: 'Rainbow',
      faceColor: '#156289',      // fallback face color
      faceOpacity: 0.8,
      vertexEmphasis: false,
	vertexColor: '#ffffff',
	showEdges: false,
	currentPolytope: data.geometries['Permutahedron'],
      // ...add more defaults as needed
    },


      /**
       *Color options should be read in
       *
       *
       */

      colorSchemes : {
	  'Single Color': ['#156289'],
	  
	  'Pastel': [
	      '#ffc0cb', '#b0e0e6', '#ffdab9', '#e6e6fa', '#f5deb3',
	      '#b2dfdb', '#ffccbc', '#d1c4e9', '#c8e6c9', '#ffecb3',
	      '#bbdefb', '#f8bbd0', '#dcedc8', '#cfd8dc', '#ffe0b2',
	      '#b3e5fc', '#e1bee7', '#c5cae9', '#b2ebf2', '#f0f4c3'
	  ],
	  
	  'Dark': [
	      '#222222', '#444444', '#666666', '#888888', '#aaaaaa',
	      '#263238', '#1a237e', '#1b5e20', '#b71c1c', '#4a148c',
	      '#004d40', '#0d47a1', '#311b92', '#880e4f', '#bf360c',
	      '#3e2723', '#212121', '#01579b', '#33691e', '#4a148c'
	  ],
	  
	  'Rainbow': [
	      '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff',
	      '#4b0082', '#9400d3', '#ff1493', '#00ffff', '#adff2f',
	      '#ff00ff', '#1e90ff', '#ffb6c1', '#00fa9a', '#ffd700',
	      '#ff6347', '#7fffd4', '#ff4500', '#9370db', '#3cb371'
	  ],
	  
	  'Colorblind-Friendly': [
	      '#006ba4', '#ff800e', '#aaaa00', '#e16032', '#924900',
	      '#3b9c9c', '#8b72be', '#5a3c1c', '#d35fb7', '#595959',
	      '#0072b2', '#e69f00', '#56b4e9', '#009e73', '#f0e442',
	      '#d55e00', '#cc79a7', '#000000', '#808080', '#ffffff'
	  ],
	  
	  'Earth Tones': [
	      '#8d6e63', '#a1887f', '#bcaaa4', '#6d4c41', '#5d4037',
	      '#4e342e', '#3e2723', '#efebe9', '#d7ccc8', '#795548',
	      '#9e9d24', '#827717', '#33691e', '#1b5e20', '#c8e6c9',
	      '#43a047', '#689f38', '#fdd835', '#f57f17', '#bb8755'
	  ],
	  
	  'Ocean': [
	      '#80deea', '#4dd0e1', '#26c6da', '#00bcd4', '#00acc1',
	      '#0097a7', '#00838f', '#006064', '#84ffff', '#18ffff',
	      '#00e5ff', '#00b8d4', '#b3e5fc', '#81d4fa', '#4fc3f7',
	      '#29b6f6', '#03a9f4', '#039be5', '#0288d1', '#01579b'
	  ],
	  
	  'Monochromatic Blue': [
	      '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5',
	      '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1',
	      '#82b1ff', '#448aff', '#2979ff', '#2962ff', '#0d47a1',
	      '#01579b', '#0277bd', '#0288d1', '#039be5', '#03a9f4'
	  ],
	  
	  'Vintage': [
	      '#d4a373', '#fefae0', '#faedcd', '#e9edc9', '#ccd5ae',
	      '#b3b493', '#867862', '#986b53', '#f1dca7', '#d7b881',
	      '#987245', '#a39171', '#907070', '#d0a98f', '#b98b73',
	      '#e7bc91', '#ffe8d6', '#ddbea9', '#cb997e', '#a07855'
	  ],
	  
	  'Neon': [
	      '#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000',
	      '#ff3399', '#ff6600', '#00cc99', '#33cc33', '#cc33ff',
	      '#ff66ff', '#66ffff', '#66ff66', '#ffff66', '#ff6666',
	      '#ff0066', '#00ff99', '#99ff00', '#ff9900', '#9900ff'
	  ]
      },

    /**
     * Update a setting and notify listeners.
     * @param {string} key  - the settings key
     * @param {*} value     - the new value
     */
    setSetting(key, value) {
      if (this.settings[key] === value) return;
      this.settings[key] = value;
      emitter.emit('settingsChanged', { key, value });
    },

    /**
     * Subscribe to state events ('settingsChanged')
     */
    on(event, callback) {
      emitter.on(event, callback);
    },

    /**
     * Unsubscribe from state events.
     */
    off(event, callback) {
      emitter.off(event, callback);
    }
  };

  return state;
}

/**
 * Get the current state object.
 */
export function getState() {
  return state;
}

