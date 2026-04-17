import * as THREE from 'three';
import { state } from '../state.js';

/**
 * Traverses a loaded tile scene, finds all `Points` objects, and replaces
 * their material with a vertex-coloured `PointsMaterial`.
 *
 * @param {THREE.Object3D} tileScene
 */
export function applyPointCloudMaterial(tileScene) {
  tileScene.traverse((obj) => {
    if (!(obj instanceof THREE.Points)) return;

    obj.material = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      size: state.pointSize,
    });

    // Some loaders store vertex colours as COLOR_0 instead of color
    const geo = obj.geometry;
    if (!geo.attributes.color && geo.attributes.COLOR_0) {
      geo.attributes.color = geo.attributes.COLOR_0;
    }
  });
}

/**
 * Walks the full scene graph and updates the size on every PointsMaterial.
 *
 * @param {THREE.Scene} scene
 * @param {number} size
 */
export function applyPointSizeToScene(scene, size) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Points && obj.material instanceof THREE.PointsMaterial) {
      obj.material.size = size;
      obj.material.needsUpdate = true;
    }
  });
}
