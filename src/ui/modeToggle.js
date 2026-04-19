import * as THREE from 'three';
import { state } from '../state.js';
import { enterSplinePosition } from '../utils/cameraFit.js';

/**
 * Creates the mode indicator and "Explore Cave" button, and wires up all
 * mode-switching logic (keyboard, click-to-lock, pointer lock events).
 *
 * @param {{
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   splineControls: import('../controls/splineControls.js').setupSpline extends (...args: any[]) => infer R ? R : never,
 *   orbitControls: import('three/examples/jsm/controls/OrbitControls').OrbitControls,
 *   overlay: { crosshair: HTMLElement, lockHint: HTMLElement, controlsHint: HTMLElement },
 * }} deps
 */
export function createModeToggle({ camera, renderer, splineControls, orbitControls, overlay }) {
  const { crosshair, lockHint, controlsHint } = overlay;

  // Mode indicator (top-right, next to FPS counter)
  const indicator = document.createElement('div');
  indicator.id = 'mode-indicator';
  indicator.textContent = '\ud83d\udd2d Orbit';
  document.body.appendChild(indicator);

  // "Explore Cave" button (bottom-center)
  const button = document.createElement('button');
  button.id = 'enter-cave';
  button.textContent = 'Explore Cave (F)';
  document.body.appendChild(button);

  /** Shows the controls hint for 5 s then fades it out. */
  function showControlsHint() {
    controlsHint.classList.remove('fade-out');
    controlsHint.classList.add('visible');
    setTimeout(() => controlsHint.classList.add('fade-out'), 4400);
    setTimeout(() => controlsHint.classList.remove('visible', 'fade-out'), 5000);
  }

  /**
   * Updates button state based on spline readiness.
   */
  function updateButtonState() {
    if (state.splineReady) {
      button.disabled = false;
      button.title = '';
    } else {
      button.disabled = true;
      button.title = 'Path data not available. Edit src/data/cavePath.js or use Shift+P to create a path.';
    }
  }

  /**
   * Switches between orbit and spline explorer modes.
   * @param {'orbit' | 'spline'} mode
   */
  function setMode(mode) {
    state.mode = mode;

    if (mode === 'spline') {
      if (!state.splineReady) {
        console.warn('[modeToggle] Cannot enter spline mode: path not ready');
        return;
      }

      orbitControls.enabled = false;
      button.classList.add('hidden');
      indicator.textContent = '\ud83d\udeb6 Explorer';

      enterSplinePosition(camera, splineControls);
      lockHint.classList.add('visible');
      showControlsHint();

      // Dispatch mode change event
      document.dispatchEvent(new CustomEvent('mode-change', { detail: { mode } }));
    } else {
      orbitControls.enabled = true;
      button.classList.remove('hidden');
      indicator.textContent = '\ud83d\udd2d Orbit';

      if (splineControls.isLocked) splineControls.unlock();
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

      // Dispatch mode change event
      document.dispatchEvent(new CustomEvent('mode-change', { detail: { mode } }));
    }

    updateButtonState();
  }

  // ── Event listeners ──────────────────────────────────────────────────

  // Pointer lock change
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
      lockHint.classList.remove('visible');
      crosshair.classList.add('visible');
    } else {
      crosshair.classList.remove('visible');
      if (state.mode === 'spline') {
        setMode('orbit');
      }
    }
  });

  // "Explore Cave" button
  button.addEventListener('click', () => {
    if (state.splineReady) {
      setMode('spline');
    }
  });

  // Press F to enter spline mode
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF' && state.mode === 'orbit' && state.splineReady) {
      setMode('spline');
    }
  });

  // Click canvas to lock pointer when in spline mode
  renderer.domElement.addEventListener('click', () => {
    if (state.mode === 'spline' && !splineControls.isLocked) {
      splineControls.lock();
    }
  });

  // Listen for spline ready state changes
  document.addEventListener('spline-ready', () => {
    updateButtonState();
  });

  // Initial button state
  updateButtonState();
}
