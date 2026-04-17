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
 *   tilesRenderer: import('3d-tiles-renderer').TilesRenderer,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   updateMovement: (delta: number) => void,
 *   updateFPS: () => void,
 *   updateLoadingProgress: () => void,
 * }} deps
 */
export function startLoop({
  renderer,
  scene,
  camera,
  tilesRenderer,
  orbitControls,
  updateMovement,
  updateFPS,
  updateLoadingProgress,
}) {
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (state.mode === 'orbit') {
      orbitControls.update();
    } else {
      updateMovement(delta);
    }

    tilesRenderer.update();
    renderer.render(scene, camera);

    updateFPS();
    updateLoadingProgress();
  }

  animate();
}
