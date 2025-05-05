# IMPORTANT: This script must be run from within the 'polytopes' directory
# using the SageMath interpreter!
# Example: cd /path/to/polytope-viewer/polytopes
#          sage generate_jsons.py

import math
import os
import sys
import json
import importlib
from collections import OrderedDict
import inspect # To find functions within modules
from pathlib import Path
import traceback # For detailed error printing on exceptions

# --- Configuration ---
BUILD_FUNCTIONS_DIR = "build_functions"
OUTPUT_DATA_DIR = "data"
BUILD_FUNCTION_PREFIX = "build_" # Expected prefix for builder functions
MANIFEST_FILENAME = "manifest.json" # Name of the manifest file

# --- Ensure SageMath Polyhedron is available ---
try:
    # Import necessary Sage components
    from sage.all import Polyhedron, RR, ZZ # RR/ZZ not strictly needed now, but good practice

    # import the cyclic sorter
    from sage.geometry.polyhedron.plot import cyclic_sort_vertices_2d

except ImportError:
    print("ERROR: Could not import SageMath components (Polyhedron).")
    print("Please ensure this script is run using the 'sage' interpreter.")
    print("Exiting.")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: An unexpected error occurred during SageMath import: {e}")
    print("Exiting.")
    sys.exit(1)
def sage_polytope_to_json_data(polytope_sage, name):
    try:
        if polytope_sage.dim() != 3:
            return None
    except Exception:
        return None
    
    # --- helper to compute center of mass ---
    def compute_center_of_mass(poly, verts_list):
        # Try Sage's built‑in centroid/center‑of‑mass if available
        for method in ("center_of_mass", "centroid", "center"):
            if hasattr(poly, method):
                try:
                    c = getattr(poly, method)()
                    return [float(ci) for ci in c]
                except Exception:
                    break
        # Fallback: average the provided vertex coordinates
        n = len(verts_list)
        dim = len(verts_list[0])
        return [
            sum(verts_list[j][i] for j in range(n)) / n
            for i in range(dim)
        ]


    try:
        verts = polytope_sage.vertices_list()
        vertices = [[float(c) for c in v] for v in verts]

        faces = []
        for facet in polytope_sage.facets():
            # 1) collect the Vertex objects for this facet
            vs = list(facet.vertices())
            # 2) sort them cyclically in the plane of the facet
            cycle = cyclic_sort_vertices_2d(vs)
            # 3) record their original indices
            faces.append([v.index() for v in cycle])

        
        data = OrderedDict([
            ("name", name),
            ("vertices", vertices),
            ("faces", faces),
            ("_comment_coord_type", "float (forced)")
        ])
        data["center"] = [float(i) for i in polytope_sage.center()] #Also has a center
    
        return data

    except Exception:
        return None


def save_json_to_file(data, filename, output_dir):
    """Saves the dictionary data as a JSON file with indentation."""
    if not data:
        return False

    output_dir_path = Path(output_dir)
    try:
        output_dir_path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"ERROR: Could not create output directory {output_dir_path}: {e}")
        return False

    filepath = output_dir_path / filename
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"--- Successfully saved: {filepath}")
        return True
    except IOError as e:
        print(f"ERROR saving file {filepath}: {e}")
    except TypeError as e:
         print(f"ERROR serializing data to JSON for {filepath}. Check data types. Error: {e}")
         traceback.print_exc()
    return False

def generate_polytope_list_manifest(data_dir, manifest_filename=MANIFEST_FILENAME):
    """
    Scans the data directory for *.json files (excluding the manifest itself)
    and creates a manifest JSON file listing their filenames.
    """
    data_dir_path = Path(data_dir)
    if not data_dir_path.is_dir():
        print(f"WARNING: Data directory '{data_dir}' not found. Cannot generate manifest.")
        return False

    try:
        all_json_files = [f for f in data_dir_path.glob("*.json") if f.is_file()]
        polytope_json_files = sorted([f.name for f in all_json_files if f.name != manifest_filename])

        print(f"\n--- Generating Manifest File ('{manifest_filename}')...")
        print(f"    - Found {len(polytope_json_files)} polytope JSON files in '{data_dir_path}'.")

        manifest_filepath = data_dir_path / manifest_filename
        manifest_data = polytope_json_files

        with open(manifest_filepath, 'w') as f:
            json.dump(manifest_data, f, indent=2)
        print(f"--- Successfully saved manifest: {manifest_filepath}")
        return True

    except Exception as e:
        print(f"ERROR generating or saving polytope list manifest: {e}")
        traceback.print_exc()
        return False


# --- Main Script Logic ---

