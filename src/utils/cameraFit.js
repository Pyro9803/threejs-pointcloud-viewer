import * as THREE from 'three';
import { EARTH_RADIUS } from './constants.js';
import { state } from '../state.js';

/**
 * Positions the camera so the entire tileset bounding sphere is visible.
 * Handles both local coordinate systems and large ECEF coordinates.
 *
 * @param {import('3d-tiles-renderer').TilesRenderer} tilesRenderer
 * @param {THREE.PerspectiveCamera} camera
 * @param {import('three/examples/jsm/controls/OrbitControls').OrbitControls} orbitControls
 * @returns {{ center: THREE.Vector3, radius: number, isECEF: boolean } | null}
 */
export function fitCameraToTileset(tilesRenderer, camera, orbitControls) {
  const sphere = new THREE.Sphere();
  const box = new THREE.Box3();

  if (!tilesRenderer.getBoundingBox(box)) {
    console.warn('[fitCamera] no bounding box available yet');
    return null;
  }
  box.getBoundingSphere(sphere);

  const center = sphere.center.clone();
  const radius = sphere.radius;

  // Cache for FPS entry positioning
  state.tilesetSphere.copy(sphere);

  // Detect ECEF: bounding-sphere centre magnitude ~ Earth radius
  const mag = center.length();
  const isECEF = mag > EARTH_RADIUS * 0.5 && mag < EARTH_RADIUS * 2.5;

  console.group('[fitCamera] tileset bounds');
  console.log('box min:', box.min);
  console.log('box max:', box.max);
  console.log('sphere centre:', center);
  console.log('sphere radius:', radius);
  console.log('ECEF detected:', isECEF);
  console.groupEnd();

  // Place camera at 2.5x bounding sphere radius away from centre
  const distance = radius * 2.5;

  if (isECEF) {
    const surfaceNormal = center.clone().normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(surfaceNormal, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (perpendicular.lengthSq() < 0.001) {
      perpendicular.set(1, 0, 0);
    }
    camera.position.copy(center).addScaledVector(surfaceNormal, distance);
    camera.up.copy(surfaceNormal);
  } else {
    camera.position.copy(center).add(new THREE.Vector3(0, 0, distance));
    camera.up.set(0, 1, 0);
  }

  camera.near = radius * 0.001;
  camera.far = radius * 100;
  camera.updateProjectionMatrix();

  orbitControls.target.copy(center);
  orbitControls.minDistance = radius * 0.05;
  orbitControls.maxDistance = radius * 50;
  orbitControls.update();

  state.tilesetLoaded = true;

  return { center, radius, isECEF };
}

/**
 * Positions the camera at the bounding sphere edge, looking toward the
 * centre. Used when entering FPS / cave explorer mode.
 *
 * @param {THREE.PerspectiveCamera} camera
 */
export function enterFPSPosition(camera) {
  const { center, radius } = state.tilesetSphere;
  if (radius <= 0) return;

  camera.position.set(center.x + radius, center.y, center.z);
  camera.lookAt(center);
}
