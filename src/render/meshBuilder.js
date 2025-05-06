// src/render/meshBuilder.js
import * as THREE from '../../vendor/three.module.js';
import { detectPlatform } from '../core/utils.js';

/**
 * Build a THREE.Mesh (and optional edges) from polytope JSON data.
 * `data` should have `vertices: [[x,y,z], ...]` and `faces: [[i,j,k,...], ...].
 * `settings.colorSchemeColors` may be an array of hex colors to apply per original face.
 */
export function buildMesh(polytope, state) {
    const settings = state.settings;
    const vertices = polytope.vertices;
    const faces = polytope.faces;


  // --- Geometry setup ---
  const geom = new THREE.BufferGeometry();
  const flatVerts = vertices.flat();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(flatVerts, 3));

  // Triangulate original faces into index array and groups
  const indices = [];
  const groups = [];
  let idxOffset = 0;
  faces.forEach((face, fi) => {
    // triangulate face as fan
    let triCount = 0;
    for (let i = 1; i < face.length - 1; i++) {
      const a = face[0], b = face[i], c = face[i+1];
      indices.push(a, b, c);
      triCount++;
    }
    if (triCount > 0) {
      groups.push({ start: idxOffset, count: triCount * 3, materialIndex: groups.length });
      idxOffset += triCount * 3;
    }
  });
  geom.setIndex(indices);
  geom.clearGroups();
  groups.forEach(g => geom.addGroup(g.start, g.count, g.materialIndex));
  geom.computeVertexNormals();

  // --- Materials per face-group ---
  const defaultOpacity = settings.faceOpacity ?? 0.8;
  const isTransparent = defaultOpacity < 1;
  const materialType = detectPlatform()
    ? THREE.MeshLambertMaterial
    : THREE.MeshStandardMaterial;

  // Determine color array for faces
  const schemeColors = state.colorSchemes[settings.colorScheme];

  const faceMaterials = groups.map((_, gi) => {
    const colorHex = schemeColors[gi % schemeColors.length];
    const matOpts = {
      color: colorHex,
      transparent: isTransparent,
      opacity: defaultOpacity,
      side: THREE.DoubleSide,
      depthWrite: defaultOpacity >= 0.95
    };
    // PBR props if standard
    if (materialType === THREE.MeshStandardMaterial) {
      matOpts.roughness = 0.5;
      matOpts.metalness = 0.1;
    }
    return new materialType(matOpts);
  });

  const mesh = new THREE.Mesh(geom, faceMaterials);

  // --- Optional edges ---
  if (settings.showEdges) {
    const edgesGeom = new THREE.EdgesGeometry(geom);
    const edgesMat  = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edgeLines = new THREE.LineSegments(edgesGeom, edgesMat);
    mesh.add(edgeLines);
  }

  return mesh;
}
