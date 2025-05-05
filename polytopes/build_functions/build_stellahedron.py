#!/usr/bin/env sage
# File: build_stellahedron_3d.py

import math
import itertools
try:
    from sage.all import Polyhedron, vector
except ImportError:
    Polyhedron = None
    vector = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_stellahedron():
    """
    Construct the 3D stellahedron.
    
    The 3D stellahedron is defined in relation to the permutohedron. 
    First we build the permutohedron in 3D (using permutations of [1,2,3,4]),
    then we define the stellahedron as all points with positive coordinates
    such that there exists a point in the permutohedron with the difference
    also having positive coordinates.
    
    Returns:
        A tuple containing:
        - The Sage Polyhedron object representing the stellahedron
        - A string with the name "Stellahedron 3D"
    """
    if not Polyhedron:
        return _placeholder_polytope()

    # First, construct the permutohedron vertices (permutations of [1,2,3,4])
    # projected to R³ by removing the constant component
    permutohedron_vertices = []
    for perm in itertools.permutations([1, 2, 3, 4]):
        # Project to R³ by removing the last coordinate
        permutohedron_vertices.append(perm[:-1])
    
    # Create the permutohedron
    if not Polyhedron:
        return _placeholder_polytope()
    
    try:
        permutohedron = Polyhedron(vertices=permutohedron_vertices)
        
        # To construct the stellahedron, we need to:
        # 1. Find all vertices of the permutohedron
        # 2. Find all relevant positive direction vectors
        # 3. Compute all vertices of the stellahedron by subtracting
        #    positive direction vectors from permutohedron vertices
        #    while keeping all coordinates positive
        
        # All possible unit direction vectors in the positive directions
        direction_vectors = [
            (1, 0, 0), (0, 1, 0), (0, 0, 1),
            (1, 1, 0), (1, 0, 1), (0, 1, 1),
            (1, 1, 1)
        ]
        
        stellahedron_vertices = set()
        
        # For each permutohedron vertex and each direction,
        # create potential stellahedron vertices
        for v in permutohedron.vertices():
            v_coords = tuple(v)
            
            # Add the permutohedron vertex itself
            stellahedron_vertices.add(v_coords)
            
            # Add vertices created by subtracting positive directions
            for d in direction_vectors:
                # Scale the direction vector
                for scale in range(1, 5):  # Try different scales
                    scaled_d = tuple(scale * di for di in d)
                    
                    # Subtract the scaled direction vector
                    new_vertex = tuple(v_coords[i] - scaled_d[i] for i in range(3))
                    
                    # Check if all coordinates are still positive
                    if all(x > 0 for x in new_vertex):
                        stellahedron_vertices.add(new_vertex)
        
        # Convert set of vertices to list
        stellahedron_vertices_list = list(stellahedron_vertices)
        
        # Create the stellahedron
        stellahedron = Polyhedron(vertices=stellahedron_vertices_list)
        
        return stellahedron, "Stellahedron"
    except Exception as e:
        return None, f"Error constructing stellahedron: {str(e)}"


