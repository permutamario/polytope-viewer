// Root Polytope C3
// File: polytopes/builder_functions/build_root_polytope_C3.js
import { Polytope } from '../Polytope.js';

export function build_root_polytope_C3() {
  const roots = [];
  // Long roots ±2e_i
  for (let i = 0; i < 3; i++) {
    const v = [0, 0, 0]; v[i] = 2;
    roots.push([...v]); roots.push(v.map(x => -x));
  }
  // Short roots ±e_i±e_j
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++)
    for (const si of [-1, 1]) for (const sj of [-1, 1]) {
      const v = [0, 0, 0]; v[i] = si; v[j] = sj;
      roots.push(v);
    }
  // ±e_i
  for (let i = 0; i < 3; i++) {
    const v = [0, 0, 0]; v[i] = 1;
    roots.push([...v]); roots.push(v.map(x => -x));
  }
  return new Polytope(roots);
}
