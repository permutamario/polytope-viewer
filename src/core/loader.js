// File: src/core/loader.js

/**
 * Load all JS builder files from /polytopes/build_functions/,
 * parse their top‐line comment (“// PolytopeName”) for the name,
 * dynamically import each module, and return a map of builders.
 *
 * Works under python3 -m http.server or any static HTTP host.
 *
 * @returns {Promise<Record<string, Function>>}
 */
export async function loadData() {
  // 1) Point at the correct folder:
  const baseURL = `${window.location.origin}/polytopes/build_functions/`;
  console.log('Loader baseURL →', baseURL);

  // 2) Fetch the directory listing HTML
  const dirResp = await fetch(baseURL);
  if (!dirResp.ok) {
    throw new Error(`Could not list builder_functions at ${baseURL} (status ${dirResp.status})`);
  }
  const dirHtml = await dirResp.text();

  // 3) Parse out all <a> links and extract href filenames
  const doc     = new DOMParser().parseFromString(dirHtml, 'text/html');
  const rawHrefs = Array.from(doc.querySelectorAll('a[href]'))
    .map(a => a.getAttribute('href'));

  // 4) Keep only files matching build_*.js
  const filenames = rawHrefs
    .map(h => h.split('/').pop())            // drop any path segments
    .filter(name => /^build_.*\.js$/.test(name));

  console.log('Found build files →', filenames);

  const builders = {};

  // 5) For each builder file: fetch its source, read the name comment, then import it
  await Promise.all(filenames.map(async filename => {
    const fileURL = baseURL + filename;
    console.log('  Loading builder →', fileURL);

    try {
      // 5a) Fetch raw source to grab the leading `// PolytopeName`
      const srcResp = await fetch(fileURL);
      if (!srcResp.ok) {
        console.warn(`Failed to fetch builder source: ${filename}`);
        return;
      }
      const sourceText = await srcResp.text();
      const firstLine  = sourceText.split('\n', 1)[0].trim();
      const polyName   = firstLine.startsWith('//')
        ? firstLine.slice(2).trim()
        : filename.replace('.js', '');

      // 5b) Dynamically import the module and grab its first function export
      const mod       = await import(fileURL);
      const builderFn = Object.values(mod).find(exp => typeof exp === 'function');
      if (builderFn) {
        builders[polyName] = builderFn;
        console.log(`    Registered builder: ${polyName}`);
      }
    } catch (err) {
      console.warn(`Error loading builder ${filename}:`, err);
    }
  }));

  return builders;
}
