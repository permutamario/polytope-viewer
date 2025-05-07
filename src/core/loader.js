// File: src/core/loader.js

/**
 * Load all JS builder files listed in
 *   /polytopes/build_functions/builders.json
 * then dynamically import each module and return a map of builders.
 *
 * Each builder file should begin with a comment:
 *   // PolytopeName
 * which will be used as its key in the returned map.
 *
 * @returns {Promise<Record<string,Function>>}
 */
export async function loadData() {
  const baseURL     = `${window.location.origin}/polytope-viewer/polytopes/build_functions/`;
  const manifestURL = baseURL + 'builders.json';

  // 1) Fetch the manifest
  const resp = await fetch(manifestURL);
  if (!resp.ok) {
    throw new Error(`Could not load builders manifest at ${manifestURL}: ${resp.status}`);
  }
  const fileList = await resp.json();

  // 2) For each filename:
  const builders = {};
  await Promise.all(
    fileList.map(async (filename) => {
      const fileURL = baseURL + filename;

      try {
        // 2a) Fetch the raw source to read its first-line comment
        const srcResp = await fetch(fileURL);
        if (!srcResp.ok) {
          console.warn(`Could not fetch source for ${filename}: ${srcResp.status}`);
          return;
        }
        const source   = await srcResp.text();
        const firstLine = source.split(/\r?\n/)[0].trim();

        // 2b) Extract the name from "// PolytopeName"
        let polyName;
        const m = firstLine.match(/^\/\/\s*(.+)$/);
        if (m) {
          polyName = m[1].trim();
        } else {
          // fallback to stripping "build_" and ".js"
          polyName = filename.replace(/^build_/, '').replace(/\.js$/, '');
        }

        // 2c) Dynamically import the module and grab its first function export
        const mod       = await import(/* webpackIgnore: true */ fileURL);
        const builderFn = Object.values(mod).find(exp => typeof exp === 'function');
        if (!builderFn) {
          console.warn(`No function export found in ${filename}`);
          return;
        }

        // 2d) Register it under the parsed name
        builders[polyName] = builderFn;

      } catch (err) {
        console.warn(`Error loading builder "${filename}":`, err);
      }
    })
  );

  return builders;
}
