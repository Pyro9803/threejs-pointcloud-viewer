import { state } from '../state.js';
import { applyPointSizeToScene } from '../tiles/pointCloudMaterial.js';
import { setWireframe, setMeshOpacity } from '../tiles/meshMaterial.js';

/**
 * Creates the controls panel with point-size slider, move-speed slider,
 * background toggle button, mesh controls, and explorer controls.
 *
 * @param {THREE.Scene} scene
 * @param {{
 *   pointCloudTiles: import('3d-tiles-renderer').TilesRenderer | null,
 *   meshTiles: import('3d-tiles-renderer').TilesRenderer | null,
 * }} tilesRenderers
 * @param {{ getProgress: () => number, setProgress: (t: number) => void } | null} splineControls
 * @returns {{ el: HTMLElement, updateMeshControlsVisibility: () => void, updateSplineProgress: () => void }}
 */
export function createSliders(scene, tilesRenderers, splineControls) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.id = 'controls-panel';
  el.innerHTML = `
    <h3>Point Cloud Controls</h3>
    <div class="control-row" id="point-size-row">
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

    <div id="mesh-controls-section" class="mesh-section hidden">
      <div class="section-divider"></div>
      <h3>Mesh Controls</h3>
      <div class="control-row">
        <label>Render mode</label>
        <div class="button-group" id="render-mode-group">
          <button class="mode-btn active" data-mode="pointcloud">Point Cloud</button>
          <button class="mode-btn" data-mode="mesh">Mesh</button>
          <button class="mode-btn" data-mode="both">Both</button>
        </div>
      </div>
      <div class="control-row" id="wireframe-row">
        <label for="wireframe-toggle">Wireframe</label>
        <input type="checkbox" id="wireframe-toggle" />
      </div>
      <div class="control-row" id="mesh-opacity-row">
        <label for="mesh-opacity">Mesh opacity</label>
        <input type="range" id="mesh-opacity" min="0" max="1" step="0.05" value="${state.meshOpacity}" />
        <span id="mesh-opacity-value">${state.meshOpacity.toFixed(2)}</span>
      </div>
    </div>

    <div id="explorer-section" class="explorer-section hidden">
      <div class="section-divider"></div>
      <h3>Explorer</h3>
      <div class="control-row">
        <label for="spline-progress">Position</label>
        <input type="range" id="spline-progress" min="0" max="1" step="0.005" value="0" />
        <span id="spline-progress-value">0%</span>
      </div>
      <div class="control-row">
        <label for="explorer-speed">Walk speed</label>
        <input type="range" id="explorer-speed" min="0.5" max="20" step="0.5" value="${state.moveSpeed}" />
        <span id="explorer-speed-value">${state.moveSpeed.toFixed(1)}</span>
      </div>
    </div>
  `;

  const pointSizeSlider = el.querySelector('#point-size');
  const pointSizeValue = el.querySelector('#point-size-value');
  const pointSizeRow = el.querySelector('#point-size-row');
  const moveSpeedSlider = el.querySelector('#move-speed');
  const moveSpeedValue = el.querySelector('#move-speed-value');
  const bgToggle = el.querySelector('#bg-toggle');

  const meshControlsSection = el.querySelector('#mesh-controls-section');
  const renderModeGroup = el.querySelector('#render-mode-group');
  const wireframeToggle = el.querySelector('#wireframe-toggle');
  const wireframeRow = el.querySelector('#wireframe-row');
  const meshOpacitySlider = el.querySelector('#mesh-opacity');
  const meshOpacityValue = el.querySelector('#mesh-opacity-value');
  const meshOpacityRow = el.querySelector('#mesh-opacity-row');

  const explorerSection = el.querySelector('#explorer-section');
  const splineProgressSlider = el.querySelector('#spline-progress');
  const splineProgressValue = el.querySelector('#spline-progress-value');
  const explorerSpeedSlider = el.querySelector('#explorer-speed');
  const explorerSpeedValue = el.querySelector('#explorer-speed-value');

  /** Track whether user is dragging the progress slider */
  let isDraggingProgress = false;

  // Point size slider
  pointSizeSlider.addEventListener('input', () => {
    state.pointSize = parseFloat(pointSizeSlider.value);
    pointSizeValue.textContent = state.pointSize.toFixed(2);
    applyPointSizeToScene(scene, state.pointSize);
  });

  // Move speed slider
  moveSpeedSlider.addEventListener('input', () => {
    state.moveSpeed = parseFloat(moveSpeedSlider.value);
    moveSpeedValue.textContent = state.moveSpeed.toFixed(1);
    // Sync with explorer speed slider
    explorerSpeedSlider.value = state.moveSpeed;
    explorerSpeedValue.textContent = state.moveSpeed.toFixed(1);
  });

  // Background toggle
  bgToggle.addEventListener('click', () => {
    state.darkBackground = !state.darkBackground;
    scene.background.set(state.darkBackground ? 0x1a1a2e : 0xf0f0f8);
    document.body.style.background = state.darkBackground ? '#1a1a2e' : '#f0f0f8';
  });

  // Render mode buttons
  renderModeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;

    const mode = btn.dataset.mode;
    state.renderMode = mode;

    // Update active button
    renderModeGroup.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Toggle visibility
    updateTilesetVisibility();
    updateControlsState();

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('rendermode-change', { detail: { mode } }));
  });

  // Wireframe toggle
  wireframeToggle.addEventListener('change', () => {
    state.meshWireframe = wireframeToggle.checked;
    setWireframe(scene, state.meshWireframe);
  });

  // Mesh opacity slider
  meshOpacitySlider.addEventListener('input', () => {
    state.meshOpacity = parseFloat(meshOpacitySlider.value);
    meshOpacityValue.textContent = state.meshOpacity.toFixed(2);
    setMeshOpacity(scene, state.meshOpacity);
  });

  // Spline progress slider - user scrubbing
  splineProgressSlider.addEventListener('mousedown', () => {
    isDraggingProgress = true;
  });

  splineProgressSlider.addEventListener('mouseup', () => {
    isDraggingProgress = false;
  });

  splineProgressSlider.addEventListener('input', () => {
    if (!splineControls) return;
    const t = parseFloat(splineProgressSlider.value);
    splineControls.setProgress(t);
    splineProgressValue.textContent = `${Math.round(t * 100)}%`;
  });

  // Explorer speed slider
  explorerSpeedSlider.addEventListener('input', () => {
    state.moveSpeed = parseFloat(explorerSpeedSlider.value);
    explorerSpeedValue.textContent = state.moveSpeed.toFixed(1);
    // Sync with main move speed slider
    moveSpeedSlider.value = state.moveSpeed;
    moveSpeedValue.textContent = state.moveSpeed.toFixed(1);
  });

  /**
   * Updates tileset visibility based on current render mode.
   */
  function updateTilesetVisibility() {
    const { pointCloudTiles, meshTiles } = tilesRenderers;

    if (pointCloudTiles) {
      pointCloudTiles.group.visible = state.renderMode === 'pointcloud' || state.renderMode === 'both';
    }
    if (meshTiles) {
      meshTiles.group.visible = state.renderMode === 'mesh' || state.renderMode === 'both';
    }
  }

  /**
   * Updates control enabled/disabled states based on render mode.
   */
  function updateControlsState() {
    // Point size slider: hide when mesh-only
    if (state.renderMode === 'mesh') {
      pointSizeRow.classList.add('hidden');
    } else {
      pointSizeRow.classList.remove('hidden');
    }

    // Wireframe: only enabled when mesh is visible
    const meshVisible = state.renderMode === 'mesh' || state.renderMode === 'both';
    wireframeToggle.disabled = !meshVisible;
    wireframeRow.classList.toggle('disabled', !meshVisible);

    // Mesh opacity: only enabled in 'both' mode
    const bothMode = state.renderMode === 'both';
    meshOpacitySlider.disabled = !bothMode;
    meshOpacityRow.classList.toggle('disabled', !bothMode);
  }

  /**
   * Shows/hides mesh controls section based on mesh tileset availability.
   */
  function updateMeshControlsVisibility() {
    if (state.meshTilesetAvailable) {
      meshControlsSection.classList.remove('hidden');
    } else {
      meshControlsSection.classList.add('hidden');
    }
    updateControlsState();
  }

  /**
   * Updates explorer section visibility based on mode.
   */
  function updateExplorerVisibility() {
    if (state.mode === 'spline') {
      explorerSection.classList.remove('hidden');
    } else {
      explorerSection.classList.add('hidden');
    }
  }

  /**
   * Updates the spline progress slider from current state (called each frame).
   */
  function updateSplineProgress() {
    if (isDraggingProgress) return; // Don't update while user is dragging
    if (!splineControls) return;

    const t = state.splineProgress;
    splineProgressSlider.value = t;
    splineProgressValue.textContent = `${Math.round(t * 100)}%`;
  }

  // Listen for mode changes to show/hide explorer section
  document.addEventListener('mode-change', () => {
    updateExplorerVisibility();
  });

  // Initial state update
  updateControlsState();
  updateExplorerVisibility();

  return { el, updateMeshControlsVisibility, updateSplineProgress };
}
