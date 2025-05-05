#!/usr/bin/env sage
# File: build_root_polytope_H3.py

try:
    from sage.geometry.polyhedron.library import polytopes
    from sage.all import Polyhedron
except ImportError:
    polytopes = None
    Polyhedron = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_root_polytope_H3():
    """
    Builds the H₃ root polytope using Sage’s library:
    the icosidodecahedron from the root system H3.
    """
    if not (polytopes and Polyhedron):
        return _placeholder_polytope()

    # Sage provides the icosidodecahedron as the H3 root polytope
    poly = polytopes.icosidodecahedron()

    # No isinstance check so we trust Sage’s output
    return poly, "RootPolytope H3"
