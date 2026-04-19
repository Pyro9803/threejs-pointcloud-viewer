import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { applyPointCloudMaterial } from './pointCloudMaterial.js';
import { applyMeshMaterial } from './meshMaterial.js';

/**
 * Creates a TilesRenderer, wires up load-model and load-tile-set events,
 * and runs a pre-flight availability check.
 *
 * @param {string} url - The tileset URL to load
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {{
 *   onTileSetLoad?: (tilesRenderer: TilesRenderer) => void,
 *   onError?: (html: string) => void,
 *   skipAvailabilityCheck?: boolean,
 * }} callbacks
 * @returns {TilesRenderer}
 */
export function loadTileset(url, scene, camera, renderer, { onTileSetLoad, onError, skipAvailabilityCheck } = {}) {
  const tilesRenderer = new TilesRenderer(url);
  tilesRenderer.setCamera(camera);
  tilesRenderer.setResolutionFromRenderer(camera, renderer);
  scene.add(tilesRenderer.group);

  tilesRenderer.addEventListener('load-model', ({ scene: tileScene }) => {
    applyMaterialsToTile(tileScene);
  });

  tilesRenderer.addEventListener('load-tile-set', () => {
    onTileSetLoad?.(tilesRenderer);
  });

  if (!skipAvailabilityCheck) {
    checkTilesetAvailable(url, onError);
  }

  return tilesRenderer;
}

/**
 * Auto-detects content type and applies appropriate material.
 * Handles tiles containing Points, Mesh, or both.
 *
 * @param {THREE.Object3D} tileScene
 */
function applyMaterialsToTile(tileScene) {
  let hasPoints = false;
  let hasMesh = false;

  tileScene.traverse((obj) => {
    if (obj instanceof THREE.Points) hasPoints = true;
    if (obj instanceof THREE.Mesh) hasMesh = true;
  });

  if (hasPoints) {
    applyPointCloudMaterial(tileScene);
  }
  if (hasMesh) {
    applyMeshMaterial(tileScene);
  }
}

/**
 * Pre-flight HEAD request so we can surface a friendly error on 404 or
 * network failure. 3d-tiles-renderer v0.3.x does not emit a load-error event.
 *
 * @param {string} url - The tileset URL to check
 * @param {((html: string) => void) | undefined} onError
 */
async function checkTilesetAvailable(url, onError) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
      onError?.(
        `Server returned <strong>${res.status} ${res.statusText}</strong> for
        <code>${url}</code>.<br /><br />
        Make sure your tileset files are in <code>public/tileset/</code> and
        the Vite dev server is running (<code>npm run dev</code>).`,
      );
    }
  } catch (err) {
    console.error('[preflight] fetch failed', err);
    onError?.(
      `Could not reach <code>${url}</code>.<br /><br />
      Make sure the Vite dev server is running (<code>npm run dev</code>)
      and your tileset files are in <code>public/tileset/</code>.<br /><br />
      <strong>Note:</strong> Opening via <code>file://</code> will not work
      due to CORS restrictions — always use the dev server.`,
    );
  }
}

/**
 * Checks if a tileset is available via HEAD request.
 *
 * @param {string} url - The tileset URL to check
 * @returns {Promise<boolean>}
 */
export async function isTilesetAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}
