#!/usr/bin/env sage
# File: build_permutahedron_A3.py

import math
from itertools import permutations
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    """
    Returns (None, error message) when Sage isn’t available.
    """
    return None, "Error: Sage Not Loaded"

def _dot(a, b):
    return sum(x*y for x, y in zip(a, b))

def _scale(v, s):
    return [x * s for x in v]

def _sub(u, v):
    return [x - y for x, y in zip(u, v)]

def _norm(v):
    return math.sqrt(_dot(v, v))

def _orthonormal_basis(vs):
    """
    Gram–Schmidt on list of vectors vs in R^4, returning
    a list of unit vectors spanning the same subspace.
    """
    es = []
    for v in vs:
        # subtract projections onto earlier e's
        u = v[:]
        for e in es:
            proj_coeff = _dot(u, e)
            u = _sub(u, _scale(e, proj_coeff))
        n = _norm(u)
        if n < 1e-8:
            continue
        es.append(_scale(u, 1.0/n))
    return es

def build_permutahedron():
    """
    Builds the A₃ permutahedron by:
      1. Generating all 24 permutations of (1,2,3,4).
      2. Choosing an orthonormal basis for the hyperplane x1+x2+x3+x4=0.
      3. Projecting each 4D permutation point onto that basis.
      4. Feeding the resulting 3D points to Sage’s Polyhedron constructor.
    Returns:
      - (poly, "Permutahedron A₃") where `poly` is a Sage Polyhedron, or
      - (None, err_msg) if Sage isn’t available.
    """
    # 1) List of all permutations in R^4
    perms4 = list(permutations((1, 2, 3, 4)))

    # 2) Basis of the sum-zero hyperplane: e1-e2, e2-e3, e3-e4
    basis4 = [
        (1, -1,  0,  0),
        (0,  1, -1,  0),
        (0,  0,  1, -1),
    ]
    # Orthonormalize them
    ons = _orthonormal_basis([list(v) for v in basis4])
    if len(ons) < 3:
        return None, "Error: failed to compute orthonormal basis"

    # 3) Project each 4D point into R^3 via dot with each orthonormal vector
    verts3 = []
    for p in perms4:
        coords = []
        for e in ons:
            coords.append(float(_dot(p, e)))
        verts3.append(tuple(coords))

    # 4) Build the Sage Polyhedron
    if not Polyhedron:
        return _placeholder_polytope()

    poly = Polyhedron(vertices=verts3)

    # sanity check
    if not hasattr(poly, "vertices_list"):
        return None, "Error: result is not a Polyhedron"

    return poly, "Permutahedron"

