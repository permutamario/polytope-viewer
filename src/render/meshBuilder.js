// File: src/render/meshBuilder.js

/**
 * Build a THREE.Mesh for a given Polytope instance.
 * Uses the polytope.triangulate() method to generate triangles.
 * @param {import('../../polytopes/Polytope.js').Polytope} polytope
 * @param {THREE.Material} [material]
 * @returns {THREE.Mesh}
 */

import * as THREE from '../../vendor/three.module.js';

export function buildMesh(polytope, material) {
  // Default material if none provided
  const meshMaterial = material || new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    flatShading: true,
  });

  const geometry = new THREE.BufferGeometry();

    // Flatten vertex positions into Float32Array
    console.log(polytope);
    console.log(polytope.vertices);
  const positions = new Float32Array(polytope.vertices.flat());
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Use the triangulate() helper to get triangles
  const triangles = polytope.triangulate(); // Array<[i0, i1, i2]>
  const indices = Uint32Array.from(triangles.flat());
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // Compute normals for lighting
  geometry.computeVertexNormals();

  // Create the mesh
  return new THREE.Mesh(geometry, meshMaterial);
}

/**
 * Build a THREE.LineSegments object for edges of the polytope.
 * @param {import('../../polytopes/Polytope.js').Polytope} polytope
 * @param {THREE.LineBasicMaterial} [lineMaterial]
 * @returns {THREE.LineSegments}
 */
export function buildEdgeLines(polytope, lineMaterial) {
  const edgeMat = lineMaterial || new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });

  // Each edge contributes two vertices (start and end)
  const points = [];
  for (const [i, j] of polytope.edges) {
    const v1 = polytope.vertices[i];
    const v2 = polytope.vertices[j];
    points.push(...v1, ...v2);
  }

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(points, 3)
  );

  return new THREE.LineSegments(edgeGeometry, edgeMat);
}
