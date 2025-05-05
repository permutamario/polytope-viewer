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
      animation: true,           // autorotate
      colorScheme: 'Single Color',
      faceColor: '#156289',      // fallback face color
      faceOpacity: 0.8,
      vertexEmphasis: false,
      vertexColor: '#ffffff',     
      showEdges: false,
      // ...add more defaults as needed
    },


      /**
       *Color options should be read in
       *
       *
       */

      colorSchemes: {
	  'Single Color': ['#156289'],
	  'Pastel': [
    0xffc0cb, 0xb0e0e6, 0xffdab9, 0xe6e6fa, 0xf5deb3,],
	  'Dark': [
	      0x222222, 0x444444, 0x666666, 0x888888, 0xaaaaaa]

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
     * Subscribe to state events ('settingsChanged').x
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

