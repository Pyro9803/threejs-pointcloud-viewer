import * as THREE from 'three';

/**
 * Creates the WebGLRenderer and its container element inside `#app`.
 *
 * @returns {{ renderer: THREE.WebGLRenderer, container: HTMLElement }}
 */
export function createRenderer() {
  const app = document.getElementById('app');

  const container = document.createElement('div');
  container.id = 'canvas-container';
  app.appendChild(container);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  return { renderer, container };
}
