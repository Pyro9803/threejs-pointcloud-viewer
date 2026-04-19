import * as THREE from 'three';
import { CAVE_PATH_LOCAL, EYE_HEIGHT, PATH_CLOSED, PATH_SEGMENTS } from '../data/cavePath.js';
import { EARTH_RADIUS } from '../utils/constants.js';
import { state } from '../state.js';

/**
 * Creates spline-based camera controls for walking through the cave.
 * Camera moves along a predefined CatmullRomCurve3 path.
 * Mouse controls look direction freely (decoupled from movement).
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.WebGLRenderer} renderer
 * @returns {{
 *   initPath: (tilesetGroup: THREE.Object3D) => boolean,
 *   update: (delta: number) => void,
 *   getProgress: () => number,
 *   setProgress: (t: number) => void,
 *   isReady: () => boolean,
 *   lock: () => void,
 *   unlock: () => void,
 *   isLocked: boolean,
 *   dispose: () => void,
 * }}
 */
export function setupSpline(camera, renderer) {
  /** @type {THREE.CatmullRomCurve3 | null} */
  let curve = null;

  /** Total arc length of the curve (in world units / meters) */
  let totalArcLength = 0;

  /** Current position on curve (0.0 = start, 1.0 = end) */
  let t = 0;

  /** Current velocity (meters per second, with sign for direction) */
  let velocity = 0;

  /** Mouse look: yaw (horizontal rotation in radians) */
  let yaw = 0;

  /** Mouse look: pitch (vertical rotation in radians, clamped) */
  let pitch = 0;

  /** Whether path has been initialized */
  let ready = false;

  /** Whether we're in ECEF coordinate system */
  let isECEF = false;

  /** Whether pointer is locked */
  let locked = false;

  /** Key state tracking */
  const keys = {};

  // Key event listeners
  const onKeyDown = (e) => { keys[e.code] = true; };
  const onKeyUp = (e) => { keys[e.code] = false; };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // Mouse move handler for look control
  const onMouseMove = (e) => {
    if (!locked) return;

    const sensitivity = 0.002;
    yaw -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;

    // Clamp pitch to avoid flipping (±85 degrees)
    const maxPitch = Math.PI * 85 / 180;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
  };

  document.addEventListener('mousemove', onMouseMove);

  // Pointer lock change handler
  const onPointerLockChange = () => {
    locked = document.pointerLockElement === renderer.domElement;
  };

  document.addEventListener('pointerlockchange', onPointerLockChange);

  /**
   * Initializes the path from tileset group's world transform.
   * Must be called after tileset loads to get the correct transform.
   *
   * @param {THREE.Object3D} tilesetGroup
   * @returns {boolean} Whether initialization succeeded
   */
  function initPath(tilesetGroup) {
    if (CAVE_PATH_LOCAL.length < 2) {
      console.warn('[splineControls] Need at least 2 path points');
      ready = false;
      state.splineReady = false;
      return false;
    }

    // Get the world matrix from the tileset group
    const worldMatrix = tilesetGroup.matrixWorld.clone();

    // Transform local path points to world space
    const worldPoints = CAVE_PATH_LOCAL.map(([x, y, z]) => {
      const point = new THREE.Vector3(x, y, z);
      point.applyMatrix4(worldMatrix);
      return point;
    });

    // Detect ECEF from first point
    const firstPointMag = worldPoints[0].length();
    isECEF = firstPointMag > EARTH_RADIUS * 0.5 && firstPointMag < EARTH_RADIUS * 2.5;

    console.log('[splineControls] Path initialized:', {
      pointCount: worldPoints.length,
      isECEF,
      firstPoint: worldPoints[0],
      lastPoint: worldPoints[worldPoints.length - 1],
    });

    // Create the curve
    curve = new THREE.CatmullRomCurve3(worldPoints, PATH_CLOSED, 'catmullrom', 0.5);

    // Compute total arc length
    totalArcLength = curve.getLength();

    // Reset position to start
    t = 0;
    velocity = 0;

    // Initialize camera look direction along the path
    const startTangent = curve.getTangentAt(0);
    yaw = Math.atan2(-startTangent.x, -startTangent.z);
    pitch = 0;

    ready = true;
    state.splineReady = true;
    state.splineProgress = 0;

    return true;
  }

  /**
   * Gets the "up" direction at a given position.
   * For ECEF: radial from earth center.
   * For local: typically +Y or +Z.
   *
   * @param {THREE.Vector3} position
   * @returns {THREE.Vector3}
   */
  function getUpDirection(position) {
    if (isECEF) {
      return position.clone().normalize();
    }
    // Local coordinates: assume Z is up (common in LiDAR data)
    return new THREE.Vector3(0, 0, 1);
  }

  /**
   * Updates camera position and rotation each frame.
   *
   * @param {number} delta - Seconds since last frame
   */
  function update(delta) {
    if (!ready || !curve) return;
    if (state.mode !== 'spline') return;

    // Process key input for movement
    const forward = keys['KeyW'] || keys['ArrowUp'];
    const backward = keys['KeyS'] || keys['ArrowDown'];

    // Smooth acceleration/deceleration
    const acceleration = 0.1;
    const deceleration = 0.15;

    if (forward) {
      velocity = THREE.MathUtils.lerp(velocity, state.moveSpeed, acceleration);
    } else if (backward) {
      velocity = THREE.MathUtils.lerp(velocity, -state.moveSpeed, acceleration);
    } else {
      velocity = THREE.MathUtils.lerp(velocity, 0, deceleration);
    }

    // Update t based on velocity
    if (Math.abs(velocity) > 0.001) {
      const dt = (velocity * delta) / totalArcLength;
      t += dt;

      // Clamp t to [0, 1] for non-closed paths
      if (!PATH_CLOSED) {
        t = Math.max(0, Math.min(1, t));
      } else {
        // Wrap around for closed paths
        t = ((t % 1) + 1) % 1;
      }
    }

    // Update state for UI
    state.splineProgress = t;

    // Get position on curve
    const position = curve.getPointAt(t);
    const up = getUpDirection(position);

    // Apply eye height offset
    camera.position.copy(position).addScaledVector(up, EYE_HEIGHT);
    camera.up.copy(up);

    // Apply mouse look rotation
    // For ECEF, we need to compose with the local-up orientation
    if (isECEF) {
      // Build local coordinate frame at this position
      const forward = new THREE.Vector3(0, 0, -1);
      const right = new THREE.Vector3().crossVectors(up, forward).normalize();
      if (right.lengthSq() < 0.001) {
        right.set(1, 0, 0);
      }
      const localForward = new THREE.Vector3().crossVectors(right, up).normalize();

      // Create rotation matrix for local frame
      const localBasis = new THREE.Matrix4().makeBasis(right, up, localForward.negate());
      const localQuat = new THREE.Quaternion().setFromRotationMatrix(localBasis);

      // Apply yaw and pitch in local space
      const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
      const lookQuat = new THREE.Quaternion().setFromEuler(euler);

      camera.quaternion.copy(localQuat).multiply(lookQuat);
    } else {
      // Simple case: local coordinates with Z-up
      // Create a basis where Z is up
      const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      // Rotate 90 degrees around X to convert from Y-up to Z-up convention
      const zUpCorrection = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
      );
      camera.quaternion.premultiply(zUpCorrection);
    }
  }

  /**
   * Gets current progress along the path.
   * @returns {number} Value between 0.0 and 1.0
   */
  function getProgress() {
    return t;
  }

  /**
   * Sets position on the path (for scrubbing/jumping).
   * @param {number} newT - Value between 0.0 and 1.0
   */
  function setProgress(newT) {
    t = Math.max(0, Math.min(1, newT));
    velocity = 0; // Stop movement when jumping
    state.splineProgress = t;
  }

  /**
   * Returns whether the path has been initialized.
   * @returns {boolean}
   */
  function isReady() {
    return ready;
  }

  /**
   * Request pointer lock for mouse look.
   */
  function lock() {
    renderer.domElement.requestPointerLock();
  }

  /**
   * Exit pointer lock.
   */
  function unlock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  /**
   * Clean up event listeners.
   */
  function dispose() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
  }

  return {
    initPath,
    update,
    getProgress,
    setProgress,
    isReady,
    lock,
    unlock,
    get isLocked() { return locked; },
    dispose,
  };
}
