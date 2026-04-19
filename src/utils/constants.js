export const TILESET_URL = '/tileset/tileset.json';
export const MESH_TILESET_URL = '/tileset-mesh/tileset.json';

/**
 * Radius of the Earth in metres — used to detect ECEF bounding spheres.
 * Any bounding-sphere centre whose magnitude is in [0.5 R, 2.5 R] is
 * treated as ECEF.
 */
export const EARTH_RADIUS = 6_371_000;

export const DEFAULT_POINT_SIZE = 0.05;
export const DEFAULT_MOVE_SPEED = 5.0;
