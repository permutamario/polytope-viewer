// File: src/ui/parametricControls.js

import { createDropdown, createVectorInput } from './baseControls.js';

/**
 * Build and mount the right-hand parameter control panel,
 * using the parameterSchema of the current polytope.
 */
export function setupParameterControls(state) {
  const oldTab = document.getElementById('parameter-controls');
  if (oldTab) oldTab.remove();

  const schema = state.currentPolytope.parameterSchema || {};
  const params = { ...state.currentPolytope.parameters };
  const keys = Object.keys(schema);
  if (keys.length === 0) return;

  const container = document.createElement('div');
  container.id = 'parameter-controls';

  keys.forEach(key => {
    const config = schema[key];
    const value = params[key];

    // --- VECTOR INPUT ---
    if (config.type === 'vector') {
      const vectorControl = createVectorInput({
        id: `param-${key}`,
        label: config.name,
        value: value,
        onChange: nums => {
          params[key] = nums;
        }
      });
      container.appendChild(vectorControl);
    }

    // --- DROPDOWN INPUT ---
    else if (config.type === 'dropdown') {
      const dropdownControl = createDropdown({
        id: `param-${key}`,
        label: config.name,
        options: config.options,
        value: value,
        onChange: v => {
          params[key] = v;
        }
      });
      container.appendChild(dropdownControl);
    }

    // Future: add checkbox, slider, etc.
  });

  // --- COMPUTE BUTTON ---
  const computeBtn = document.createElement('button');
  computeBtn.textContent = 'Compute';
  computeBtn.className = 'control-button';
  computeBtn.style.marginTop = '12px';
  computeBtn.addEventListener('click', () => {
    state.setPolytope(state.currentPolytope.name, params);
  });

  container.appendChild(computeBtn);
  document.body.appendChild(container);
}
