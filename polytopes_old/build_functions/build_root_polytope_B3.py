#!/usr/bin/env sage
# File: build_root_polytope_B3.py

import math
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_root_polytope_B3():
    """
    B3 root polytope: convex hull of roots ±e_i and ±e_i±e_j (i≠j) in R³.
    """
    roots = []
    # Standard basis vectors and their negatives (±e_i)
    for i in range(3):
        v = [0]*3
        v[i] = 1
        roots.append(v)
        roots.append([-x for x in v])
    
    # Vectors of the form ±e_i±e_j for i<j
    for i in range(3):
        for j in range(i+1,3):
            for si in [-1, 1]:
                for sj in [-1, 1]:
                    v = [0]*3
                    v[i] = si
                    v[j] = sj
                    roots.append(v)
    
    # Helper functions for vector operations
    def dot(u,v): return sum(x*y for x,y in zip(u,v))
    def sub(u,v): return [x-y for x,y in zip(u,v)]
    def scale(u,s): return [x*s for x in u]
    def norm(u): return math.sqrt(dot(u,u))

    # The vectors are already in R³, so no projection needed
    verts3 = [tuple(v) for v in roots]

    if not Polyhedron: return _placeholder_polytope()
    poly = Polyhedron(vertices=verts3)
    return poly, "RootPolytope B3"
