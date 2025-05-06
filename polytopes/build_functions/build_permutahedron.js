// Permutahedron
// File: polytopes/builder_functions/build_permutahedron.js
import { Polytope } from '../Polytope.js';

function permutations4(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) =>
    permutations4(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
  );
}

export function build_permutahedron() {
  const perms4 = permutations4([1, 2, 3, 4]);
  const dot = (u, v) => u.reduce((s, ui, k) => s + ui * v[k], 0);
  const sub = (u, v) => u.map((ui, k) => ui - v[k]);
  const scale = (u, s) => u.map(ui => ui * s);
  const norm = u => Math.hypot(...u);
  const orthonormalBasis = vs => {
    const es = [];
    vs.forEach(v => {
      let u = [...v];
      es.forEach(e => { const p = dot(u, e); u = sub(u, scale(e, p)); });
      const n = norm(u);
      if (n > 1e-8) es.push(scale(u, 1 / n));
    });
    return es;
  };
  const basis4 = [[1, -1, 0, 0], [0, 1, -1, 0], [0, 0, 1, -1]];
  const ons = orthonormalBasis(basis4);
  const verts3 = perms4.map(p => ons.map(e => dot(p, e)));
  return new Polytope(verts3);
}
