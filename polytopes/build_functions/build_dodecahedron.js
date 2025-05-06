// Dodecahedron
// File: polytopes/builder_functions/build_dodecahedron.js
import { Polytope } from '../Polytope.js';

export function build_dodecahedron() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;
  const vertices = [
    // Cube vertices
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    // Dodecahedral points
    [0, invPhi, phi], [0, -invPhi, phi], [0, invPhi, -phi], [0, -invPhi, -phi],
    [invPhi, phi, 0], [-invPhi, phi, 0], [invPhi, -phi, 0], [-invPhi, -phi, 0],
    [phi, 0, invPhi], [-phi, 0, invPhi], [phi, 0, -invPhi], [-phi, 0, -invPhi]
  ];
  return new Polytope(vertices);
}
