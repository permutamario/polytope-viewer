// Icosahedron
// File: polytopes/builder_functions/build_icosahedron.js
import { Polytope } from '../Polytope.js';

export function build_icosahedron() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
    [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
  ];
  return new Polytope(vertices);
}
