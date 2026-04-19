import { createSliders } from './sliders.js';
import { createInfoPanel } from './infoPanel.js';
import { createFPSCounter } from './fpsCounter.js';
import { createOverlay } from './overlay.js';
import { createModeToggle } from './modeToggle.js';

/**
 * Orchestrates creation of all UI modules. Builds the panel container,
 * attaches every overlay element, and returns callbacks needed by the
 * animation loop and tileset loader.
 *
 * @param {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   splineControls: ReturnType<typeof import('../controls/splineControls.js').setupSpline>,
 *   tilesRenderers: {
 *     pointCloudTiles: import('3d-tiles-renderer').TilesRenderer | null,
 *     meshTiles: import('3d-tiles-renderer').TilesRenderer | null,
 *   },
 * }} deps
 * @returns {{
 *   updateFPS: () => void,
 *   updateLoadingProgress: (tilesRenderers: (import('3d-tiles-renderer').TilesRenderer | null)[]) => void,
 *   setTilesetInfo: (center: THREE.Vector3, radius: number, isECEF: boolean) => void,
 *   showError: (html: string) => void,
 *   updateMeshControlsVisibility: () => void,
 *   updateSplineProgress: () => void,
 * }}
 */
export function createUI({ scene, camera, renderer, orbitControls, splineControls, tilesRenderers }) {
  // Left-side panel container
  const uiContainer = document.createElement('div');
  uiContainer.id = 'ui';
  document.body.appendChild(uiContainer);

  const { el: slidersEl, updateMeshControlsVisibility, updateSplineProgress } = createSliders(
    scene,
    tilesRenderers,
    splineControls
  );
  uiContainer.appendChild(slidersEl);

  const { el: infoPanelEl, setTilesetInfo } = createInfoPanel();
  uiContainer.appendChild(infoPanelEl);

  const { update: updateFPS } = createFPSCounter();
  const overlay = createOverlay();

  createModeToggle({ camera, renderer, splineControls, orbitControls, overlay });

  return {
    updateFPS,
    updateLoadingProgress: overlay.updateLoadingProgress,
    setTilesetInfo,
    showError: overlay.showError,
    updateMeshControlsVisibility,
    updateSplineProgress,
  };
}
