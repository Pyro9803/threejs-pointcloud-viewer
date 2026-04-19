import * as THREE from 'three';

/**
 * Creates the Three.js scene with a dark background and lighting
 * for MeshStandardMaterial support.
 *
 * @returns {THREE.Scene}
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Lighting for MeshStandardMaterial (PointsMaterial is unaffected)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  scene.add(hemisphereLight);

  return scene;
}
