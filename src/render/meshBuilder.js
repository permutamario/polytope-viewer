// src/render/meshBuilder.js
import * as THREE from '../../vendor/three.module.js';
import { detectPlatform } from '../core/utils.js';

/**
 * Build a THREE.Mesh (and optional edges) from polytope JSON data.
 * `data` should have `vertices: [[x,y,z], ...]` and `faces: [[i,j,k,...], ...].
 */
export function buildMesh(data, settings) {
  const { vertices, faces } = data;

  const geom = new THREE.BufferGeometry();
  const flatVerts = vertices.flat();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(flatVerts, 3));

  const indices = [];
  faces.forEach(face => {
    for (let i = 1; i < face.length - 1; i++) {
      indices.push(face[0], face[i], face[i + 1]);
    }
  });
  geom.setIndex(indices);
  geom.computeVertexNormals();

  // Material
  const matOptions = {
    color: settings.colorScheme === 'default' ? 0x156289 : settings.customColor || 0xffffff,
    transparent: true,
    opacity: settings.opacity ?? 0.8,
    side: THREE.DoubleSide,
  };
  const material = detectPlatform()
    ? new THREE.MeshLambertMaterial(matOptions)
    : new THREE.MeshStandardMaterial({ ...matOptions, roughness: 0.5, metalness: 0.1 });

  const mesh = new THREE.Mesh(geom, material);

  // Optional edges
  if (settings.showEdges) {
    const edges = new THREE.EdgesGeometry(geom);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    mesh.add(line);
  }

  return mesh;
}
