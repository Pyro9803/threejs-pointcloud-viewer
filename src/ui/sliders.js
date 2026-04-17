import { state } from '../state.js';
import { applyPointSizeToScene } from '../tiles/pointCloudMaterial.js';

/**
 * Creates the controls panel with point-size slider, move-speed slider,
 * and background toggle button.
 *
 * @param {THREE.Scene} scene
 * @returns {{ el: HTMLElement }}
 */
export function createSliders(scene) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.id = 'controls-panel';
  el.innerHTML = `
    <h3>Point Cloud Controls</h3>
    <div class="control-row">
      <label for="point-size">Point size</label>
      <input type="range" id="point-size" min="0.01" max="0.5" step="0.01" value="${state.pointSize}" />
      <span id="point-size-value">${state.pointSize.toFixed(2)}</span>
    </div>
    <div class="control-row">
      <label for="move-speed">Move speed</label>
      <input type="range" id="move-speed" min="0.5" max="50" step="0.5" value="${state.moveSpeed}" />
      <span id="move-speed-value">${state.moveSpeed.toFixed(1)}</span>
    </div>
    <button id="bg-toggle">Toggle background</button>
  `;

  const pointSizeSlider = el.querySelector('#point-size');
  const pointSizeValue = el.querySelector('#point-size-value');
  const moveSpeedSlider = el.querySelector('#move-speed');
  const moveSpeedValue = el.querySelector('#move-speed-value');
  const bgToggle = el.querySelector('#bg-toggle');

  pointSizeSlider.addEventListener('input', () => {
    state.pointSize = parseFloat(pointSizeSlider.value);
    pointSizeValue.textContent = state.pointSize.toFixed(2);
    applyPointSizeToScene(scene, state.pointSize);
  });

  moveSpeedSlider.addEventListener('input', () => {
    state.moveSpeed = parseFloat(moveSpeedSlider.value);
    moveSpeedValue.textContent = state.moveSpeed.toFixed(1);
  });

  bgToggle.addEventListener('click', () => {
    state.darkBackground = !state.darkBackground;
    scene.background.set(state.darkBackground ? 0x1a1a2e : 0xf0f0f8);
    document.body.style.background = state.darkBackground ? '#1a1a2e' : '#f0f0f8';
  });

  return { el };
}
