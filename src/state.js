import * as THREE from 'three';
import { DEFAULT_POINT_SIZE, DEFAULT_MOVE_SPEED } from './utils/constants.js';

/** Shared mutable state across modules. */
export const state = {
  /** @type {'orbit' | 'spline'} */
  mode: 'orbit',
  moveSpeed: DEFAULT_MOVE_SPEED,
  pointSize: DEFAULT_POINT_SIZE,
  tilesetLoaded: false,
  darkBackground: true,
  tilesetSphere: new THREE.Sphere(),
  /** @type {'pointcloud' | 'mesh' | 'both'} */
  renderMode: 'pointcloud',
  /** @type {boolean} */
  meshWireframe: false,
  /** @type {number} 0.0 - 1.0 */
  meshOpacity: 1.0,
  /** @type {boolean} */
  meshTilesetAvailable: false,
  /** Spline explorer progress (0.0 = entrance, 1.0 = end) */
  splineProgress: 0,
  /** Whether spline path has been initialized */
  splineReady: false,
};
