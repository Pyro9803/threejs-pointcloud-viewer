import * as THREE from 'three';

/**
 * Creates a perspective camera sized to the given container.
 *
 * @param {HTMLElement} container
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera(container) {
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1e8,
  );
  camera.position.set(0, 0, 100);
  return camera;
}

/**
 * Registers a window resize handler that keeps the camera aspect ratio,
 * renderer size, and tile resolution in sync.
 *
 * @param {HTMLElement} container
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @param {() => (import('3d-tiles-renderer').TilesRenderer | null)[]} getTilesRenderers
 */
export function setupResize(container, camera, renderer, getTilesRenderers) {
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    for (const tilesRenderer of getTilesRenderers()) {
      if (tilesRenderer) {
        tilesRenderer.setResolutionFromRenderer(camera, renderer);
      }
    }
  });
}
