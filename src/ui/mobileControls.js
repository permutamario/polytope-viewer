// src/ui/mobileControls.js
import {
    createSlider,
    createCheckbox,
    createColorPicker,
    createDropdown,
    createButton,
    createVectorInput
} from './baseControls.js';
import { exportPNG, exportGIF, exportToSageMath, exportToPolymake } from '../render/exportManager.js';
import { renderModes, availableRenderModes } from '../render/render_modes.js';

export function setupMobileControls(state) {
    // Mark body as mobile
    document.body.classList.add('mobile-device');

    // Create header
    const header = document.createElement('div');
    header.className = 'mobile-header';

    // === Polytope Dropdown ===
    const dropdown = createDropdown({
        id: 'polytope-select-mobile',
        label: 'Polytope',
        options: state.polyNames,
        value: state.currentPolytope.name,
        onChange: v => state.setPolytope(v)
    });
    header.appendChild(dropdown);

    // === Parametric Controls ===
// === Parametric Controls (auto-recompute on change) ===
const schema = state.currentPolytope.parameterSchema || {};
const paramState = { ...state.currentPolytope.parameters };
const paramKeys = Object.keys(schema);

if (paramKeys.length > 0) {
    const recompute = () => {
        state.setPolytope(state.currentPolytope.name, { ...paramState });
    };

    paramKeys.forEach(key => {
        const config = schema[key];
        const value = paramState[key];

        if (config.type === 'vector') {
            const vectorInput = createVectorInput({
                id: `param-${key}-mobile`,
                label: config.name,
                value: value,
                onChange: nums => {
                    paramState[key] = nums;
                    recompute();
                }
            });
            header.appendChild(vectorInput);
        } else if (config.type === 'dropdown') {
            const drop = createDropdown({
                id: `param-${key}-mobile`,
                label: config.name,
                options: config.options,
                value: value,
                onChange: v => {
                    paramState[key] = v;
                    recompute();
                }
            });
            header.appendChild(drop);
        }
    });
}


    document.body.appendChild(header);

    // === Options Button ===
    const optionsBtn = createButton({
        id: 'mobile-options-button',
        label: 'Options',
        onClick: () => menu.classList.toggle('hidden')
    });
    document.body.appendChild(optionsBtn);

    // === Sliding Options Menu ===
    const menu = document.createElement('div');
    menu.className = 'mobile-options-menu hidden';

    const rotateToggleContainer = document.createElement('div');
    rotateToggleContainer.className = 'control checkbox-control';
    const rotateLabel = document.createElement('label');
    rotateLabel.htmlFor = 'animation-toggle-mobile';
    rotateLabel.textContent = 'Autorotate';
    const rotateInput = document.createElement('input');
    rotateInput.type = 'checkbox';
    rotateInput.id = 'animation-toggle-mobile';
    rotateInput.checked = state.settings.animation;
    rotateInput.addEventListener('change', e => state.setSetting('animation', e.target.checked));
    rotateToggleContainer.appendChild(rotateLabel);
    rotateToggleContainer.appendChild(rotateInput);
    menu.appendChild(rotateToggleContainer);

    const opacitySlider = createSlider({
        id: 'face-opacity-mobile',
        label: 'Face Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        value: state.settings.faceOpacity,
        onChange: v => state.setSetting('faceOpacity', v)
    });
    menu.appendChild(opacitySlider);

    const colorPicker = createColorPicker({
        id: 'face-color-mobile',
        label: 'Face Color',
        value: state.settings.faceColor,
        onChange: v => {
            state.colorSchemes['Single Color'] = v;
            state.setSetting('faceColor', v);
        }
    });
    colorPicker.id = 'face-color-mobile-control';

    const colorNames = Object.keys(state.colorSchemes);
    const schemeDropdown = createDropdown({
        id: 'color-scheme-mobile',
        label: 'Color Scheme',
        options: colorNames,
        value: state.settings.colorSchemeName,
        onChange: v => {
            state.setSetting('colorSchemeName', v);
            state.setSetting('colorScheme', state.colorSchemes[v]);
        }
    });
    menu.appendChild(schemeDropdown);

    const renderModeNames = availableRenderModes;
    const renderModeDropdown = createDropdown({
        id: 'rendering-mode',
        label: 'Rendering Mode',
        options: renderModeNames,
        value: state.settings.renderModeName,
        onChange: v => {
            state.setSetting('renderMode', renderModes[v]);
            state.setSetting('renderModeName', v);
        }
    });
    menu.appendChild(renderModeDropdown);

    const edgesToggleContainer = document.createElement('div');
    edgesToggleContainer.className = 'control checkbox-control';
    const edgesLabel = document.createElement('label');
    edgesLabel.htmlFor = 'edge-toggle-mobile';
    edgesLabel.textContent = 'Show Edges';
    const edgesInput = document.createElement('input');
    edgesInput.type = 'checkbox';
    edgesInput.id = 'edge-toggle-mobile';
    edgesInput.checked = state.settings.showEdges;
    edgesInput.addEventListener('change', e => state.setSetting('showEdges', e.target.checked));
    edgesToggleContainer.appendChild(edgesLabel);
    edgesToggleContainer.appendChild(edgesInput);
    menu.appendChild(edgesToggleContainer);

    const exportButtonsContainer = document.createElement('div');
    exportButtonsContainer.className = 'export-buttons';

    const pngBtn = createButton({
        id: 'export-png-mobile',
        label: 'Export PNG',
        onClick: () => exportPNG(state.renderer, state.scene, state.camera)
    });
    exportButtonsContainer.appendChild(pngBtn);

    const gifBtn = createButton({
        id: 'export-gif-mobile',
        label: 'Export GIF',
        onClick: () => showNotification("Mario has not enabled me yet 😢")
    });
    exportButtonsContainer.appendChild(gifBtn);

    const sageBtn = createButton({
        id: 'export-sage-mobile',
        label: 'Sage',
        onClick: () => exportToSageMath(state.settings.currentPolytope)
    });
    exportButtonsContainer.appendChild(sageBtn);

    menu.appendChild(exportButtonsContainer);
    document.body.appendChild(menu);

    document.addEventListener('click', (event) => {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickOnButton = optionsBtn.contains(event.target);
        if (!isClickInsideMenu && !isClickOnButton && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    });

    state.on('polytopeChanged', () => {
        const oldHeader = document.querySelector('.mobile-header');
        if (oldHeader) oldHeader.remove();
        setupMobileControls(state); // Recreate mobile controls from scratch
    });
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: '1000',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        maxWidth: '80%'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, duration);
}

