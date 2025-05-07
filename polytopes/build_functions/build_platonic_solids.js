// Platonic Solids
//File: polytopes/build_functions/build_platonic_solid.js

import { Polytope } from '../Polytope.js';

export function build_platonic_solid(params = { type: 'cube' }) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;
  const type = params.type.toLowerCase();

  let vertices;
  switch (type) {
    case 'tetrahedron':
      vertices = [
        [0.0, 0.0, 0.0],
        [0.0, 1.0, 1.0],
        [1.0, 0.0, 1.0],
        [1.0, 1.0, 0.0]
      ];
      break;

    case 'cube':
    case 'hexahedron':
      vertices = [
        [-1, -1, -1], [-1, -1, 1],
        [-1, 1, -1], [-1, 1, 1],
        [1, -1, -1], [1, -1, 1],
        [1, 1, -1], [1, 1, 1]
      ];
      break;

    case 'octahedron':
      vertices = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1]
      ];
      break;

    case 'dodecahedron':
      vertices = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        [0, invPhi, phi], [0, -invPhi, phi], [0, invPhi, -phi], [0, -invPhi, -phi],
        [invPhi, phi, 0], [-invPhi, phi, 0], [invPhi, -phi, 0], [-invPhi, -phi, 0],
        [phi, 0, invPhi], [-phi, 0, invPhi], [phi, 0, -invPhi], [-phi, 0, -invPhi]
      ];
      break;

    case 'icosahedron':
      vertices = [
        [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
        [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
        [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
      ];
      break;

    default:
      throw new Error(`Unknown platonic solid type: '${params.type}'`);
  }

  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

  return new Polytope(vertices, {
    name: "Platonic Solids",
    parameters: params,
    parameterSchema: build_platonic_solid.defaults
  });
}

build_platonic_solid.defaults = {
  type: {
    type: 'dropdown',
    options: ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'],
    default: 'cube',
    name: 'Platonic Type',
    description: 'Choose which of the five Platonic solids to build'
  }
};