def main():
    try:
        script_dir = Path(__file__).parent.resolve()
        build_dir = script_dir / BUILD_FUNCTIONS_DIR
        data_dir = script_dir / OUTPUT_DATA_DIR
    except Exception as e:
        print(f"ERROR: Failed to resolve script paths: {e}")
        sys.exit(1)

    print("=" * 50)
    print(f"Starting Polytope JSON Generation")
    print(f"Looking for builder modules in: {build_dir}")
    print(f"Outputting JSON to: {data_dir}")
    print(f"Looking for functions starting with: '{BUILD_FUNCTION_PREFIX}'")
    print(f"NOTE: Vertex coordinates will ALWAYS be saved as floats.") # Added note
    print("=" * 50)

    if not build_dir.is_dir():
        print(f"ERROR: Build functions directory not found: {build_dir}")
        sys.exit(1)

    original_sys_path = list(sys.path)
    sys.path.insert(0, str(script_dir))

    build_results_summary = []
    processed_count = 0
    conversion_error_count = 0
    build_error_count = 0
    # float_usage_count is no longer needed as it's always true now
    total_functions_found = 0

    try:
        python_files = [f for f in build_dir.rglob("*.py") if f.name != "__init__.py"]
    except Exception as e:
        print(f"ERROR: Failed to scan build directory {build_dir}: {e}")
        sys.path = original_sys_path
        sys.exit(1)

    if not python_files:
        print(f"WARNING: No Python files (*.py) found in {build_dir}")

    for module_file_path in python_files:
        try:
             relative_path = module_file_path.relative_to(script_dir)
             module_import_name = str(relative_path.with_suffix('')).replace(os.sep, '.')
        except ValueError:
             print(f"ERROR: Could not determine relative path for module: {module_file_path}")
             build_error_count += 1
             continue

        print(f"\n>>> Scanning Module: {module_file_path.name} (as {module_import_name})")
        module_found_build_func = False

        try:
            module = importlib.import_module(module_import_name)

            for member_name, member_object in inspect.getmembers(module, inspect.isfunction):
                if member_name.startswith(BUILD_FUNCTION_PREFIX):
                    module_found_build_func = True
                    total_functions_found += 1
                    build_func = member_object
                    polytope_identifier = member_name.replace(BUILD_FUNCTION_PREFIX, "", 1)
                    json_filename = f"{polytope_identifier}.json"

                    print(f"  -> Found builder function: {member_name}() -> {json_filename}")

                    current_result = {
                        'module': module_file_path.name,
                        'function': member_name,
                        'json_file': json_filename,
                        'status': 'Fail', # Default status
                        'message': ''
                    }
                    build_results_summary.append(current_result)

                    try:
                        sage_poly, display_name = build_func()
                        # Used_floats is always True now, but we still get json_data
                        json_data = sage_polytope_to_json_data(sage_poly, display_name)

                        if json_data:
                            save_success = save_json_to_file(json_data, json_filename, data_dir)
                            if save_success:
                                current_result['status'] = 'Success'
                                processed_count += 1
                                # No need to track float_usage_count
                            else:
                                conversion_error_count += 1
                                current_result['message'] = 'Save failed'
                        else:
                             conversion_error_count += 1
                             current_result['message'] = 'Conversion failed'

                    except Exception as e_build:
                         print(f"ERROR: Failed during execution or conversion for function '{member_name}' in {module_file_path.name}: {e_build}")
                         traceback.print_exc()
                         build_error_count += 1
                         current_result['message'] = f'Execution error: {e_build}'

            if not module_found_build_func:
                print(f"    - No functions starting with '{BUILD_FUNCTION_PREFIX}' found in this module.")

        except ImportError as e_imp:
            print(f"ERROR: Failed to import module {module_import_name}: {e_imp}")
            build_error_count += 1
        except Exception as e_mod:
            print(f"ERROR: An unexpected error occurred while processing module {module_file_path.name}: {e_mod}")
            traceback.print_exc()
            build_error_count += 1

    # --- Generate the Manifest File ---
    manifest_success = generate_polytope_list_manifest(data_dir, MANIFEST_FILENAME)

    # --- Restore sys.path ---
    sys.path = original_sys_path

    # --- Print Detailed Build Summary ---
    print("\n" + "=" * 50)
    print("Detailed Build Function Summary:")
    print("-" * 50)
    if not build_results_summary:
        print("No builder functions found to summarize.")
    else:
        build_results_summary.sort(key=lambda x: (x['module'], x['function']))
        for result in build_results_summary:
            marker = "[✓]" if result['status'] == 'Success' else "[X]"
            message = f" ({result['message']})" if result['message'] else ""
            # Adjusted spacing slightly
            print(f"{marker} {result['module']:<25} :: {result['function']:<30} -> {result['json_file']}{message}")
    print("-" * 50)

    # --- Print Final Overall Summary ---
    print("\n" + "=" * 50)
    print(f"Generation Complete.")
    print(f"Python files scanned: {len(python_files)}")
    print(f"Builder functions found ({BUILD_FUNCTION_PREFIX}*): {total_functions_found}")
    print("-" * 30)
    print(f"Successfully generated and saved: {processed_count} polytopes.")
    # Removed float usage count line
    failures = total_functions_found - processed_count
    if failures > 0:
         print(f"Failed attempts (see details above): {failures}")

    print("-" * 30)
    if manifest_success:
        print(f"Manifest file '{MANIFEST_FILENAME}' generated successfully.")
    else:
        print(f"Manifest file generation FAILED.")
    print("=" * 50)


# --- Script Entry Point ---
if __name__ == "__main__":
    main()
