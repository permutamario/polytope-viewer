#!/usr/bin/env sage
# File: build_root_polytope_A3.py


import math
try:
    from sage.all import Polyhedron
except ImportError:
    Polyhedron = None

def _placeholder_polytope():
    return None, "Error: Sage Not Loaded"

def build_root_polytope_A3():
    """
    Convex hull of roots ±(e_i−e_j), 1≤i<j≤4, projected into R³.
    """
    roots = []
    for i in range(4):
        for j in range(i+1,4):
            v=[0]*4; v[i]=1; v[j]=-1
            roots.append(v); roots.append([-x for x in v])

    # basis
    def dot(u,v): return sum(x*y for x,y in zip(u,v))
    def sub(u,v): return [x-y for x,y in zip(u,v)]
    def scale(u,s): return [x*s for x in u]
    def norm(u): return math.sqrt(dot(u,u))
    raw=[[1,-1,0,0],[0,1,-1,0],[0,0,1,-1]]
    ons=[]
    for b in raw:
        u=b[:]
        for e in ons:
            p=dot(u,e); u=sub(u,scale(e,p))
        nrm=norm(u)
        if nrm>1e-8: ons.append(scale(u,1/nrm))

    verts3=[tuple(dot(v,e) for e in ons) for v in roots]

    if not Polyhedron: return _placeholder_polytope()
    poly=Polyhedron(vertices=verts3)
    try:
        if poly.dim()>3: poly=poly.projection(0,1,2)
    except: pass
    return poly, "RootPolytope A3"
