// Tetrahedron

// File: polytopes/builder_functions/build_tetrahedron.js
import { Polytope } from '../Polytope.js';

export function build_tetrahedron() {
  const vertices = [
    [0.0, 0.0, 0.0],
    [0.0, 1.0, 1.0],
    [1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0],
  ];
  const polytope = new Polytope(vertices);
  return polytope;
}
