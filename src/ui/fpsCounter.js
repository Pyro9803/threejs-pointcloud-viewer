/**
 * Creates the FPS counter element and returns an update function
 * to be called every frame.
 *
 * @returns {{ el: HTMLElement, update: () => void }}
 */
export function createFPSCounter() {
  const el = document.createElement('div');
  el.id = 'fps';
  el.textContent = '-- FPS';
  document.body.appendChild(el);

  let lastTime = performance.now();
  let frameCount = 0;

  function update() {
    frameCount++;
    const now = performance.now();
    const delta = now - lastTime;
    if (delta >= 500) {
      el.textContent = `${Math.round((frameCount * 1000) / delta)} FPS`;
      frameCount = 0;
      lastTime = now;
    }
  }

  return { el, update };
}
