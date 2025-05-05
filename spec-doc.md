# Refactored Polytope Viewer — Specification Document

This specification describes the refactored Polytope Viewer codebase, its modules, file structure, and extension points. It replaces the original intertwined files (`main.js`, `mobile.js`, `ui.js`, `viewer.js`, etc.) with a clean, modular layout.

---

## 1. Project Layout

```
polytope-viewer/
├── index.html
├── styles/
│   ├── base.css
│   ├── desktop.css
│   └── mobile.css
├── src/
│   ├── index.js
│   ├── core/
│   │   ├── utils.js
│   │   ├── loader.js
│   │   └── stateManager.js
│   ├── ui/
│   │   ├── baseControls.js
│   │   ├── desktopControls.js
│   │   └── mobileControls.js
│   └── render/
│       ├── sceneManager.js
│       ├── meshBuilder.js
│       └── exportManager.js
├── vendor/                ← Third‑party libs (Three.js, OrbitControls.js, GIF.js)
└── polytopes/             ← Geometry data and manifest
    ├── manifest.json
    └── data/
        ├── cube.json
        └── ...
```

---

## 2. Entry Point: `index.html` & `src/index.js`

* **index.html**: Minimal HTML shell. Loads CSS via `<link>` and bootstraps the app with:

  ```html
  <script type="module" src="src/index.js"></script>
  ```

* **src/index.js**:

  1. Detects platform (`core/utils.detectPlatform`).
  2. Loads polytope manifest + geometries (`core/loader.loadData`).
  3. Initializes global state (`core/stateManager.initializeState`).
  4. Sets default polytope in state (`state.setSetting('currentPolytope', …)`).
  5. Builds UI (`ui/desktopControls` or `ui/mobileControls`).
  6. Initializes Three.js scene (`render/sceneManager.setupScene`).

---

## 3. Core Modules (`src/core/`)

* **utils.js**: Pure helpers.

  * `detectPlatform()`: Mobile vs desktop.
  * `debounce()/throttle()`: Rate‑limit functions.
  * `EventEmitter`: Pub/sub for state changes.

* **loader.js**:

  * `loadData()`: Fetches `/polytopes/manifest.json` and each JSON geometry.
  * `onDataLoaded()`: Subscribe to "loaded" event if needed.

* **stateManager.js**:

  * Maintains `state` object: `{ data, settings, setSetting(), on(), off() }`.
  * Defaults: `animation`, `faceColor`, `faceOpacity`, `showEdges`, etc.
  * Emits `settingsChanged` on every `setSetting()`.

---

## 4. UI Modules (`src/ui/`)

* **baseControls.js**: Factory functions for standard controls:

  * `createSlider()`, `createCheckbox()`, `createColorPicker()`, `createDropdown()`, `createButton()`.

* **desktopControls.js**: Assembles sidebar controls:

  * Polytope selector dropdown.
  * Toggles/sliders for rotation, opacity, edges, color.
  * Export buttons (PNG & GIF).
  * Hooks control events to `state.setSetting()`.

* **mobileControls.js**: Builds mobile layout:

  * Fixed header with polytope selector.
  * Footer “Options” button toggles a sliding menu.
  * In‑menu controls mirror desktop toggles and exports.

---

## 5. Rendering Modules (`src/render/`)

* **sceneManager.js**:

  * Creates `THREE.WebGLRenderer`, `Scene`, `Camera`, `Lights`, and `OrbitControls`.
  * Exposes `renderer`, `scene`, `camera` on `state` for exports.
  * Subscribes to `settingsChanged` to:

    * Swap meshes when `currentPolytope` changes.
    * Update material color/opacity.
    * Toggle edge display.
    * Start/stop auto‑rotate.
  * Handles window resize and cleanup (`disposeScene()`).

* **meshBuilder.js**:

  * Converts JSON `{ vertices: [...], faces: [...] }` into `BufferGeometry`.
  * Triangulates n‑gons, computes normals.
  * Creates `MeshLambertMaterial` or `MeshStandardMaterial` based on platform.
  * Optionally adds `EdgesGeometry` for wireframes.

* **exportManager.js**:

  * `exportPNG()`: Captures current frame as PNG download.
  * `exportGIF()`: Records frames into GIF via `gif.js`, shows progress overlay.
  * Applies mobile‑specific frame limits and quality settings.

---

## 6. Data & Vendor Folders

* **vendor/**

  * Include script files *as is*: `three.module.js`, `OrbitControls.js`, `gif.js`, `gif.worker.js`.
  * No build or transpilation required.

* **polytopes/**

  * `manifest.json`: Array of `{ name: string, file: string }` entries.
  * `data/`: One JSON file per polytope containing its geometry.

---

## 7. Extending the Viewer

1. **Add a new polytope**:

   * Add its JSON to `polytopes/data/`.
   * Append `{ name: 'MyPoly', file: 'my-poly.json' }` to `polytopes/manifest.json`.
   * The UI dropdown and scene will pick it up automatically.

2. **New controls**:

   * Create a factory in `baseControls.js` if needed.
   * Add its UI in `desktopControls.js` and/or `mobileControls.js`, hooking to `state.setSetting()`.
   * Handle the new `settingsChanged` key in `sceneManager.js`.

3. **Styling**:

   * Global utilities in `styles/base.css`.
   * Layout tweaks in `styles/desktop.css` and `styles/mobile.css`.

4. **Third‑party upgrades**:

   * Swap out `vendor/three.module.js` for a newer Three.js build.
   * Replace `gif.js` with an alternative export library—update `exportManager.js` accordingly.

---

This specification should enable anyone (or an AI) to understand, run, and extend the refactored Polytope Viewer without digging through intertwined legacy files.
