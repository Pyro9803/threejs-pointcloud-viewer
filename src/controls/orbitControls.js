import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Roll speed in radians per second */
const ROLL_SPEED = 1.2;

/**
 * Creates OrbitControls with smooth damping and Z-axis roll (Q/E keys).
 * Roll works by rotating camera.up around the viewing direction, then
 * letting OrbitControls use the rotated up vector for its orbit axes.
 * This ensures mouse drag always feels natural relative to the rolled view.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{ controls: OrbitControls, updateRoll: (delta: number) => void }}
 */
export function setupOrbit(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;

  const keys = {};
  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  /** Accumulated roll angle in radians */
  let rollAngle = 0;

  const _forward = new THREE.Vector3();
  const _up = new THREE.Vector3();

  /**
   * Updates roll angle from Q/E/R keys, sets camera.up to the rolled
   * orientation, then calls orbitControls.update().
   *
   * IMPORTANT: This function calls controls.update() internally.
   * Do NOT call orbitControls.update() separately in animate.js.
   *
   * @param {number} delta — seconds since last frame
   */
  function updateRoll(delta) {
    // 1. Adjust roll angle from key input
    if (keys['KeyQ']) rollAngle += ROLL_SPEED * delta;
    if (keys['KeyE']) rollAngle -= ROLL_SPEED * delta;
    if (keys['KeyR']) rollAngle = 0;

    // 2. Compute camera forward direction (from camera toward orbit target)
    camera.getWorldDirection(_forward);

    // 3. Compute rolled up vector:
    //    Start with world up (0,1,0), rotate it around the forward axis by rollAngle
    _up.set(0, 1, 0);
    if (rollAngle !== 0) {
      _up.applyAxisAngle(_forward, rollAngle);
      _up.normalize();
    }

    // 4. Set camera.up to the rolled up vector
    //    OrbitControls reads this to determine its orbit axes
    camera.up.copy(_up);

    // 5. Let OrbitControls update with the rolled up vector
    //    Mouse drag axes will now match the visual orientation
    controls.update();
  }

  return { controls, updateRoll };
}
