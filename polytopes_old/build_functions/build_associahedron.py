#!/usr/bin/env sage
# File: build_associahedron_3d.py

"""
Builds the 3D Associahedron manually via binary‐tree coordinates and SVD projection,
without using Sage until the final convex‐hull step.
"""

from functools import lru_cache
import numpy as np

# Import Sage’s Polyhedron only at the end
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_Loday_associahedron():
    """
    Returns:
      - (poly, \"Associahedron (3D)\") where poly is a Sage Polyhedron, or
      - (None, err_msg) if Sage isn’t available.
    """
    # 1) Enumerate full binary trees with n_leaves leaves (Catalan number)
    n_leaves = 5

    @lru_cache(maxsize=None)
    def gen_trees(m):
        """Return all full binary trees with m leaves, encoded recursively."""
        if m == 1:
            return [None]   # leaf
        out = []
        for left_count in range(1, m):
            right_count = m - left_count
            for L in gen_trees(left_count):
                for R in gen_trees(right_count):
                    out.append((L, R))
        return out

    def count_leaves(node):
        """Count leaves under this node."""
        if node is None:
            return 1
        return count_leaves(node[0]) + count_leaves(node[1])

    trees = gen_trees(n_leaves)

    # 2) Build feature matrix F: each row is [l_size * r_size] for each internal node in inorder
    F_list = []
    for T in trees:
        internal_nodes = []
        def inorder(n):
            if n is None:
                return
            inorder(n[0])
            internal_nodes.append(n)
            inorder(n[1])
        inorder(T)
        # for each internal node, feature = (size of left subtree)*(size of right subtree)
        features = [count_leaves(n[0]) * count_leaves(n[1]) for n in internal_nodes]
        F_list.append(features)

    F = np.array(F_list, dtype=float)

    # 3) Center rows to lie in hyperplane sum=0
    Fc = F - F.mean(axis=0)

    # 4) Project to R^3 via SVD principal components
    U, S, Vt = np.linalg.svd(Fc, full_matrices=False)
    pts3 = (Fc @ Vt[:3].T).tolist()

    # 5) Hand off to Sage for convex hull
    if not Polyhedron:
        return _placeholder_polytope()

    poly = Polyhedron(vertices=pts3)

    # Ensure truly 3D
    try:
        if poly.dim() > 3:
            poly = poly.projection(0, 1, 2)
    except Exception:
        pass

    return poly, "Loday Associahedron"

