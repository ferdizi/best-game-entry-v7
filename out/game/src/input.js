// MOSS & MORTAR input: pointer + keys, translated into game calls.
// One clear job: own every listener and hand the game clean events.
export function attachInput(canvas, world, hooks) {
  let dragging = false;
  let lastX = 0; let lastY = 0;
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width) / (window.devicePixelRatio > 1 ? 1 : 1), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }
  // Canvas backing store is VIEW*dpr; map CSS pixels to VIEW coordinates.
  function viewPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (1280 / r.width), y: (e.clientY - r.top) * (720 / r.height) };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = viewPos(e); dragging = true; lastX = p.x; lastY = p.y;
    hooks.press(p.x, p.y);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = viewPos(e);
    hooks.drag(p.x, p.y, p.x - lastX, p.y - lastY);
    lastX = p.x; lastY = p.y;
  });
  function endDrag() { if (dragging) { dragging = false; hooks.release(); } }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'Enter') hooks.start();
    else if (e.key === 'r' || e.key === 'R') hooks.restart();
    else if (e.key === 'p' || e.key === 'P') hooks.pause();
    else if (e.key === 'm' || e.key === 'M') hooks.mute();
    else if (e.key === ' ') { e.preventDefault(); hooks.hold(true); }
  });
  window.addEventListener('keyup', (e) => { if (e.key === ' ') hooks.hold(false); });
  return { viewPos };
}
