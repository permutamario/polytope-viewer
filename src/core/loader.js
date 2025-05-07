// File: src/core/loader.js

/**
 * Load all JS builder files listed in
 *   /polytopes/build_functions/builders.json
 * then dynamically import each module and return a map of builders.
 *
 * builders.json should live alongside your builder .js files, e.g.:
 *   [
 *     "build_tetrahedron.js",
 *     "build_cube.js",
 *     "build_octahedron.js",
 *     // …
 *   ]
 *
 * @returns {Promise<Record<string,Function>>}
 */
export async function loadData() {
  // Base URL for your builders folder:
  const baseURL = `${window.location.origin}/polytope-viewer/polytopes/build_functions/`;
  const manifestURL = baseURL + 'builders.json';

  // 1) Fetch the manifest
  const resp = await fetch(manifestURL);
  if (!resp.ok) {
    throw new Error(`Could not load builders manifest at ${manifestURL}: ${resp.status}`);
  }
  const fileList = await resp.json();

  // 2) Import each builder and collect into an object
  const builders = {};
  await Promise.all(
    fileList.map(async (filename) => {
      const fileURL = baseURL + filename;
      try {
        // dynamic import; webpackIgnore ensures it uses the raw URL
        const mod = await import(/* webpackIgnore: true */ fileURL);

        // pick the first exported function as the builder
        const builderFn = Object.values(mod).find((exp) => typeof exp === 'function');
        if (!builderFn) {
          console.warn(`No function export found in ${filename}`);
          return;
        }

        // derive polytope name: strip "build_" prefix and ".js" suffix
        const polyName = filename.replace(/^build_/, '').replace(/\.js$/, '');
        builders[polyName] = builderFn;
      } catch (err) {
        console.warn(`Error loading builder "${filename}":`, err);
      }
    })
  );

  return builders;
}
