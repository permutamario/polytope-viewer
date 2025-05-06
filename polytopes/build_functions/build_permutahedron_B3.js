// Type B Permutahedron
// File: polytopes/builder_functions/build_permutahedron_B3.js
import { Polytope } from '../Polytope.js';

function permute(array) {
  if (array.length <= 1) return [array];
  const result = [];
  array.forEach((x, i) => {
    permute(array.slice(0, i).concat(array.slice(i + 1))).forEach(rest =>
      result.push([x, ...rest])
    );
  });
  return result;
}

export function build_permutahedron_B3() {
  const base = [1, 2, 3];
  const perms = permute(base);
  const generateSigns = n => {
    let acc = [[]];
    for (let i = 0; i < n; i++) acc = acc.flatMap(prev => [-1, 1].map(s => [...prev, s]));
    return acc;
  };
  const signCombos = generateSigns(3);
  const pts = [];
  perms.forEach(p => signCombos.forEach(s => pts.push(p.map((pi, idx) => pi * s[idx]))));
  const n = pts.length;
  const centroid = pts.reduce((c, p) => [c[0] + p[0], c[1] + p[1], c[2] + p[2]], [0, 0, 0]).map(c => c / n);
  const verts = pts.map(p => [p[0] - centroid[0], p[1] - centroid[1], p[2] - centroid[2]]);
  return new Polytope(verts);
}
