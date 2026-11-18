// MOSS & MORTAR world: state, the mold verb, the whisper nights, the Warden.
// One clear job: own the rules and the numbers; drawing lives in render.js.
import { PROFILE_ROWS, PIECES, NIGHTS, WARDEN_PHASES, GRID_COLS, GRID_ROWS, MAX_HEARTS, PASS_MOLD, PASS_WARDEN } from './config.js';
import { clamp, lerp, mulberry32 } from './random.js';
import { sndMold, sndWater, sndWhisper, sndStar, sndFail, sndWarden, sndWin } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_CARD = 'card';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const STONE_RECT = { x: 120, y: 100, w: 500, h: 500 };
export const DONE_RECT = { x: 688, y: 442, w: 220, h: 56 };
export const GRID_RECT = { x: 200, y: 140, cell: 110, cols: GRID_COLS, rows: GRID_ROWS };

export function targetProfile(shape) {
  const out = [];
  for (let i = 0; i < PROFILE_ROWS; i++) {
    const t = i / (PROFILE_ROWS - 1);
    const v = shape.rim + (shape.base - shape.rim) * Math.pow(1 - t, 1.5)
      + shape.belly * Math.exp(-Math.pow((t - shape.at) / 0.18, 2));
    out.push(clamp(v, 0.15, 1));
  }
  return out;
}
export function moldAccuracy(profile, target) {
  let sum = 0;
  for (let i = 0; i < PROFILE_ROWS; i++) sum += Math.abs(profile[i] - target[i]);
  return clamp(1 - (sum / PROFILE_ROWS) / 0.85, 0, 1);
}
export function mossCoverage(profile, target) {
  let n = 0;
  for (let i = 0; i < PROFILE_ROWS; i++) if (Math.abs(profile[i] - target[i]) < 0.08) n++;
  return n / PROFILE_ROWS;
}
function startProfile(rng) {
  const out = [];
  for (let i = 0; i < PROFILE_ROWS; i++) out.push(clamp(0.5 + (rng() - 0.5) * 0.12, 0.15, 1));
  return out;
}

export function createWorld(seed) {
  const w = {
    seed, rng: mulberry32(seed || 1),
    screen: SCREEN_TITLE, paused: false,
    cycleIndex: 0, hearts: MAX_HEARTS, stars: 0, won: false,
    results: [], placed: [], log: [],
    phase: 'mold', day: 1, night: 1, isNight: false, isBoss: false,
    profile: startProfile(mulberry32(seed || 1)), target: targetProfile(PIECES[0].shape),
    moldAcc: 0, moss: 0, timeLeft: 45, timeTotal: 45,
    grid: [], fly: { r: 3, c: 0 }, whispersLeft: 0, dryLeft: 0,
    bossPhase: 0, bossPassed: 0, wardenFails: 0, moonT: 0,
    piece: PIECES[0], nightDef: null, lastCard: null,
    dragRow: -1, lastSnd: 0, elapsed: 0,
  };
  return w;
}

export function beginGame(world) {
  const seed = world.seed;
  const fresh = createWorld(seed);
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
  world.screen = SCREEN_PLAY;
  setupCycle(world);
  world.log = ['Day 1 — mold the Garden Path. Drag the stone to match the ghost shape.'];
}
export function resetWorld(world) { beginGame(world); }

function cycleName(world) {
  if (world.isBoss) return "Night 5 — THE GRANITE WARDEN";
  return world.isNight ? NIGHTS[world.night - 1].name : `Day ${world.day} — ${world.piece.name}`;
}

