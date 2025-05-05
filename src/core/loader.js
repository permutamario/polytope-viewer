import { EventEmitter } from './utils.js';
const emitter = new EventEmitter();

/**
 * Load manifest and all polytope geometry JSON files.
 * Expects `../../polytopes/data/manifest.json` to be a list of filenames
 */
export async function loadData() {
  const manifestResp = await fetch('../../polytopes/data/manifest.json');
  if (!manifestResp.ok) {
    throw new Error('Failed to fetch polytope manifest');
  }
  
  const fileList = await manifestResp.json();
    const geometries = {};
    const fileoutputs = {};
  const manifest = fileList.map(file => {
    // Extract name from filename (remove .json extension)
    const name = file.replace('.json', '');
    return { name, file };
  });

  await Promise.all(
    manifest.map(async ({ name, file }) => {
      const url = `../../polytopes/data/${file}`;
	const resp = await fetch(url);
      if (!resp.ok) {
        console.warn(`Warning: failed to load ${name} from ${file}`);
        return;
      }
	const fileoutput =  await resp.json();
	fileoutputs[name] = fileoutput;
    })
  );
    const values = Object.values(fileoutputs);
    for (let i = 0; i < values.length; i++) {
	const value = values[i]
	//console.log(value);
	geometries[value.name] = value;
    }
  emitter.emit('loaded', { manifest, geometries });
  return { manifest, geometries };
}

/** Subscribe to data-loaded event */
export function onDataLoaded(listener) {
  emitter.on('loaded', listener);
}
