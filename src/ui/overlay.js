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
 *   updateLoadingProgress: (tilesRenderers: (import('3d-tiles-renderer').TilesRenderer | null)[]) => void,
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

  // Controls hint (Spline explorer mode)
  const controlsHint = document.createElement('div');
  controlsHint.id = 'controls-hint';
  controlsHint.innerHTML =
    '<kbd>W</kbd> / <kbd>↑</kbd> — Move forward<br />' +
    '<kbd>S</kbd> / <kbd>↓</kbd> — Move backward<br />' +
    '<kbd>Mouse</kbd> — Look around<br />' +
    '<kbd>Esc</kbd> — Exit';
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

  /**
   * Updates loading progress from an array of tilesRenderers.
   * Aggregates stats across all renderers.
   *
   * @param {(import('3d-tiles-renderer').TilesRenderer | null)[]} tilesRenderers
   */
  function updateLoadingProgress(tilesRenderers) {
    let totalLoaded = 0;
    let totalLoading = 0;

    for (const tilesRenderer of tilesRenderers) {
      if (tilesRenderer) {
        const stats = tilesRenderer.stats;
        totalLoaded += stats.loadedTiles ?? 0;
        totalLoading += stats.loadingTiles ?? 0;
      }
    }

    const total = totalLoaded + totalLoading;

    if (!state.tilesetLoaded || totalLoading > 0) {
      if (total === 0) {
        loading.textContent = 'Waiting for tiles…';
      } else {
        loading.textContent = `Loading tiles: ${totalLoaded} / ${total}`;
      }
      loading.classList.remove('hidden');
    } else {
      loading.classList.add('hidden');
    }
  }

  return { crosshair, lockHint, controlsHint, showError, updateLoadingProgress };
}
