import * as THREE from 'three';
import { state } from '../state.js';
import { enterFPSPosition } from '../utils/cameraFit.js';

/**
 * Creates the mode indicator and "Enter Cave" button, and wires up all
 * mode-switching logic (keyboard, click-to-lock, pointer lock events).
 *
 * @param {{
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   fpsControls: import('three/examples/jsm/controls/PointerLockControls').PointerLockControls,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   overlay: { crosshair: HTMLElement, lockHint: HTMLElement, controlsHint: HTMLElement },
 * }} deps
 */
export function createModeToggle({ camera, renderer, fpsControls, orbitControls, overlay }) {
  const { crosshair, lockHint, controlsHint } = overlay;

  // Mode indicator (top-right, next to FPS counter)
  const indicator = document.createElement('div');
  indicator.id = 'mode-indicator';
  indicator.textContent = '\ud83d\udd2d Orbit';
  document.body.appendChild(indicator);

  // "Enter Cave" button (bottom-center)
  const button = document.createElement('button');
  button.id = 'enter-cave';
  button.textContent = 'Enter Cave (E)';
  document.body.appendChild(button);

  /** Shows the controls hint for 5 s then fades it out. */
  function showControlsHint() {
    controlsHint.classList.remove('fade-out');
    controlsHint.classList.add('visible');
    setTimeout(() => controlsHint.classList.add('fade-out'), 4400);
    setTimeout(() => controlsHint.classList.remove('visible', 'fade-out'), 5000);
  }

  /**
   * Switches between orbit and FPS explorer modes.
   * @param {'orbit' | 'fps'} mode
   */
  function setMode(mode) {
    state.mode = mode;

    if (mode === 'fps') {
      orbitControls.enabled = false;
      button.classList.add('hidden');
      indicator.textContent = '\ud83d\udeb6 Explorer';

      enterFPSPosition(camera);
      lockHint.classList.add('visible');
      showControlsHint();
    } else {
      orbitControls.enabled = true;
      button.classList.remove('hidden');
      indicator.textContent = '\ud83d\udd2d Orbit';

      if (fpsControls.isLocked) fpsControls.unlock();
      lockHint.classList.remove('visible');
      crosshair.classList.remove('visible');
      controlsHint.classList.remove('visible');

      // Snap orbit target to current camera look-at direction
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      orbitControls.target
        .copy(camera.position)
        .addScaledVector(forward, state.tilesetSphere.radius || 10);
      orbitControls.update();
    }
  }

  // ── Event listeners ──────────────────────────────────────────────────

  // Pointer lock / unlock
  fpsControls.addEventListener('lock', () => {
    lockHint.classList.remove('visible');
    crosshair.classList.add('visible');
  });

  fpsControls.addEventListener('unlock', () => {
    crosshair.classList.remove('visible');
    if (state.mode === 'fps') {
      setMode('orbit');
    }
  });

  // "Enter Cave" button
  button.addEventListener('click', () => setMode('fps'));

  // Press E to enter FPS mode
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && state.mode === 'orbit') {
      setMode('fps');
    }
  });

  // Click canvas to lock pointer when in FPS mode
  renderer.domElement.addEventListener('click', () => {
    if (state.mode === 'fps' && !fpsControls.isLocked) {
      fpsControls.lock();
    }
  });
}
