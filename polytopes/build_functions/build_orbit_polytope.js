// Orbit Polytope
// File: polytopes/build_functions/build_orbit_polytope.js

import { Polytope } from '../Polytope.js';

// Generate all permutations of an array
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) =>
    permutations(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
  );
}

// Project to the hyperplane sum(x_i) = constant, then into 3D
function projectTo3D(points) {
  const dim = points[0].length;
  const n = dim;

  // Create orthonormal basis of the hyperplane ⟨x⟩ such that ∑x_i = 0
  const basis = [];
  for (let i = 0; i < n - 1; i++) {
    const vec = Array(n).fill(0);
    vec[i] = 1;
    vec[n - 1] = -1;
    basis.push(vec);
  }

  // Orthonormalize (Gram-Schmidt) for numerical stability
  function normalize(v) {
    const norm = Math.hypot(...v);
    return v.map(x => x / norm);
  }

  function dot(u, v) {
    return u.reduce((sum, x, i) => sum + x * v[i], 0);
  }

  function subtract(u, v) {
    return u.map((x, i) => x - v[i]);
  }

  function gramSchmidt(vectors) {
    const ortho = [];
    for (let v of vectors) {
      for (let u of ortho) {
        const proj = dot(v, u);
        v = subtract(v, u.map(x => x * proj));
      }
      ortho.push(normalize(v));
    }
    return ortho;
  }

  const orthoBasis = gramSchmidt(basis).slice(0, 3); // Take first 3 orthonormal vectors

  // Project each point onto this basis
  const projected = points.map(p =>
    orthoBasis.map(b => dot(p, b))
  );

  return projected;
}

export function build_orbit_polytope(params = { point: [1, 2, 2, 3] }) {
  const { point } = params;
  const orbit = permutations(point);
  const vertices = projectTo3D(orbit);

  return new Polytope(vertices, {
    name: 'Orbit Polytope',
    parameters: params,
    parameterSchema: build_orbit_polytope.defaults
  });
}

build_orbit_polytope.defaults = {
  point: {
    type: 'vector',
    default: [1, 2, 2, 3],
    dimension: 4,
    description: 'Initial vector whose orbit under Sₙ defines the polytope, then projected to 3D',
    name: 'Orbit Point'
  }
};

