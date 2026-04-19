import * as THREE from 'three';
import { state } from '../state.js';

/**
 * Interactive path editor for creating cave path waypoints.
 * Activated with Shift+P in orbit mode.
 *
 * @param {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer,
 *   getTilesRenderers: () => (import('3d-tiles-renderer').TilesRenderer | null)[],
 * }} deps
 */
export function setupPathEditor({ scene, camera, renderer, getTilesRenderers }) {
  /** Whether path editor is active */
  let active = false;

  /** @type {THREE.Vector3[]} World-space waypoints */
  const waypoints = [];

  /** @type {THREE.Mesh[]} Waypoint marker meshes */
  const markers = [];

  /** @type {THREE.Line | null} Line connecting waypoints */
  let pathLine = null;

  /** Hint overlay element */
  let hintEl = null;

  // Raycaster for picking points
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.5;

  // Marker geometry and material (reused)
  const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8888, linewidth: 2 });

  /**
   * Creates or updates the hint overlay.
   */
  function showHint() {
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.id = 'path-editor-hint';
      hintEl.innerHTML = `
        <strong>Path Editor Mode</strong><br />
        Click to add waypoints<br />
        Right-click to remove last<br />
        Enter to export | Esc to exit
      `;
      document.body.appendChild(hintEl);
    }
    hintEl.style.display = 'block';
  }

  /**
   * Hides the hint overlay.
   */
  function hideHint() {
    if (hintEl) {
      hintEl.style.display = 'none';
    }
  }

  /**
   * Adds a waypoint at the given world position.
   * @param {THREE.Vector3} position
   */
  function addWaypoint(position) {
    waypoints.push(position.clone());

    // Create marker
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    scene.add(marker);
    markers.push(marker);

    updatePathLine();

    console.log(`[pathEditor] Added waypoint ${waypoints.length}: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
  }

  /**
   * Removes the last waypoint.
   */
  function removeLastWaypoint() {
    if (waypoints.length === 0) return;

    waypoints.pop();

    const marker = markers.pop();
    if (marker) {
      scene.remove(marker);
      marker.geometry.dispose();
    }

    updatePathLine();

    console.log(`[pathEditor] Removed waypoint, ${waypoints.length} remaining`);
  }

  /**
   * Updates the line connecting waypoints.
   */
  function updatePathLine() {
    // Remove existing line
    if (pathLine) {
      scene.remove(pathLine);
      pathLine.geometry.dispose();
      pathLine = null;
    }

    if (waypoints.length < 2) return;

    // Create new line
    const geometry = new THREE.BufferGeometry().setFromPoints(waypoints);
    pathLine = new THREE.Line(geometry, lineMaterial);
    scene.add(pathLine);
  }

  /**
   * Exports waypoints as local coordinates (inverse transform).
   */
  function exportWaypoints() {
    if (waypoints.length === 0) {
      console.warn('[pathEditor] No waypoints to export');
      return;
    }

    // Get the tileset group's world matrix inverse
    const tilesRenderers = getTilesRenderers();
    const tilesRenderer = tilesRenderers.find(tr => tr !== null);
    if (!tilesRenderer) {
      console.warn('[pathEditor] No tileset loaded, exporting world coordinates');
      exportAsWorld();
      return;
    }

    const inverseMatrix = tilesRenderer.group.matrixWorld.clone().invert();

    // Transform waypoints to local coordinates
    const localWaypoints = waypoints.map(wp => {
      const local = wp.clone().applyMatrix4(inverseMatrix);
      return `  [${local.x.toFixed(2)}, ${local.y.toFixed(2)}, ${local.z.toFixed(2)}],`;
    });

    const output = `// Copy this to src/data/cavePath.js → CAVE_PATH_LOCAL
export const CAVE_PATH_LOCAL = [
${localWaypoints.join('\n')}
];`;

    console.log('\n' + output + '\n');
    console.log('[pathEditor] Waypoints exported to console. Copy the array above to src/data/cavePath.js');
  }

  /**
   * Exports waypoints as world coordinates (fallback).
   */
  function exportAsWorld() {
    const worldWaypoints = waypoints.map(wp => {
      return `  [${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)}],`;
    });

    const output = `// WARNING: These are world coordinates, not local!
// Transform may be needed before using in cavePath.js
const WAYPOINTS_WORLD = [
${worldWaypoints.join('\n')}
];`;

    console.log('\n' + output + '\n');
  }

  /**
   * Cleans up all markers and lines.
   */
  function cleanup() {
    // Remove markers
    for (const marker of markers) {
      scene.remove(marker);
      marker.geometry.dispose();
    }
    markers.length = 0;

    // Remove line
    if (pathLine) {
      scene.remove(pathLine);
      pathLine.geometry.dispose();
      pathLine = null;
    }

    // Clear waypoints
    waypoints.length = 0;
  }

  /**
   * Enters path editor mode.
   */
  function enter() {
    if (state.mode !== 'orbit') {
      console.warn('[pathEditor] Path editor only works in orbit mode');
      return;
    }

    active = true;
    showHint();
    console.log('[pathEditor] Entered path editor mode. Click to add waypoints.');
  }

  /**
   * Exits path editor mode.
   */
  function exit() {
    active = false;
    hideHint();
    cleanup();
    console.log('[pathEditor] Exited path editor mode');
  }

  // ── Event handlers ──

  const onClick = (event) => {
    if (!active) return;
    if (event.button !== 0) return; // Left click only

    // Get mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    // Raycast against all tiles
    const tilesRenderers = getTilesRenderers();
    let closestIntersection = null;
    let closestDistance = Infinity;

    for (const tilesRenderer of tilesRenderers) {
      if (!tilesRenderer) continue;

      const intersects = raycaster.intersectObject(tilesRenderer.group, true);
      for (const intersection of intersects) {
        if (intersection.distance < closestDistance) {
          closestDistance = intersection.distance;
          closestIntersection = intersection;
        }
      }
    }

    if (closestIntersection) {
      addWaypoint(closestIntersection.point);
    } else {
      console.log('[pathEditor] No point cloud intersection found');
    }
  };

  const onContextMenu = (event) => {
    if (!active) return;
    event.preventDefault();
    removeLastWaypoint();
  };

  const onKeyDown = (event) => {
    // Shift+P to toggle path editor
    if (event.code === 'KeyP' && event.shiftKey && state.mode === 'orbit') {
      if (active) {
        exit();
      } else {
        enter();
      }
      return;
    }

    if (!active) return;

    // Enter to export
    if (event.code === 'Enter') {
      exportWaypoints();
      return;
    }

    // Escape to exit
    if (event.code === 'Escape') {
      exit();
      return;
    }
  };

  // Register event listeners
  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('keydown', onKeyDown);

  /**
   * Returns whether path editor is currently active.
   * @returns {boolean}
   */
  function isActive() {
    return active;
  }

  return { enter, exit, isActive };
}
