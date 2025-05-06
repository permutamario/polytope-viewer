#!/usr/bin/env sage
# File: build_stellahedron.py

import math
import itertools
try:
    from sage.all import Polyhedron, vector, QQ
except ImportError:
    Polyhedron = None
    vector = None
    QQ = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_stellahedron():
    """
    Construct the 3D stellahedron as the Minkowski sum of 
    independence polytopes.
    
    The stellahedron is the Minkowski sum of the independence
    polytopes of uniform matroids u_1,3, u_2,3, and u_3,3.
    
    Returns:
        A tuple containing:
        - The Sage Polyhedron object representing the stellahedron
        - A string with the name "Stellahedron"
    """
    if not Polyhedron:
        return _placeholder_polytope()

    try:
        # Build the independence polytope of u_1,3
        # This is the convex hull of all 0-1 vectors with at most 1 ones
        u_1_3_vertices = [
            [0, 0, 0],  # Empty set
            [1, 0, 0],  # {1}
            [0, 1, 0],  # {2}
            [0, 0, 1]   # {3}
        ]
        u_1_3_polytope = Polyhedron(vertices=u_1_3_vertices, base_ring=QQ)
        
        # Build the independence polytope of u_2,3
        # This is the convex hull of all 0-1 vectors with at most 2 ones
        u_2_3_vertices = [
            [0, 0, 0],  # Empty set
            [1, 0, 0],  # {1}
            [0, 1, 0],  # {2}
            [0, 0, 1],  # {3}
            [1, 1, 0],  # {1,2}
            [1, 0, 1],  # {1,3}
            [0, 1, 1]   # {2,3}
        ]
        u_2_3_polytope = Polyhedron(vertices=u_2_3_vertices, base_ring=QQ)
        
        # Build the independence polytope of u_3,3
        # This is the convex hull of all 0-1 vectors with at most 3 ones
        # In this case, it's all possible 0-1 vectors in 3D
        u_3_3_vertices = [
            [0, 0, 0],  # Empty set
            [1, 0, 0],  # {1}
            [0, 1, 0],  # {2}
            [0, 0, 1],  # {3}
            [1, 1, 0],  # {1,2}
            [1, 0, 1],  # {1,3}
            [0, 1, 1],  # {2,3}
            [1, 1, 1]   # {1,2,3}
        ]
        u_3_3_polytope = Polyhedron(vertices=u_3_3_vertices, base_ring=QQ)
        
        # Compute the Minkowski sum: u_1,3 + u_2,3 + u_3,3
        # We do this step by step
        temp_sum = u_1_3_polytope.minkowski_sum(u_2_3_polytope)
        stellahedron = temp_sum.minkowski_sum(u_3_3_polytope)
        
        return stellahedron, "Stellahedron"
    except Exception as e:
        return None, f"Error constructing stellahedron: {str(e)}"
