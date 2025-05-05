#!/usr/bin/env sage
# File: build_permutahedron_B3.py

import itertools
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    """
    Returns (None, error message) when Sage isn’t available.
    """
    return None, "Error: Sage Not Loaded"

def build_permutahedron_B3():
    """
    Constructs the Type B₃ permutahedron by:
      1. Generating all signed permutations of (1,2,3) in pure Python.
      2. Centering the point‐set at the origin.
      3. Feeding the resulting 3D vertices to Sage’s Polyhedron constructor.
    Returns:
      - (poly, "Permutahedron B₃") where `poly` is a Sage Polyhedron, or
      - (None, err_msg) on failure.
    """
    # 1) Generate all signed permutations of (1,2,3)
    base = (1, 2, 3)
    perms = list(itertools.permutations(base))
    signs = list(itertools.product((-1, 1), repeat=3))
    
    pts = []
    for p in perms:
        for s in signs:
            pts.append(tuple(float(s[i] * p[i]) for i in range(3)))
    
    if not pts:
        return None, "Error: no vertices generated"
    
    # 2) Center at the origin by subtracting the centroid
    n = len(pts)
    centroid = [sum(pt[i] for pt in pts) / n for i in range(3)]
    verts3 = [tuple(pt[i] - centroid[i] for i in range(3)) for pt in pts]
    
    # 3) Hand off to Sage
    if not Polyhedron:
        return _placeholder_polytope()

    poly = Polyhedron(vertices=verts3)
    if not hasattr(poly, "vertices_list"):
        return None, "Error: construction did not yield a Polyhedron"
    
    return poly, "Permutahedron B₃"

