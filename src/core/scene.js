import * as THREE from 'three';

/**
 * Creates the Three.js scene with a dark background.
 *
 * @returns {THREE.Scene}
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  return scene;
}
