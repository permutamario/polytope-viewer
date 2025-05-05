try:
    from sage.geometry.polyhedron.library import polytopes
except ImportError:
    polytopes = None

def _placeholder_polytope():
    """Return (None, error message) when Sage isn't available."""
    return None, "Error: Sage Not Loaded"

def build_icosahedron():
    """Builds the Icosahedron."""
    if not polytopes:
        return _placeholder_polytope()
    poly = polytopes.icosahedron()
    try:
        if poly.dim() > 3:
            poly = poly.projection(0,1,2)  # project 4D→3D
    except Exception:
        pass
    return poly, "Icosahedron"
