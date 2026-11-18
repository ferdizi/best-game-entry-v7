// MOSS & MORTAR entry point: canvas loop, shot staging, and game wiring.
// One clear job: own the frame loop and hand input + world + render to each other.
import { VIEW, STEP } from './config.js';
import { createWorld, beginGame, stepWorld, press, dragMold, release, startKey } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1);
const world = createWorld(seed);
let last = performance.now();
let acc = 0;

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
}
function announce() {
  if (!status) return;
  const cycle = world.isBoss ? 'Night 5, THE GRANITE WARDEN'
    : world.isNight ? `Night ${world.night} of 5` : `Day ${world.day} of 5`;
  status.textContent = world.screen === SCREEN_TITLE
    ? 'MOSS AND MORTAR title screen. Press Enter to mold your first stone.'
    : world.screen === SCREEN_OVER
      ? `Game over. ${world.won ? 'You won.' : 'You lost.'} Stars ${world.stars} of 30. Press R to play again.`
      : `${cycle}. Hearts ${world.hearts}. Stars ${world.stars}.`;
}
attachInput(canvas, world, {
  press: (x, y) => { press(world, x, y); announce(); },
  drag: (x, y, dx, dy) => { dragMold(world, x, y, dx, dy); announce(); },
  release: () => { release(world); },
  start: () => { startKey(world); announce(); },
  restart: () => { beginGame(world); announce(); },
  pause: () => { world.paused = !world.paused; announce(); },
  mute: () => { toggleMute(); },
  hold: () => {},
});
window.addEventListener('resize', fitCanvas);
fitCanvas();
if (params.get('shot')) {
  const shot = params.get('shot');
  const staged = stageShot(shot, world);
  world.screen = staged.screen === 'card' ? 'card' : staged.screen;
  drawGame(ctx, world);
  announce();
} else {
  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) { stepWorld(world, STEP); acc -= STEP; }
    drawGame(ctx, world);
  })(last);
}
