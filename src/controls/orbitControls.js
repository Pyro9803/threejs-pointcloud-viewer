import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Creates OrbitControls with smooth damping enabled.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @returns {OrbitControls}
 */
export function setupOrbit(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  return controls;
}