export function setupCycle(world) {
  const i = world.cycleIndex;
  world.isBoss = i === 9;
  world.isNight = !world.isBoss && i % 2 === 1;
  world.moonT = 0;
  if (world.isBoss) {
    world.phase = 'warden';
    world.bossPhase = 0; world.bossPassed = 0; world.wardenFails = 0;
    setupWardenPhase(world);
    world.log = ['THE GRANITE WARDEN wakes. Mold his heart-stone — the ghost only shows in moonlight.'];
    sndWarden();
    return;
  }
  if (world.isNight) {
    world.phase = 'whisper';
    world.night = (i - 1) / 2 + 1;
    const def = NIGHTS[world.night - 1];
    world.nightDef = def;
    world.grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const row = [];
      for (let c = 0; c < GRID_COLS; c++) row.push({ dry: false, stone: false, wet: false });
      world.grid.push(row);
    }
    def.dry.forEach(([r, c]) => { world.grid[r][c].dry = true; });
    def.stones.forEach(([r, c]) => { world.grid[r][c].stone = true; });
    world.fly = { r: def.start[0], c: def.start[1] };
    world.whispersLeft = def.whispers;
    world.dryLeft = def.dry.length;
    world.timeLeft = 90; world.timeTotal = 90;
    world.log = [`${def.name} — guide the firefly. Click a neighbouring plot to hop. Water every dry patch.`];
    return;
  }
  world.phase = 'mold';
  world.day = i / 2 + 1;
  world.piece = PIECES[world.day - 1];
  world.target = targetProfile(world.piece.shape);
  world.profile = startProfile(world.rng);
  world.moldAcc = moldAccuracy(world.profile, world.target);
  world.moss = mossCoverage(world.profile, world.target);
  world.timeLeft = world.piece.moldTime; world.timeTotal = world.piece.moldTime;
  world.log = [`Day ${world.day} of 5 — mold the ${world.piece.name}. ${world.piece.blurb}`];
}

function setupWardenPhase(world) {
  const def = WARDEN_PHASES[world.bossPhase];
  world.target = targetProfile(def.shape);
  world.profile = startProfile(world.rng);
  world.moldAcc = moldAccuracy(world.profile, world.target);
  world.moss = mossCoverage(world.profile, world.target);
  world.timeLeft = def.moldTime; world.timeTotal = def.moldTime;
}

function rowFromY(y) {
  const t = clamp((y - STONE_RECT.y) / STONE_RECT.h, 0, 1);
  return clamp(Math.round((1 - t) * (PROFILE_ROWS - 1)), 0, PROFILE_ROWS - 1);
}
function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

export function press(world, x, y) {
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  if (world.phase === 'mold' || world.phase === 'warden') {
    if (inRect(x, y, DONE_RECT)) { submitMold(world); return; }
    if (x >= STONE_RECT.x - 40 && x <= STONE_RECT.x + STONE_RECT.w + 40 && y >= STONE_RECT.y - 20 && y <= STONE_RECT.y + STONE_RECT.h + 20) {
      world.dragRow = rowFromY(y);
    }
    return;
  }
  if (world.phase === 'whisper') {
    const gx = Math.floor((x - GRID_RECT.x) / GRID_RECT.cell);
    const gy = Math.floor((y - GRID_RECT.y) / GRID_RECT.cell);
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return;
    const cell = world.grid[gy][gx];
    if (cell.stone) { world.log = ['A standing stone blocks that plot.']; return; }
    const dist = Math.abs(gy - world.fly.r) + Math.abs(gx - world.fly.c);
    if (dist !== 1) { world.log = ['The firefly only hops to a neighbouring plot.']; return; }
    if (world.whispersLeft <= 0) return;
    world.fly = { r: gy, c: gx };
    world.whispersLeft--;
    sndWhisper();
    if (cell.dry && !cell.wet) {
      cell.wet = true; cell.dry = false; world.dryLeft--;
      sndWater();
      world.log = [`Dew delivered — ${world.dryLeft} dry patch${world.dryLeft === 1 ? '' : 'es'} left.`];
    }
    if (world.dryLeft === 0) finishWhisper(world);
    else if (world.whispersLeft === 0) failCycle(world, 'Out of whispers — the moss stays thirsty.');
  }
}
export function dragMold(world, x, y, dx, dy) {
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  if (world.phase !== 'mold' && world.phase !== 'warden') return;
  if (world.dragRow < 0) return;
  const row = rowFromY(y);
  world.dragRow = row;
  for (let r = Math.max(0, row - 2); r <= Math.min(PROFILE_ROWS - 1, row + 2); r++) {
    const fall = r === row ? 1 : r === row - 1 || r === row + 1 ? 0.55 : 0.25;
    world.profile[r] = clamp(world.profile[r] + dx * 0.004 * fall, 0.12, 1);
  }
  world.moldAcc = moldAccuracy(world.profile, world.target);
  world.moss = mossCoverage(world.profile, world.target);
  const now = world.elapsed;
  if (now - world.lastSnd > 0.09) { world.lastSnd = now; sndMold(); }
}
export function release(world) { world.dragRow = -1; }

function starsFor(acc) { return acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= PASS_MOLD ? 1 : 0; }

