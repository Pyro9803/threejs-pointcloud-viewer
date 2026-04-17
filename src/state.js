import * as THREE from 'three';
import { DEFAULT_POINT_SIZE, DEFAULT_MOVE_SPEED } from './utils/constants.js';

/** Shared mutable state across modules. */
export const state = {
  /** @type {'orbit' | 'fps'} */
  mode: 'orbit',
  moveSpeed: DEFAULT_MOVE_SPEED,
  pointSize: DEFAULT_POINT_SIZE,
  tilesetLoaded: false,
  darkBackground: true,
  tilesetSphere: new THREE.Sphere(),
};
