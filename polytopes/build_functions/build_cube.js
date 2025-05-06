// Cube
//File: polytopes/builder_functions/build_cube.js
import { Polytope } from '../Polytope.js';

export function build_cube() {
  const vertices = [
    [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1],
    [1,-1,-1], [1,-1,1], [1,1,-1], [1,1,1]
  ];
  return new Polytope(vertices);
}