function finishCycle(world, name, stars, note) {
  world.stars += stars;
  world.results.push({ name, stars });
  world.lastCard = { name, stars, acc: world.moldAcc, moss: world.moss, note, boss: world.isBoss };
  if (stars > 0) sndStar();
  world.screen = SCREEN_CARD;
}

function failCycle(world, note) {
  world.hearts--;
  sndFail();
  world.results.push({ name: cycleName(world), stars: 0 });
  world.lastCard = { name: cycleName(world), stars: 0, acc: world.moldAcc, moss: world.moss, note, boss: world.isBoss };
  if (world.hearts <= 0) {
    world.won = false;
    world.screen = SCREEN_OVER;
    world.log = ['The garden withers. The Warden keeps his silence.'];
  } else {
    world.screen = SCREEN_CARD;
  }
}

function submitMold(world) {
  const acc = world.moldAcc;
  if (world.phase === 'warden') {
    const def = WARDEN_PHASES[world.bossPhase];
    if (acc >= PASS_WARDEN) {
      world.bossPassed++;
      world.log = [`${def.name} settles — the old stone sighs. (${world.bossPassed}/3)`];
      if (world.bossPassed >= 3) {
        finishCycle(world, 'THE GRANITE WARDEN', Math.max(1, 3 - world.wardenFails), 'The Warden kneels. The garden is his now, too.');
        world.log = ['THE GRANITE WARDEN kneels. Moss blooms across his shoulders.'];
      } else {
        world.bossPhase++;
        setupWardenPhase(world);
      }
    } else {
      world.wardenFails++;
      world.hearts--;
      sndFail();
      if (world.hearts <= 0) {
        world.won = false; world.screen = SCREEN_OVER;
        world.log = ['The Warden turns away. The garden withers.'];
      } else {
        world.log = [`Too rough — the Warden rumbles. Mold ${def.name} again, softer. (${world.hearts} hearts left)`];
        setupWardenPhase(world);
      }
    }
    return;
  }
  const stars = starsFor(acc);
  world.placed.push({ name: world.piece.name, profile: [...world.profile], target: [...world.target], stars });
  if (stars === 0) failCycle(world, `The ${world.piece.name} cracked — it did not match the blueprint.`);
  else finishCycle(world, `Day ${world.day} — ${world.piece.name}`, stars, acc >= 0.9 ? 'A perfect mold. Moss rushes in.' : acc >= 0.75 ? 'Well molded. The moss approves.' : 'It holds. The moss creeps in slowly.');
}

function finishWhisper(world) {
  const left = world.whispersLeft;
  const stars = left >= 3 ? 3 : left >= 1 ? 2 : 1;
  finishCycle(world, NIGHTS[world.night - 1].name, stars, left >= 3 ? 'Every patch watered with whispers to spare.' : 'Every patch watered — just in time.');
}

export function stepWorld(world, dt) {
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  world.elapsed += dt;
  world.moonT += dt;
  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    if (world.phase === 'whisper') failCycle(world, 'Dawn came before the last patch was watered.');
    else if (world.phase === 'warden') {
      world.wardenFails++; world.hearts--; sndFail();
      if (world.hearts <= 0) { world.won = false; world.screen = SCREEN_OVER; }
      else { world.log = ['Moonlight faded mid-mold. Try again, softer.']; setupWardenPhase(world); }
    } else {
      const stars = starsFor(world.moldAcc);
      world.placed.push({ name: world.piece.name, profile: [...world.profile], target: [...world.target], stars });
      if (stars === 0) failCycle(world, 'Time ran out — the stone set half-shaped.');
      else finishCycle(world, `Day ${world.day} — ${world.piece.name}`, stars, 'Finished as the light went.');
    }
  }
}

export function startKey(world) {
  if (world.screen === SCREEN_TITLE) { beginGame(world); return; }
  if (world.screen === SCREEN_CARD) {
    if (world.cycleIndex >= 9) {
      world.won = world.hearts > 0;
      world.screen = SCREEN_OVER;
      if (world.won) sndWin();
      return;
    }
    world.cycleIndex++;
    setupCycle(world);
    world.screen = SCREEN_PLAY;
    return;
  }
  if (world.screen === SCREEN_PLAY) {
    if (world.phase === 'mold' || world.phase === 'warden') submitMold(world);
    return;
  }
}
