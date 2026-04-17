import { TilesRenderer } from '3d-tiles-renderer';
import { TILESET_URL } from '../utils/constants.js';
import { applyPointCloudMaterial } from './pointCloudMaterial.js';

/**
 * Creates a TilesRenderer, wires up load-model and load-tile-set events,
 * and runs a pre-flight availability check.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {{
 *   onTileSetLoad?: (tilesRenderer: TilesRenderer) => void,
 *   onError?: (html: string) => void,
 * }} callbacks
 * @returns {TilesRenderer}
 */
export function loadTileset(scene, camera, renderer, { onTileSetLoad, onError } = {}) {
  const tilesRenderer = new TilesRenderer(TILESET_URL);
  tilesRenderer.setCamera(camera);
  tilesRenderer.setResolutionFromRenderer(camera, renderer);
  scene.add(tilesRenderer.group);

  tilesRenderer.addEventListener('load-model', ({ scene: tileScene }) => {
    applyPointCloudMaterial(tileScene);
  });

  tilesRenderer.addEventListener('load-tile-set', () => {
    onTileSetLoad?.(tilesRenderer);
  });

  checkTilesetAvailable(onError);

  return tilesRenderer;
}

/**
 * Pre-flight HEAD request so we can surface a friendly error on 404 or
 * network failure. 3d-tiles-renderer v0.3.x does not emit a load-error event.
 *
 * @param {((html: string) => void) | undefined} onError
 */
async function checkTilesetAvailable(onError) {
  try {
    const res = await fetch(TILESET_URL, { method: 'HEAD' });
    if (!res.ok) {
      onError?.(
        `Server returned <strong>${res.status} ${res.statusText}</strong> for
        <code>${TILESET_URL}</code>.<br /><br />
        Make sure your tileset files are in <code>public/tileset/</code> and
        the Vite dev server is running (<code>npm run dev</code>).`,
      );
    }
  } catch (err) {
    console.error('[preflight] fetch failed', err);
    onError?.(
      `Could not reach <code>${TILESET_URL}</code>.<br /><br />
      Make sure the Vite dev server is running (<code>npm run dev</code>)
      and your tileset files are in <code>public/tileset/</code>.<br /><br />
      <strong>Note:</strong> Opening via <code>file://</code> will not work
      due to CORS restrictions \u2014 always use the dev server.`,
    );
  }
}
