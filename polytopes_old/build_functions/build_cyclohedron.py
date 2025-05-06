#!/usr/bin/env sage
# File: build_cyclohedron_3d.py

"""
build_cyclohedron.py

Constructs the 3D Cyclohedron (graph‐associahedron of the 4‐cycle) by:
  1. Taking the 20 raw 4D vertices v(T) = (v0,v1,v2,v3) where
     vi = |{tubes in T containing node i}| for each maximal tubing T.
  2. Centering each 4D vector to lie in the hyperplane ∑ vi = 0.
  3. Projecting these centered 4D points into ℝ³ via an orthonormal basis.
  4. Feeding the resulting 3D points to Sage’s Polyhedron constructor.
"""

import math

# Sage imported only at the end
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_cyclohedron():
    """
    Returns:
      - (poly, "Cyclohedron (3D)") where poly is a Sage Polyhedron, or
      - (None, err_msg) if Sage isn’t available.
    """
    # 1) Raw 4D vertices as provided
    verts4 = [
        [0,1,2,3], [0,1,3,2], [0,2,1,2], [0,2,3,1], [0,3,2,1],
        [1,0,2,3], [1,0,3,2], [1,2,0,2], [1,2,3,0], [1,3,2,0],
        [2,0,1,3], [2,0,2,1], [2,1,0,3], [2,1,2,0], [2,3,0,1],
        [2,3,1,0], [3,0,1,2], [3,1,0,2], [3,2,0,1], [3,2,1,0]
    ]

    # 2) Center into hyperplane sum=0 by subtracting the mean of each vector
    n = 4
    centered = []
    for v in verts4:
        mean = sum(v) / n
        centered.append([vi - mean for vi in v])

    # 3) Build an orthonormal basis of the sum-zero hyperplane in R^4
    def dot(u, v): return sum(ui*vi for ui, vi in zip(u, v))
    def sub(u, v): return [ui - vi for ui, vi in zip(u, v)]
    def scale(u, s): return [ui * s for ui in u]
    def norm(u): return math.sqrt(dot(u, u))

    raw_basis = [
        [1, -1,  0,  0],
        [0,  1, -1,  0],
        [0,  0,  1, -1]
    ]
    ons = []
    for b in raw_basis:
        u = b[:]
        for e in ons:
            proj = dot(u, e)
            u = sub(u, scale(e, proj))
        nrm = norm(u)
        if nrm > 1e-8:
            ons.append(scale(u, 1.0/nrm))

    # 4) Project each centered 4D point into R^3 via dot with each basis vector
    verts3 = []
    for v in centered:
        coords3 = [dot(v, e) for e in ons]
        verts3.append(tuple(coords3))

    # 5) Hand off to Sage
    if not Polyhedron:
        return _placeholder_polytope()

    poly = Polyhedron(vertices=verts3)
    # ensure truly 3D
    try:
        if poly.dim() > 3:
            poly = poly.projection(0, 1, 2)
    except Exception:
        pass

    return poly, "Cyclohedron"

