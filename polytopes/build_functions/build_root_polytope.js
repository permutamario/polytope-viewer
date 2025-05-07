// Root Polytope
// File: polytopes/build_functions/build_root_polytope.js

import { Polytope } from '../Polytope.js';

export function build_root_polytope(params = { type: 'A3' }) {
  const { type } = params;

  let vertices = [];

  switch (type) {
    case 'A3': {
      const roots4 = [];
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
        [1, -1, 0, 0],
        [0, 1, -1, 0],
        [0, 0, 1, -1]
      ];
      const ons = orthonormalBasis(basis4);
      vertices = roots4.map(v4 => ons.map(e => dot(v4, e)));
      break;
    }

    case 'B3': {
      const roots = [];
      for (let i = 0; i < 3; i++) {
        const v = [0, 0, 0]; v[i] = 1;
        roots.push([...v]); roots.push(v.map(x => -x));
      }
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++)
        for (const si of [-1, 1]) for (const sj of [-1, 1]) {
          const v = [0, 0, 0]; v[i] = si; v[j] = sj;
          roots.push(v);
        }
      vertices = roots;
      break;
    }

    case 'C3': {
      const roots = [];
      for (let i = 0; i < 3; i++) {
        const v = [0, 0, 0]; v[i] = 2;
        roots.push([...v]); roots.push(v.map(x => -x));
      }
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++)
        for (const si of [-1, 1]) for (const sj of [-1, 1]) {
          const v = [0, 0, 0]; v[i] = si; v[j] = sj;
          roots.push(v);
        }
      for (let i = 0; i < 3; i++) {
        const v = [0, 0, 0]; v[i] = 1;
        roots.push([...v]); roots.push(v.map(x => -x));
      }
      vertices = roots;
      break;
    }

    case 'D3': {
      const roots = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        for (const si of [-1, 1]) for (const sj of [-1, 1]) {
          const v = [0, 0, 0]; v[i] = si; v[j] = sj;
          roots.push(v);
        }
      }
      vertices = roots;
      break;
    }

    case 'H3': {
      const phi = (1 + Math.sqrt(5)) / 2;
      const icosaVerts = [
        [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
        [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
        [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
      ];
      let edgeLen = Infinity;
      for (let i = 0; i < icosaVerts.length; i++) {
        for (let j = i + 1; j < icosaVerts.length; j++) {
          const dx = icosaVerts[i][0] - icosaVerts[j][0];
          const dy = icosaVerts[i][1] - icosaVerts[j][1];
          const dz = icosaVerts[i][2] - icosaVerts[j][2];
          const dist = Math.hypot(dx, dy, dz);
          if (dist > 1e-6 && dist < edgeLen) edgeLen = dist;
        }
      }
      const mids = [];
      for (let i = 0; i < icosaVerts.length; i++) {
        for (let j = i + 1; j < icosaVerts.length; j++) {
          const a = icosaVerts[i], b = icosaVerts[j];
          const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
          const dist = Math.hypot(dx, dy, dz);
          if (Math.abs(dist - edgeLen) < 1e-6) {
            mids.push([
              (a[0] + b[0]) / 2,
              (a[1] + b[1]) / 2,
              (a[2] + b[2]) / 2
            ]);
          }
        }
      }
      vertices = mids;
      break;
    }

    default:
      console.warn(`Unknown root system type: ${type}, defaulting to A3`);
      return build_root_polytope({ type: 'A3' });
  }

  const poly = new Polytope(vertices, {
    name: `Root Polytope`,
    parameters: params,
    parameterSchema: build_root_polytope.defaults
  });

  return poly;
}

build_root_polytope.defaults = {
  type: {
    type: 'dropdown',
    default: 'A3',
    options: ['A3', 'B3', 'C3', 'D3', 'H3'],
    description: 'Select a 3D root system',
name: 'Root System'
  }
};
