// src/ui/baseControls.js
/**
 * Base control factory functions: sliders, checkboxes, dropdowns, color pickers, buttons.
 */

function createControlContainer() {
  const container = document.createElement('div');
  container.className = 'control';
  return container;
}

function createLabel(id, text) {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = text;
  return label;
}

export function createSlider({ id, label, min, max, step, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener('input', e => onChange(parseFloat(e.target.value)));
  container.appendChild(lbl);
  container.appendChild(input);
  return container;
}

export function createCheckbox({ id, label, checked = false, onChange }) {
  const container = document.createElement('div');
  container.className = 'checkbox-container';
  
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  
  input.addEventListener('change', e => {
    if (onChange) onChange(e.target.checked);
  });
  
  container.appendChild(labelEl);
  container.appendChild(input);
  
  return container;
}

export function createColorPicker({ id, label, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const input = document.createElement('input');
  input.type = 'color';
  input.id = id;
  input.value = value;
  input.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(lbl);
  container.appendChild(input);
  return container;
}

export function createDropdown({ id, label, options, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const select = document.createElement('select');
  select.id = id;
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    if (opt === value) el.selected = true;
    select.appendChild(el);
  });
  select.addEventListener('change', e => onChange(e.target.value));
  container.appendChild(lbl);
  container.appendChild(select);
  return container;
}

export function createButton({ id, label, onClick }) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

export function createVectorInput({ id, label, value, onChange }) {
  const container = document.createElement('div');
  container.className = 'control';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  container.appendChild(labelEl);

  // Row wrapper for input + button
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.alignItems = 'center';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = Array.isArray(value) ? value.join(', ') : '';
  input.style.flex = '1 1 auto';
  input.style.minWidth = '60px';

  const button = document.createElement('button');
  button.textContent = 'Compute';
  button.style.whiteSpace = 'nowrap';

  button.addEventListener('click', () => {
    const tokens = input.value.split(',').map(s => s.trim());
    const nums = tokens.map(Number);
    const isValid = nums.length === tokens.length && nums.every(n => !isNaN(n));
    if (isValid) {
      onChange(nums);
    } else {
      input.classList.add('invalid');
      setTimeout(() => input.classList.remove('invalid'), 1500);
    }
  });

  row.appendChild(input);
  row.appendChild(button);
  container.appendChild(row);
  return container;
}
