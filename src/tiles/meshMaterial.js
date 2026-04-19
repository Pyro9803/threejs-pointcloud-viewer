import * as THREE from 'three';

/**
 * Traverses a loaded tile scene, finds all `Mesh` objects, and applies
 * a MeshStandardMaterial with vertex colors support.
 *
 * @param {THREE.Object3D} tileScene
 */
export function applyMeshMaterial(tileScene) {
  tileScene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    const geo = obj.geometry;

    // Some loaders store vertex colours as COLOR_0 instead of color
    if (!geo.attributes.color && geo.attributes.COLOR_0) {
      geo.attributes.color = geo.attributes.COLOR_0;
    }

    const hasVertexColors = !!geo.attributes.color;

    obj.material = new THREE.MeshStandardMaterial({
      vertexColors: hasVertexColors,
      color: hasVertexColors ? 0xffffff : 0xcccccc,
      metalness: 0.0,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
  });
}

/**
 * Toggles wireframe mode on all MeshStandardMaterial in the scene.
 *
 * @param {THREE.Scene} scene
 * @param {boolean} enabled
 */
export function setWireframe(scene, enabled) {
  scene.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh &&
      obj.material instanceof THREE.MeshStandardMaterial
    ) {
      obj.material.wireframe = enabled;
      obj.material.needsUpdate = true;
    }
  });
}

/**
 * Sets opacity on all MeshStandardMaterial in the scene.
 *
 * @param {THREE.Scene} scene
 * @param {number} opacity - Value between 0.0 and 1.0
 */
export function setMeshOpacity(scene, opacity) {
  scene.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh &&
      obj.material instanceof THREE.MeshStandardMaterial
    ) {
      obj.material.opacity = opacity;
      obj.material.transparent = opacity < 1.0;
      obj.material.needsUpdate = true;
    }
  });
}
