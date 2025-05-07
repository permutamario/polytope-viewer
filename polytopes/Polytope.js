// File: polytopes/Polytope.js
// Public Variables:
// - vertices: Array<[x, y, z]> — input vertex positions
// - faces: Array<[int, int, int, ...]> — computed faces from QuickHull3D
// - edges: Array<[int, int]> — unique undirected edges as vertex index pairs
// - center: [x, y, z] — centroid of the polytope

export class Polytope {
  constructor(vertices) {
	this.name = 'DEFAULT';
    this.vertices = vertices;
    this.faces = [];
    this.edges = [];
    this.center = [0, 0, 0];
    this.computeHull();
    this.computeCenter();
  }


  computeHull() {
    // 1) get all faces (ngons)
    const faces = qh(this.vertices, { skipTriangulation: true });
    this.faces = faces;

    // 2) build unique undirected edges from those faces
    const edgeSet = new Set();
    this.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i], b = face[(i + 1) % n];
        // sort so “3-7” === “7-3”
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    // store as [[i,j],…]
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

  /**
   * Returns the number of faces in this polytope.
   * @returns {number}
   */
  computeFaces() {
    return this.faces.length;
  }

  /**
   * Triangulates each face into triangles for rendering.
   * Supports n-gons by fan triangulation.
   * @returns {Array<[number, number, number]>}
   */
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
      // ignore degenerate faces with fewer than 3 vertices
    }
    return tris;
  }

  toJSON() {
    return {
      name: 'Unnamed Polytope',
      vertices: this.vertices,
      faces: this.faces,
      edges: this.edges,
      center: this.center,
    };
  }
}
