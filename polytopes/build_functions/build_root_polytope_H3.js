// Root Polytope H3
// File: polytopes/builder_functions/build_root_polytope_H3.js
import { Polytope } from '../Polytope.js';

export function build_root_polytope_H3() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const icosaVerts = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
    [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
  ];
  // Determine edge length of icosahedron
  let edgeLen = Infinity;
  for (let i = 0; i < icosaVerts.length; i++) {
    for (let j = i + 1; j < icosaVerts.length; j++) {
      const dx = icosaVerts[i][0] - icosaVerts[j][0];
      const dy = icosaVerts[i][1] - icosaVerts[j][1];
      const dz = icosaVerts[i][2] - icosaVerts[j][2];
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 1e-6 && dist < edgeLen) edgeLen = dist;
    }
  }
  // Collect midpoints of edges
  const vertices = [];
  for (let i = 0; i < icosaVerts.length; i++) {
    for (let j = i + 1; j < icosaVerts.length; j++) {
      const a = icosaVerts[i], b = icosaVerts[j];
      const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
      const dist = Math.hypot(dx, dy, dz);
      if (Math.abs(dist - edgeLen) < 1e-6) {
        vertices.push([
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2,
          (a[2] + b[2]) / 2
        ]);
      }
    }
  }
  return new Polytope(vertices);
}
