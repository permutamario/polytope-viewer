// Multiplihedron
// File: polytopes/builder_functions/build_multiplihedron.js
import { Polytope } from '../Polytope.js';

export function build_multiplihedron() {
  const vertices = [
    [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
    [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
    [2, 0, 0], [0, 2, 0], [0, 0, 2],
    [2, 2, 0], [2, 0, 2], [0, 2, 2],
    [3, 1, 1], [1, 3, 1], [1, 1, 3], [2, 2, 2]
  ];
  return new Polytope(vertices);
}
