import * as THREE from 'three';

/**
 * Creates the tileset info panel showing bounding sphere centre, radius,
 * and coordinate system type.
 *
 * @returns {{ el: HTMLElement, setTilesetInfo: (center: THREE.Vector3, radius: number, isECEF: boolean) => void }}
 */
export function createInfoPanel() {
  const el = document.createElement('div');
  el.className = 'panel';
  el.id = 'info-panel';
  el.innerHTML = `
    <h3>Tileset Info</h3>
    <div class="info-row">
      <span class="key">Center</span>
      <span class="val" data-field="center">\u2014</span>
    </div>
    <div class="info-row">
      <span class="key">Radius</span>
      <span class="val" data-field="radius">\u2014</span>
    </div>
    <div class="info-row">
      <span class="key">Coord system</span>
      <span class="val" data-field="coords">\u2014</span>
    </div>
  `;

  const centerEl = el.querySelector('[data-field="center"]');
  const radiusEl = el.querySelector('[data-field="radius"]');
  const coordsEl = el.querySelector('[data-field="coords"]');

  function setTilesetInfo(center, radius, isECEF) {
    if (isECEF) {
      const lat = THREE.MathUtils.radToDeg(
        Math.atan2(center.z, Math.sqrt(center.x ** 2 + center.y ** 2)),
      );
      const lon = THREE.MathUtils.radToDeg(Math.atan2(center.y, center.x));
      centerEl.textContent = `${lat.toFixed(4)}\u00b0, ${lon.toFixed(4)}\u00b0`;
    } else {
      centerEl.textContent =
        `${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`;
    }
    radiusEl.textContent = radius > 1000
      ? `${(radius / 1000).toFixed(2)} km`
      : `${radius.toFixed(2)} m`;
    coordsEl.textContent = isECEF ? 'ECEF (geocentric)' : 'Local / projected';
  }

  return { el, setTilesetInfo };
}
