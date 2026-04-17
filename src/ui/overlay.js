import { state } from '../state.js';

/**
 * Creates all overlay elements: crosshair, pointer-lock hint, controls
 * hint, loading indicator, and error overlay. Returns references and
 * helper functions for the animation loop and error handling.
 *
 * @returns {{
 *   crosshair: HTMLElement,
 *   lockHint: HTMLElement,
 *   controlsHint: HTMLElement,
 *   showError: (html: string) => void,
 *   updateLoadingProgress: (tilesRenderer: import('3d-tiles-renderer').TilesRenderer) => void,
 * }}
 */
export function createOverlay() {
  // Crosshair
  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  document.body.appendChild(crosshair);

  // Pointer lock hint
  const lockHint = document.createElement('div');
  lockHint.id = 'lock-hint';
  lockHint.textContent = 'Click to capture mouse';
  document.body.appendChild(lockHint);

  // Controls hint (FPS mode)
  const controlsHint = document.createElement('div');
  controlsHint.id = 'controls-hint';
  controlsHint.innerHTML =
    '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> \u2014 Di chuy\u1EC3n<br />' +
    '<kbd>Mouse</kbd> \u2014 Nh\u00ECn xung quanh<br />' +
    '<kbd>Space</kbd> / <kbd>Shift</kbd> \u2014 L\u00EAn / Xu\u1ED1ng<br />' +
    '<kbd>Esc</kbd> \u2014 Tho\u00E1t';
  document.body.appendChild(controlsHint);

  // Loading indicator
  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.textContent = 'Loading tiles: 0 / 0';
  document.body.appendChild(loading);

  // Error overlay
  const errorOverlay = document.createElement('div');
  errorOverlay.id = 'error-overlay';
  errorOverlay.innerHTML = `
    <div id="error-box">
      <h2>Failed to load tileset</h2>
      <p id="error-message"></p>
    </div>
  `;
  document.body.appendChild(errorOverlay);

  const errorMessage = errorOverlay.querySelector('#error-message');

  function showError(html) {
    if (html) errorMessage.innerHTML = html;
    errorOverlay.classList.add('visible');
  }

  function updateLoadingProgress(tilesRenderer) {
    const stats = tilesRenderer.stats;
    const loaded = stats.loadedTiles ?? 0;
    const total = (stats.loadedTiles ?? 0) + (stats.loadingTiles ?? 0);

    if (!state.tilesetLoaded || (stats.loadingTiles ?? 0) > 0) {
      if (total === 0) {
        loading.textContent = 'Waiting for tiles\u2026';
      } else {
        loading.textContent = `Loading tiles: ${loaded} / ${total}`;
      }
      loading.classList.remove('hidden');
    } else {
      loading.classList.add('hidden');
    }
  }

  return { crosshair, lockHint, controlsHint, showError, updateLoadingProgress };
}
