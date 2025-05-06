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
├── vendor/                ← Third‑party libs (Three.js, Camera-Control, GIF.js, QuickHull3D)
└── polytopes/             ← Geometry builders and logic
    ├── build_functions/   ← JS scripts that create Polytope objects
    │   └── build_tetrahedron.js
    ├── manifest.json      ← Lists available polytopes
    └── Polytope.js        ← Main Polytope class definition
```

---

## 2. Entry Point: `index.html` & `src/index.js`

* **index.html**: Minimal HTML shell. Loads CSS via `<link>` and bootstraps the app with:

  ```html
  <script type="module" src="src/index.js"></script>
  ```

* **src/index.js**:

  1. Detects platform (`core/utils.detectPlatform`).
  2. Loads polytope manifest (`core/loader.loadData`).
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

  * `loadData()`: Fetches `/polytopes/manifest.json` and dynamically imports builder modules.
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
  * Export buttons (PNG & GIF & Sagemath code).
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

  * Converts Polytope instances (via `Polytope.toJSON()`) into `BufferGeometry`.
  * Triangulates n‑gons, computes normals.
  * Creates `MeshLambertMaterial` or `MeshStandardMaterial` based on platform.
  * Optionally adds `EdgesGeometry` for wireframes.

* **exportManager.js**:

  * `exportPNG()`: Captures current frame as PNG download.
  * `exportGIF()`: Records frames into GIF via `gif.js`, shows progress overlay.
  * Applies mobile‑specific frame limits and quality settings.

---

## 6. Polytope Code (`polytopes/`)

* **Polytope.js**: Defines the `Polytope` class.
  * Constructor takes `vertices` as input.
  * Uses QuickHull3D to compute `faces` and `edges`.
  * Computes `center` as centroid of all vertices.
  * Public members: `vertices`, `faces`, `edges`, `center`.
  * Method `toJSON()` exports object for rendering or saving.

* **build_functions/**: Each file exports a builder that returns a new `Polytope` object. Example:

  ```js
  import { Polytope } from '../Polytope.js';
  export function build_tetrahedron() {
    const vertices = [ ... ];
    return new Polytope(vertices);
  }
  ```

* **manifest.json**: Lists available polytopes and their builder file names:
  ```json
  [
    { "name": "Tetrahedron", "builder": "build_tetrahedron.js" }
  ]
  ```

---

## 7. Extending the Viewer

1. **Add a new polytope**:
   * Create a builder in `polytopes/build_functions/` that returns a `Polytope`.
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

This updated specification reflects the modular, builder-based design of the Polytope Viewer and retains all previous architecture details unrelated to polytope storage.

