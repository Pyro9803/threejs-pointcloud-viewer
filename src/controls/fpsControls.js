import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { state } from '../state.js';

/**
 * Creates PointerLockControls and registers WASD + Space/Shift key tracking.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{ controls: PointerLockControls, updateMovement: (delta: number) => void }}
 */
export function setupFPS(camera, renderer) {
  const controls = new PointerLockControls(camera, renderer.domElement);

  const keys = {};
  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  /**
   * Processes WASD + Space/Shift movement. Called every frame from the
   * animation loop; exits early when pointer is not locked.
   *
   * @param {number} delta — seconds since last frame
   */
  function updateMovement(delta) {
    if (!controls.isLocked) return;

    const speed = state.moveSpeed * delta;

    if (keys['KeyW'] || keys['ArrowUp']) controls.moveForward(speed);
    if (keys['KeyS'] || keys['ArrowDown']) controls.moveForward(-speed);
    if (keys['KeyA'] || keys['ArrowLeft']) controls.moveRight(-speed);
    if (keys['KeyD'] || keys['ArrowRight']) controls.moveRight(speed);
    if (keys['Space']) camera.position.y += speed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) camera.position.y -= speed;
  }

  return { controls, updateMovement };
}
