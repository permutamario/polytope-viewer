// File: src/render/meshBuilder.js

import * as THREE from '../../vendor/three.module.js';

/**
 * Build a THREE.Group where each face is its own Mesh.
 * Each face-geometry has computeBoundingSphere() so Three.js
 * can depth-sort transparent faces back-to-front.
 *
 * @param {import('../../polytopes/Polytope.js').Polytope} polytope
 *   - .vertices: number[][], .faces: number[][]
 * @param {{ colorScheme: string[], faceOpacity: number }} settings
 * @returns {THREE.Group}
 */
export function buildMesh(polytope, settings) {
  const { colorScheme, faceOpacity } = settings;
  const transparent = faceOpacity < 1.0;
  const group = new THREE.Group();

  if (!polytope.faces?.length) {
    console.warn('meshBuilder: no faces found on polytope');
    return group;
  }

  polytope.faces.forEach((faceVerts, fIdx) => {
    // 1) Build geometry for this face
    const geom = new THREE.BufferGeometry();
    // Flatten the vertex positions for this face
    const coords = new Float32Array(
      faceVerts.flatMap(i => polytope.vertices[i])
    );
    geom.setAttribute('position', new THREE.BufferAttribute(coords, 3));

    // Fan-triangulate [0,1,2], [0,2,3], …
    const idx = [];
    for (let j = 1; j + 1 < faceVerts.length; j++) {
      idx.push(0, j, j + 1);
    }
    geom.setIndex(idx);

    geom.computeVertexNormals();
    geom.computeBoundingSphere();  // <— critical for sorting

    // 2) Create material for this face
    const mat = new THREE.MeshStandardMaterial({
      color:       new THREE.Color(colorScheme[fIdx % colorScheme.length]),
	flatShading: true,
	side: THREE.DoubleSide,
      opacity:     faceOpacity,
      transparent,                 // true if <1
      depthWrite:  !transparent,   // don’t write depth when transparent
    });

    // 3) Create mesh & add to group
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
  });

  return group;
}
