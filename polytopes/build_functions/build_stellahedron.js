// Stellahedron
// File: polytopes/builder_functions/build_stellahedron.js
import { Polytope } from '../Polytope.js';

export function build_stellahedron() {
  const u1 = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]
  ];
  const u2 = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 1, 0], [1, 0, 1], [0, 1, 1]
  ];
  const u3 = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
    [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]
  ];
  // Minkowski sum u1 + u2
  const sum12 = [];
  u1.forEach(v1 => u2.forEach(v2 => sum12.push([
    v1[0] + v2[0],
    v1[1] + v2[1],
    v1[2] + v2[2]
  ])));
  // Then + u3
  const vertices = [];
  sum12.forEach(v12 => u3.forEach(v3 => vertices.push([
    v12[0] + v3[0],
    v12[1] + v3[1],
    v12[2] + v3[2]
  ])));
  return new Polytope(vertices);
}
