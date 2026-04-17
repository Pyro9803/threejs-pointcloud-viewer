import './style/base.css';
import './style/ui.css';
import './style/overlay.css';

import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { createCamera, setupResize } from './core/camera.js';
import { loadTileset } from './tiles/tilesLoader.js';
import { setupOrbit } from './controls/orbitControls.js';
import { setupFPS } from './controls/fpsControls.js';
import { createUI } from './ui/ui.js';
import { startLoop } from './core/animate.js';
import { fitCameraToTileset } from './utils/cameraFit.js';

const { renderer, container } = createRenderer();
const scene = createScene();
const camera = createCamera(container);

const orbitControls = setupOrbit(camera, renderer);
const { controls: fpsControls, updateMovement } = setupFPS(camera, renderer);

const ui = createUI({ scene, camera, renderer, orbitControls, fpsControls });

const tilesRenderer = loadTileset(scene, camera, renderer, {
  onTileSetLoad(tr) {
    const info = fitCameraToTileset(tr, camera, orbitControls);
    if (info) ui.setTilesetInfo(info.center, info.radius, info.isECEF);
  },
  onError: ui.showError,
});

setupResize(container, camera, renderer, tilesRenderer);

startLoop({
  renderer,
  scene,
  camera,
  tilesRenderer,
  orbitControls,
  updateMovement,
  updateFPS: ui.updateFPS,
  updateLoadingProgress: () => ui.updateLoadingProgress(tilesRenderer),
});
