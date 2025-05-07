// File: src/render/meshBuilder.js

import * as THREE from '../../vendor/three.module.js';
import { createMaterial } from './material_options.js';

/**
 * Build a THREE.Group that is either
 *   • a distinct colored THREE.Line per edge (wireframe mode)
 *   • or a filled mesh per face (all other modes)
 *
 * @param {import('../../polytopes/Polytope.js').Polytope} polytope
 * @param {{
 *   colorScheme: string[],
 *   faceOpacity: number,
 *   renderMode: { material: string, lighting: string }
 * }} settings
 * @returns {THREE.Group}
 */
export function buildMesh(polytope, settings) {
  const { colorScheme, faceOpacity, renderMode } = settings;
  const mode = renderMode.material;
  const group = new THREE.Group();

  // WIREFRAME: one independent THREE.Line per edge, no indexing
  if (mode === 'wireframe') {
    polytope.edges.forEach(([i, j], idx) => {
      // endpoints
      const vA = new THREE.Vector3(...polytope.vertices[i]);
      const vB = new THREE.Vector3(...polytope.vertices[j]);

      // geometry from two points
      const geom = new THREE.BufferGeometry().setFromPoints([vA, vB]);

      // each edge gets its own color
      const color = new THREE.Color(colorScheme[idx % colorScheme.length]);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: faceOpacity < 1,
        opacity: faceOpacity,
        linewidth: 1
      });

      // draw the line
      const line = new THREE.Line(geom, mat);
      group.add(line);
    });

    return group;
  }

  // SOLID MESH MODE: one Mesh per face
  polytope.faces.forEach((faceVerts, fIdx) => {
    // 1) fan‐triangulate the N‐gon
    const coords = new Float32Array(
      faceVerts.flatMap(i => polytope.vertices[i])
    );
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(coords, 3));

    const idxArr = [];
    for (let j = 1; j + 1 < faceVerts.length; j++) {
      idxArr.push(0, j, j + 1);
    }
    geom.setIndex(idxArr);
    geom.computeVertexNormals();
    geom.computeBoundingSphere();

    // 2) create material for this face
    const color = new THREE.Color(
      colorScheme[fIdx % colorScheme.length]
    );
    const mat = createMaterial(mode, color, faceOpacity);

    // 3) mesh & add
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
  });

  return group;
}
