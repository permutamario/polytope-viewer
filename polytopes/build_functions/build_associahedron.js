// Associahedron
//File: polytopes/builder_functions/build_associahedron.js
import { Polytope } from '../Polytope.js';

export function build_associahedron() {
  // Loday's associahedron as Minkowski sum of diagonals of a hexagon
  const n = 5; // for 5 leaves
  const m = n;
  // generate diagonals of convex (n+1)-gon (exclude edges)
  const diags = [];
  for (let i = 1; i <= n+1; i++) {
    for (let j = i+1; j <= n+1; j++) {
      const diff = j - i;
      if (diff >= 2 && !(i === 1 && j === n+1)) {
        // vector in R^m summing e_k for k=i to j-1
        const v = Array(m).fill(0);
        for (let k = i; k < j; k++) {
          v[k-1] = 1;
        }
        diags.push(v);
      }
    }
  }
  // Minkowski sum of segments [0, d] for each diagonal
  let vertices = [[...Array(m).fill(0)]];
  diags.forEach(d => {
    const next = [];
    vertices.forEach(p => {
      next.push(p);
      next.push(p.map((pi, idx) => pi + d[idx]));
    });
    // deduplicate
    const seen = new Set();
    vertices = [];
    next.forEach(pt => {
      const key = pt.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        vertices.push(pt);
      }
    });
  });
  // project from R^m hyperplane sum=0 to R^3 via basis e1-e2, e2-e3, e3-e4
  const dot = (u,v) => u.reduce((s,ui,i) => s + ui*v[i], 0);
  const basis = [
    [1,-1,0,0,0],
    [0,1,-1,0,0],
    [0,0,1,-1,0]
  ];
  const verts3 = vertices.map(p => basis.map(b => dot(p,b)));
  return new Polytope(verts3);
}
