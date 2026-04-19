/**
 * Path waypoints in LOCAL cave coordinates (before tileset root transform).
 * These will be transformed to world space at runtime using the tileset's root transform.
 *
 * Format: [x, y, z] where z is the floor height at each point.
 * Points should trace the walking path along the cave floor from entrance to end.
 *
 * To generate these points:
 * 1. Open the point cloud in CloudCompare
 * 2. Use Edit > Point Picking to click floor points from entrance to end
 * 3. Copy coordinates here (use local coordinates, not ECEF)
 *
 * OR use the built-in path editor (Shift+P in orbit mode) to click points
 * directly in the viewer, then copy from console.
 */
export const CAVE_PATH_LOCAL = [
  [726332.78, 4371071.43, 439.71],
  [726246.53, 4371111.69, 439.18],
];

/** Height of camera above the path (simulates eye level) */
export const EYE_HEIGHT = 1.7;

/** Whether the path is a closed loop (false = entrance to end) */
export const PATH_CLOSED = false;

/** Number of interpolated segments for smooth curve (higher = smoother) */
export const PATH_SEGMENTS = 200;
