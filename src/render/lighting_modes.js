// File: src/render/lighting_modes.js

import * as THREE from '../../vendor/three.module.js';

/**
 * Predefined lighting presets with distinct styles:
 * - balanced: ambient + directional
 * - studio: three-point lighting (key, fill, back)
 * - bright: ambient-only
 * - contrast: strong key + minimal ambient
 * - rim: back/rim light only
 * - surround: multiple directional lights + soft ambient
 * - hemisphere: sky-ground gradient lighting
 * - point: single point light
 * - multiPoint: four point lights at corners
 * - spot: focused spotlight
 * - softSpot: wide, soft-edged spotlight
 * - area: rectangular area light
 * - warm: warm-toned directional light
 * - cool: cool-toned directional light
 * - bicolor: red and blue directional lights
 * - stage: overhead and footlights
 * - gothic: low-key moody lighting
 * - midday: high overhead sun + bright ambient
 * - goldenHour: warm low-angle directional
 * - underwater: bluish ambient + directional
 */
const presets = {
  balanced: () => {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    return [ambient, dir];
  },

  studio: () => {
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(10, 10, 10);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-10, 5, 5);
    const back = new THREE.DirectionalLight(0xffffff, 0.5);
    back.position.set(0, -5, -10);
    return [key, fill, back];
  },

  bright: () => {
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    return [ambient];
  },

  contrast: () => {
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 15, 5);
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    return [key, ambient];
  },

  rim: () => {
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-5, 5, -5);
    return [rim];
  },

  surround: () => {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    const dirs = [[0,0,10],[0,0,-10],[10,0,0],[-10,0,0],[0,10,0],[0,-10,0]];
    const lights = dirs.map(pos => {
      const d = new THREE.DirectionalLight(0xffffff, 0.5);
      d.position.set(...pos);
      return d;
    });
    return [ambient, ...lights];
  },

  hemisphere: () => {
    const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.0);
    return [hemi];
  },

  point: () => {
    const p = new THREE.PointLight(0xffffff, 1.0, 100);
    p.position.set(0, 10, 0);
    return [p];
  },

  multiPoint: () => {
    const positions = [[5,5,5],[-5,5,5],[5,5,-5],[-5,5,-5]];
    return positions.map(pos => {
      const p = new THREE.PointLight(0xffffff, 0.8, 50);
      p.position.set(...pos);
      return p;
    });
  },

  spot: () => {
    const s = new THREE.SpotLight(0xffffff, 1.2);
    s.position.set(0, 15, 10);
    s.angle = Math.PI / 6;
    s.penumbra = 0.2;
    return [s];
  },

  softSpot: () => {
    const s = new THREE.SpotLight(0xffffff, 0.9);
    s.position.set(0, 15, 10);
    s.angle = Math.PI / 4;
    s.penumbra = 0.8;
    return [s];
  },

  area: () => {
    const a = new THREE.RectAreaLight(0xffffff, 1.0, 10, 10);
    a.position.set(0, 5, 0);
    a.lookAt(0,0,0);
    return [a];
  },

  warm: () => {
    const w = new THREE.DirectionalLight(0xffd8b1, 1.0);
    w.position.set(5, 10, 5);
    return [w];
  },

  cool: () => {
    const c = new THREE.DirectionalLight(0xb1d8ff, 1.0);
    c.position.set(-5, 10, -5);
    return [c];
  },

  bicolor: () => {
    const r = new THREE.DirectionalLight(0xff0000, 0.8);
    r.position.set(5, 5, 0);
    const b = new THREE.DirectionalLight(0x0000ff, 0.8);
    b.position.set(-5, 5, 0);
    return [r, b];
  },

  stage: () => {
    const overhead = new THREE.DirectionalLight(0xffffff, 1.0);
    overhead.position.set(0, 20, 0);
    const foot1 = new THREE.PointLight(0xffffff, 0.5, 30);
    foot1.position.set(0, 0, 10);
    const foot2 = new THREE.PointLight(0xffffff, 0.5, 30);
    foot2.position.set(0, 0, -10);
    return [overhead, foot1, foot2];
  },

  gothic: () => {
    const key = new THREE.DirectionalLight(0x441111, 0.7);
    key.position.set(5, 10, 0);
    const ambient = new THREE.AmbientLight(0x110011, 0.2);
    return [key, ambient];
  },

  midday: () => {
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(0, 20, 0);
    return [ambient, sun];
  },

  goldenHour: () => {
    const sun = new THREE.DirectionalLight(0xffa500, 1.2);
    sun.position.set(-5, 5, 0);
    const ambient = new THREE.AmbientLight(0xffdcb1, 0.5);
    return [sun, ambient];
  },

  underwater: () => {
    const ambient = new THREE.AmbientLight(0x1e90ff, 0.6);
    const dir = new THREE.DirectionalLight(0x1e90ff, 0.8);
    dir.position.set(0, 10, 0);
    return [ambient, dir];
  }
};

// Track lights added by applyLightingMode
let currentLights = [];

/**
 * Apply a lighting preset to a THREE.Scene, removing existing lights.
 * @param {THREE.Scene} scene
 * @param {string} mode - Preset key
 */
export function applyLightingMode(scene, mode) {
  // Remove previous lights
  currentLights.forEach(light => scene.remove(light));
  currentLights = [];

  const presetFn = presets[mode];
  if (!presetFn) {
      console.warn(`Lighting preset \"${mode}\" not found. Falling back to \\"balanced\\".`);
    return applyLightingMode(scene, 'balanced');
  }

  const lights = presetFn();
  lights.forEach(light => {
    light.userData.lightingPreset = mode;
    scene.add(light);
    currentLights.push(light);
  });
}

/**
 * List of available lighting mode names.
 */
export const availableLightingModes = Object.keys(presets);
