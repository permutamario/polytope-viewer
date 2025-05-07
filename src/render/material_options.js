// File: src/render/material_options.js

import * as THREE from '../../vendor/three.module.js';

/**
 * Consolidated material presets:
 * - flat: unlit basic material
 * - glossy: shiny PBR Standard
 * - metallic: PBR metallic with emissive fallback
 * - emissive: self-lit surface
 * - glass: simple transparent material for performance
 * - wireframe: face-edge outlines
 * - lambert: Lambertian diffuse shading
 * - phong: Phong shading with specular highlights
 * - toon: Cel-shaded (toon) material
 * - matte: rough non-metal PBR surface
 * - plastic: smooth non-metal PBR surface
 * - rubber: soft non-metal PBR surface
 * - chrome: highly reflective metal
 * - velvet: low-shine fabric-like material
 * - neon: self-illuminated neon glow
 * - normal: normal-based coloring material
 * - flatShaded: flat-shaded PBR
 * - backface: only backface visible
 * - frontface: only frontface visible
 * - basicTransparent: basic transparency
 */
const presets = {
  flat: (color, opacity) => new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  glossy: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.2,
    metalness: 0.5,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  metallic: (color, opacity) => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.1,
    metalness: 1.0,
    reflectivity: 1.0,
    emissive: color.clone().multiplyScalar(0.2),
    emissiveIntensity: 0.3,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  emissive: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone(),
    emissiveIntensity: 0.5,
    roughness: 0.8,
    metalness: 0.0,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),


  /** Glass-like transparent material with refraction */
  glass: (color, opacity) => new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 1.0,
    transparent: true,
    opacity,
    side: THREE.DoubleSide
  }),

  wireframe: (color, opacity) => new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  lambert: (color, opacity) => new THREE.MeshLambertMaterial({
    color,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  phong: (color, opacity) => new THREE.MeshPhongMaterial({
    color,
    specular: new THREE.Color(0xffffff).lerp(color, 0.5),
    shininess: 30,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  toon: (color, opacity) => new THREE.MeshToonMaterial({
    color,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  matte: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 1.0,
    metalness: 0.0,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  plastic: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.0,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  rubber: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  chrome: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.0,
    metalness: 1.0,
    reflectivity: 1.0,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  velvet: (color, opacity) => new THREE.MeshPhongMaterial({
    color,
    shininess: 5,
    specular: new THREE.Color(0x000000),
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  neon: (color, opacity) => new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: opacity < 1.0,
    emissive: color.clone(),
    emissiveIntensity: 1.5,
    side: THREE.DoubleSide
  }),

  normal: (color, opacity) => new THREE.MeshNormalMaterial({
    flatShading: false,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  flatShaded: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.0,
    flatShading: true,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide
  }),

  backface: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.5,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.BackSide
  }),

  frontface: (color, opacity) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.5,
    opacity,
    transparent: opacity < 1.0,
    side: THREE.FrontSide
  }),

  basicTransparent: (color, opacity) => new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: true,
    side: THREE.DoubleSide
  })
};

/**
 * Factory to create a material from a preset name.
 * @param {string} mode - The preset key.
 * @param {THREE.Color} color - Base color.
 * @param {number} opacity - Opacity [0,1].
 * @returns {THREE.Material}
 */
export function createMaterial(mode, color, opacity) {
  const factory = presets[mode];
  if (!factory) {
    console.warn(`Material preset "${mode}" not found. Falling back to "glossy".`);
    return presets.glossy(color, opacity);
  }
  return factory(color, opacity);
}

/**
 * List of available material preset names.
 */
export const availableMaterialOptions = Object.keys(presets);
