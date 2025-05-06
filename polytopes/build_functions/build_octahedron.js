// Octahedron
// File: polytopes/builder_functions/build_octahedron.js
import { Polytope } from '../Polytope.js';

export function build_octahedron() {
  const vertices = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1]
  ];
  return new Polytope(vertices);
}
