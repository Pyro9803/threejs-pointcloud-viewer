import './style/base.css';
import './style/ui.css';
import './style/overlay.css';

import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { createCamera, setupResize } from './core/camera.js';
import { loadTileset, isTilesetAvailable } from './tiles/tilesLoader.js';
import { setupOrbit } from './controls/orbitControls.js';
import { setupSpline } from './controls/splineControls.js';
import { createUI } from './ui/ui.js';
import { startLoop } from './core/animate.js';
import { fitCameraToTileset } from './utils/cameraFit.js';
import { TILESET_URL, MESH_TILESET_URL } from './utils/constants.js';
import { state } from './state.js';
import { setupPathEditor } from './utils/pathEditor.js';

const { renderer, container } = createRenderer();
const scene = createScene();
const camera = createCamera(container);

const { controls: orbitControls, updateRoll } = setupOrbit(camera, renderer);
const splineControls = setupSpline(camera, renderer);

/** @type {{ pointCloudTiles: import('3d-tiles-renderer').TilesRenderer | null, meshTiles: import('3d-tiles-renderer').TilesRenderer | null }} */
const tilesRenderers = {
  pointCloudTiles: null,
  meshTiles: null,
};

const ui = createUI({
  scene,
  camera,
  renderer,
  orbitControls,
  splineControls,
  tilesRenderers,
});

let cameraFitted = false;

/**
 * Handles tileset load and fits camera (once).
 * Also initializes the spline path with the tileset transform.
 * @param {import('3d-tiles-renderer').TilesRenderer} tr
 */
function onTileSetLoad(tr) {
  if (cameraFitted) return;
  cameraFitted = true;

  const info = fitCameraToTileset(tr, camera, orbitControls);
  if (info) ui.setTilesetInfo(info.center, info.radius, info.isECEF);

  // Initialize spline path with tileset transform
  const pathInitialized = splineControls.initPath(tr.group);
  if (pathInitialized) {
    // Dispatch event to update UI
    document.dispatchEvent(new CustomEvent('spline-ready'));
  }
}

// Load point cloud tileset (always)
tilesRenderers.pointCloudTiles = loadTileset(TILESET_URL, scene, camera, renderer, {
  onTileSetLoad,
  onError: ui.showError,
});

// Check for mesh tileset and load if available
(async () => {
  const meshAvailable = await isTilesetAvailable(MESH_TILESET_URL);

  if (meshAvailable) {
    state.meshTilesetAvailable = true;

    tilesRenderers.meshTiles = loadTileset(MESH_TILESET_URL, scene, camera, renderer, {
      onTileSetLoad,
      skipAvailabilityCheck: true,
    });

    // Mesh starts hidden (point cloud is default)
    tilesRenderers.meshTiles.group.visible = false;

    ui.updateMeshControlsVisibility();
  }
})();

/**
 * Returns current array of tilesRenderers (called each frame for dynamic updates).
 * @returns {(import('3d-tiles-renderer').TilesRenderer | null)[]}
 */
function getTilesRenderersArray() {
  return [tilesRenderers.pointCloudTiles, tilesRenderers.meshTiles];
}

setupResize(container, camera, renderer, getTilesRenderersArray);

// Setup path editor (activated with Shift+P in orbit mode)
setupPathEditor({ scene, camera, renderer, getTilesRenderers: getTilesRenderersArray });

startLoop({
  renderer,
  scene,
  camera,
  getTilesRenderers: getTilesRenderersArray,
  orbitControls,
  updateRoll,
  splineUpdate: splineControls.update,
  updateFPS: ui.updateFPS,
  updateLoadingProgress: () => ui.updateLoadingProgress(getTilesRenderersArray()),
  updateSplineProgress: ui.updateSplineProgress,
});
