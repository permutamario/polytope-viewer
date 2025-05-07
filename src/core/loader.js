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

    const resp = await fetch(manifestURL);
    if (!resp.ok) throw new Error(`Could not load builders manifest: ${resp.status}`);

    const fileList = await resp.json();
    const builders = {};

    await Promise.all(
	fileList.map(async (filename) => {
	    const fileURL = baseURL + filename;

	    try {
		const srcResp = await fetch(fileURL);
		if (!srcResp.ok) {
		    console.warn(`Could not fetch source for ${filename}: ${srcResp.status}`);
		    return;
		}
		const source = await srcResp.text();
		const firstLine = source.split(/\r?\n/)[0].trim();
		const nameMatch = firstLine.match(/^\/\/\s*(.+)$/);
		if (!nameMatch) {
		    console.warn(`No polytope name found in comment for "${filename}" — using fallback name.`);
		}
		const polyName = nameMatch
		      ? nameMatch[1].trim()
		      : filename.replace(/^build_/, '').replace(/\.js$/, '');

		const mod = await import(/* webpackIgnore: true */ fileURL);
		const builderFn = Object.values(mod).find(fn => typeof fn === 'function');

		if (!builderFn) {
		    console.warn(`No function export found in ${filename}`);
		    return;
		}

		// Attach metadata for UI generation
		builderFn.defaults = builderFn.defaults || {}; // Ensure structure exists
		builderFn.meta = {
		    name: polyName,
		    parameterSchema: builderFn.defaults,
		};

		builders[polyName] = builderFn;

	    } catch (err) {
		console.warn(`Error loading builder "${filename}":`, err);
	    }
	})
    );

    return builders;
}
