/* Input kezelés — billentyűzet + touch */

export const keys = {};
export const touch = { left: false, right: false, gas: false, brake: false };

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Touch zones
['left', 'right', 'gas', 'brake'].forEach(z => {
  const el = document.getElementById(`touch-${z}`);
  if (!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); touch[z] = true; });
  el.addEventListener('touchend', e => { e.preventDefault(); touch[z] = false; });
  el.addEventListener('touchcancel', () => touch[z] = false);
});

export const isGas = () => keys['w'] || keys['arrowup'] || touch.gas;
export const isBrake = () => keys['s'] || keys['arrowdown'] || touch.brake;
export const isLeft = () => keys['a'] || keys['arrowleft'] || touch.left;
export const isRight = () => keys['d'] || keys['arrowright'] || touch.right;
