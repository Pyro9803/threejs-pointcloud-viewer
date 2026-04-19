import * as THREE from 'three';
import { state } from '../state.js';

/**
 * Starts the render loop. Calls the appropriate controls update each frame
 * based on the current mode, then updates tiles and renders.
 *
 * @param {{
 *   renderer: THREE.WebGLRenderer,
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   getTilesRenderers: () => (import('3d-tiles-renderer').TilesRenderer | null)[],
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   updateRoll: (delta: number) => void,
 *   splineUpdate: (delta: number) => void,
 *   updateFPS: () => void,
 *   updateLoadingProgress: () => void,
 *   updateSplineProgress: () => void,
 * }} deps
 */
export function startLoop({
  renderer,
  scene,
  camera,
  getTilesRenderers,
  orbitControls,
  updateRoll,
  splineUpdate,
  updateFPS,
  updateLoadingProgress,
  updateSplineProgress,
}) {
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (state.mode === 'orbit') {
      updateRoll(delta); // handles roll input + orbitControls.update() + roll post-process
    } else if (state.mode === 'spline') {
      splineUpdate(delta);
      updateSplineProgress();
    }

    for (const tilesRenderer of getTilesRenderers()) {
      if (tilesRenderer) {
        tilesRenderer.update();
      }
    }

    renderer.render(scene, camera);

    updateFPS();
    updateLoadingProgress();
  }

  animate();
}
