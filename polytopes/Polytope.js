// File: polytopes/Polytope.js

export class Polytope {
  constructor(vertices, options = {}) {
    this.name = options.name || 'Unnamed Polytope';
    this.vertices = vertices;
    this.faces = [];
    this.edges = [];
    this.center = [0, 0, 0];

    // Ensure parameter metadata is always attached
    this.parameters = options.parameters ?? {};
    this.parameterSchema = options.parameterSchema ?? {};

    this.computeHull();
    this.computeCenter();
  }

  computeHull() {
    const faces = qh(this.vertices, { skipTriangulation: true });
    this.faces = faces;

    const edgeSet = new Set();
    this.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i], b = face[(i + 1) % n];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    this.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  }

  computeCenter() {
    const n = this.vertices.length;
    const sum = this.vertices.reduce(
      (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
      [0, 0, 0]
    );
    this.center = sum.map(x => x / n);
  }

  triangulate() {
    const tris = [];
    for (const face of this.faces) {
      if (face.length === 3) {
        tris.push([...face]);
      } else if (face.length > 3) {
        const [a, ...rest] = face;
        for (let i = 0; i < rest.length - 1; i++) {
          tris.push([a, rest[i], rest[i + 1]]);
        }
      }
    }
    return tris;
  }

  toJSON() {
    return {
      name: this.name,
      vertices: this.vertices,
      faces: this.faces,
      edges: this.edges,
      center: this.center,
      parameters: this.parameters,
      parameterSchema: this.parameterSchema,
    };
  }
}
