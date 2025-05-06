// Root Polytope A3
// File: polytopes/builder_functions/build_root_polytope_A3.js
import { Polytope } from '../Polytope.js';

export function build_root_polytope_A3() {
  const roots4 = [];
  // ±(e_i - e_j)
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const v = [0, 0, 0, 0]; v[i] = 1; v[j] = -1;
    roots4.push(v); roots4.push(v.map(x => -x));
  }
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
  const basis4 = [
    [1, -1, 0, 0], [0, 1, -1, 0], [0, 0, 1, -1]
  ];
  const ons = orthonormalBasis(basis4);
  const verts3 = roots4.map(v4 => ons.map(e => dot(v4, e)));
  return new Polytope(verts3);
}
