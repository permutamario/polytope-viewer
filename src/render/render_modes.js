// File: src/render/render_modes.js

import * as THREE from '../../vendor/three.module.js';
import { createMaterial } from './material_options.js';
import { applyLightingMode } from './lighting_modes.js';

/**
 * Each mode picks one material preset and one lighting preset.
 * You can tweak pairings (or intensities) as you like.
 */
export const renderModes = {
    Standard:    { material: 'plastic',   lighting: 'studio'        },
    Flat:        { material: 'flat',      lighting: 'balanced'      },
    Glossy:      { material: 'glossy',    lighting: 'surround'      },
    Wireframe:   { material: 'wireframe', lighting: 'studio'        },
    Backface:    { material: 'backface',  lighting: 'studio'        },
    Glass:       { material: 'glass',      lighting: 'surround'     },
};

export const availableRenderModes = Object.keys(renderModes);

/**
 * Apply one of these unified modes:
 *  - rebuild the mesh’s material
 *  - reset the scene’s lights
 */
export function applyRenderMode(scene, meshGroup, settings) {
  const modeKey = settings.renderModeName;
  const preset = renderModes[modeKey] || renderModes.Flat;
  const { material: mKey, lighting: lKey } = preset;

  // 1) swap out mesh materials
  meshGroup.children.forEach((mesh, idx) => {
    // pick color by face index (or your own colorScheme logic)
    const color = new THREE.Color(settings.colorScheme[idx % settings.colorScheme.length]);
    mesh.material = createMaterial(mKey, color, settings.faceOpacity);
  });

  // 2) apply lighting
  applyLightingMode(scene, lKey);
}
