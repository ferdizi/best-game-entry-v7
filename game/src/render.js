// MOSS & MORTAR render: every pixel the player and the judge see.
// One clear job: draw the world; the rules live in world.js.
import { VIEW, PALETTE, PROFILE_ROWS, GRID_COLS, GRID_ROWS, TOTAL_STARS, WARDEN_PHASES } from './config.js';
import { STONE_RECT, DONE_RECT, GRID_RECT, SCREEN_TITLE, SCREEN_CARD, SCREEN_PLAY, SCREEN_OVER } from './world.js';
import { clamp, mulberry32 } from './random.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'normal'} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || 'rgba(46,42,36,0.18)';
  rr(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fill;
  if (frac > 0.005) { rr(ctx, x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); ctx.fill(); }
}
function stonePath(ctx, cx, topY, height, halfW, profile) {
  ctx.beginPath();
  for (let i = 0; i < PROFILE_ROWS; i++) {
    const y = topY + height - (i / (PROFILE_ROWS - 1)) * height;
    const x = cx + profile[i] * halfW;
    if (i === 0) ctx.moveTo(cx - profile[0] * halfW, y);
    ctx.lineTo(x, y);
  }
  for (let i = PROFILE_ROWS - 1; i >= 0; i--) {
    const y = topY + height - (i / (PROFILE_ROWS - 1)) * height;
    ctx.lineTo(cx - profile[i] * halfW, y);
  }
  ctx.closePath();
}

function drawSky(ctx, world) {
  const night = world.isNight || world.isBoss;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  if (night) { g.addColorStop(0, PALETTE.skyNightTop); g.addColorStop(1, PALETTE.skyNight); }
  else { g.addColorStop(0, PALETTE.skyDayTop); g.addColorStop(1, PALETTE.skyDay); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (night) {
    const rng = mulberry32(7);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 60; i++) { ctx.fillRect(rng() * VIEW.width, rng() * 420, 2, 2); }
    ctx.fillStyle = PALETTE.moonGlow;
    ctx.beginPath(); ctx.arc(610, 58, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath(); ctx.arc(610, 58, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180,190,205,0.5)';
    ctx.beginPath(); ctx.arc(598, 48, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(622, 68, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.amberLight;
    ctx.beginPath(); ctx.arc(610, 58, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath(); ctx.arc(610, 58, 30, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 632, VIEW.width, 88);
  ctx.fillStyle = PALETTE.groundDark;
  ctx.fillRect(0, 632, VIEW.width, 6);
}

function drawGardenStrip(ctx, world) {
  text(ctx, 'THE GARDEN SO FAR', 60, 656, 13, 'rgba(255,246,227,0.85)', 'bold');
  if (world.placed.length === 0) {
    text(ctx, 'Nothing planted yet — mold your first stone.', 200, 692, 15, 'rgba(255,246,227,0.75)', 'italic');
    return;
  }
  world.placed.forEach((p, i) => {
    const cx = 240 + i * 120;
    ctx.save();
    ctx.translate(cx, 688);
    ctx.scale(0.32, 0.24);
    stonePath(ctx, 0, -100, 100, 110, p.profile);
    ctx.fillStyle = p.stars === 0 ? '#8a7a68' : PALETTE.stone;
    ctx.fill();
    ctx.strokeStyle = PALETTE.stoneDark; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = PALETTE.moss;
    for (let k = 0; k < 5; k++) ctx.fillRect(-40 + k * 18, -40 - (k % 3) * 12, 8, 6);
    ctx.restore();
    text(ctx, p.name, cx, 708, 11, 'rgba(255,246,227,0.9)', 'bold', 'center');
  });
}

function drawStone(ctx, world) {
  const cx = STONE_RECT.x + STONE_RECT.w / 2;
  const halfW = 230;
  const ghostAlpha = world.phase === 'warden'
    ? 0.15 + 0.8 * Math.pow(Math.max(0, Math.sin(world.moonT * 1.57)), 2)
    : 0.85;
  ctx.save();
  ctx.globalAlpha = ghostAlpha;
  stonePath(ctx, cx, STONE_RECT.y, STONE_RECT.h, halfW, world.target);
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = PALETTE.amber; ctx.lineWidth = 3; ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  stonePath(ctx, cx, STONE_RECT.y, STONE_RECT.h, halfW, world.profile);
  const grad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
  grad.addColorStop(0, PALETTE.stoneDark); grad.addColorStop(0.5, PALETTE.stoneLight); grad.addColorStop(1, PALETTE.stoneDark);
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = PALETTE.slateDark; ctx.lineWidth = 2; ctx.stroke();
  const rng = mulberry32(world.seed * 31 + world.cycleIndex * 7 + 5);
  for (let i = 0; i < PROFILE_ROWS; i++) {
    if (Math.abs(world.profile[i] - world.target[i]) >= 0.08) continue;
    const rowY = STONE_RECT.y + STONE_RECT.h - (i / (PROFILE_ROWS - 1)) * STONE_RECT.h;
    for (let k = 0; k < 3; k++) {
      const ox = (rng() - 0.5) * world.profile[i] * halfW * 1.6;
      const oy = clamp(rowY + (rng() - 0.5) * 22, STONE_RECT.y + 8, STONE_RECT.y + STONE_RECT.h - 8);
      ctx.fillStyle = k % 2 ? PALETTE.moss : PALETTE.mossLight;
      ctx.beginPath(); ctx.arc(cx + ox, oy, 3 + rng() * 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (world.isBoss) {
    const eyeY = STONE_RECT.y - 34;
    const glow = 0.5 + 0.5 * Math.sin(world.moonT * 2);
    ctx.fillStyle = `rgba(217,164,65,${0.55 + 0.4 * glow})`;
    ctx.beginPath(); ctx.arc(cx - 52, eyeY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 52, eyeY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath(); ctx.arc(cx - 52, eyeY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 52, eyeY, 4, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'THE GRANITE WARDEN', cx, STONE_RECT.y - 52, 16, PALETTE.cream, 'bold', 'center');
  }
  text(ctx, 'GHOST = blueprint  ·  STONE = yours  ·  drag sideways to mold', cx, STONE_RECT.y + STONE_RECT.h + 22, 13, world.isNight || world.isBoss ? 'rgba(223,232,240,0.85)' : PALETTE.inkSoft, 'normal', 'center');
}

function drawGrid(ctx, world) {
  const { x, cell, cols, rows } = GRID_RECT;
  const y0 = GRID_RECT.y;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x + c * cell + 5; const py = y0 + r * cell + 5; const s = cell - 10;
      const cellDef = world.grid[r][c];
      ctx.fillStyle = cellDef.stone ? PALETTE.slateDark : cellDef.wet ? PALETTE.moss : cellDef.dry ? '#6b4f30' : 'rgba(246,238,218,0.16)';
      rr(ctx, px, py, s, s, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(223,232,240,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (cellDef.stone) {
        ctx.fillStyle = PALETTE.slate;
        ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2 + 8, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = PALETTE.stoneLight;
        ctx.beginPath(); ctx.arc(px + s / 2 - 8, py + s / 2 - 4, 10, 0, Math.PI * 2); ctx.fill();
      } else if (cellDef.dry) {
        ctx.fillStyle = PALETTE.amber;
        ctx.beginPath();
        ctx.moveTo(px + s / 2, py + s / 2 - 18);
        ctx.quadraticCurveTo(px + s / 2 + 16, py + s / 2 + 2, px + s / 2, py + s / 2 + 14);
        ctx.quadraticCurveTo(px + s / 2 - 16, py + s / 2 + 2, px + s / 2, py + s / 2 - 18);
        ctx.fill();
        text(ctx, 'thirsty', px + s / 2, py + s - 12, 12, PALETTE.amberLight, 'italic', 'center');
      } else if (cellDef.wet) {
        ctx.strokeStyle = PALETTE.mossLight; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(px + s / 2, py + s / 2 + 16); ctx.quadraticCurveTo(px + s / 2, py + s / 2, px + s / 2, py + s / 2 - 12); ctx.stroke();
        ctx.fillStyle = PALETTE.mossLight;
        ctx.beginPath(); ctx.ellipse(px + s / 2 - 12, py + s / 2 - 8, 12, 6, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px + s / 2 + 12, py + s / 2 - 8, 12, 6, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2 - 16, 5, 0, Math.PI * 2); ctx.fill();
      }
      const near = Math.abs(r - world.fly.r) + Math.abs(c - world.fly.c) === 1;
      if (near && !cellDef.stone) {
        ctx.strokeStyle = 'rgba(217,164,65,0.6)'; ctx.lineWidth = 2;
        rr(ctx, px + 3, py + 3, s - 6, s - 6, 10); ctx.stroke();
      }
    }
  }
  const fx = x + world.fly.c * cell + cell / 2;
  const fy = y0 + world.fly.r * cell + cell / 2 + Math.sin(world.moonT * 3) * 4;
  ctx.fillStyle = 'rgba(242,201,107,0.35)';
  ctx.beginPath(); ctx.arc(fx, fy, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.amberLight;
  ctx.beginPath(); ctx.arc(fx, fy, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath(); ctx.arc(fx - 4, fy - 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + 4, fy - 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,246,227,0.85)';
  ctx.beginPath(); ctx.ellipse(fx - 10, fy - 10, 9, 5, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx + 10, fy - 10, 9, 5, 0.5, 0, Math.PI * 2); ctx.fill();
}

function drawPanel(ctx, world) {
  const px = 660, py = 80, pw = 560, ph = 540;
  ctx.fillStyle = PALETTE.panelLight;
  rr(ctx, px, py, pw, ph, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(46,42,36,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  let y = py + 44;
  text(ctx, world.isBoss ? 'NIGHT 5 — BOSS' : world.isNight ? `NIGHT ${world.night} OF 5` : `DAY ${world.day} OF 5`, px + 28, y, 15, PALETTE.inkSoft, 'bold');
  text(ctx, `♥ ${world.hearts}    ★ ${world.stars}/${TOTAL_STARS}`, px + pw - 28, y, 15, PALETTE.red, 'bold', 'right');
  y += 40;
  const title = world.isBoss ? WARDEN_PHASES[world.bossPhase].name : world.isNight ? world.nightDef.name : world.piece.name;
  text(ctx, title, px + 28, y, 30, PALETTE.ink, 'bold');
  y += 30;
  const blurb = world.isBoss ? 'Mold it true while the moon shows the ghost.' : world.isNight ? 'Click a glowing neighbour plot to hop the firefly there.' : world.piece.blurb;
  text(ctx, blurb, px + 28, y, 16, PALETTE.inkSoft, 'italic');
  y += 44;
  if (world.phase === 'whisper') {
    text(ctx, `Whispers left: ${world.whispersLeft}`, px + 28, y, 20, PALETTE.ink, 'bold'); y += 8;
    text(ctx, `Dry patches left: ${world.dryLeft}`, px + 28, y + 28, 20, PALETTE.ink, 'bold'); y += 44;
    bar(ctx, px + 28, y, pw - 56, 16, world.dryLeft === 0 ? 1 : 1 - world.dryLeft / (world.nightDef.dry.length || 1), PALETTE.moss, 'rgba(46,42,36,0.15)');
    y += 40;
    text(ctx, 'Water every dry patch before the whispers run out.', px + 28, y, 15, PALETTE.inkSoft);
    y += 30;
    text(ctx, 'Dawn timer:', px + 28, y, 15, PALETTE.inkSoft);
    bar(ctx, px + 28, y + 10, pw - 56, 14, world.timeLeft / world.timeTotal, PALETTE.slate, 'rgba(46,42,36,0.15)');
  } else {
    text(ctx, `Shape match: ${Math.round(world.moldAcc * 100)}%`, px + 28, y, 20, PALETTE.ink, 'bold'); y += 12;
    bar(ctx, px + 28, y, pw - 56, 18, world.moldAcc, world.moldAcc >= 0.9 ? PALETTE.moss : world.moldAcc >= 0.75 ? PALETTE.sageDark : world.moldAcc >= 0.6 ? PALETTE.amber : PALETTE.red, 'rgba(46,42,36,0.15)');
    y += 48;
    text(ctx, `Moss cover: ${Math.round(world.moss * 100)}%`, px + 28, y, 20, PALETTE.ink, 'bold'); y += 12;
    bar(ctx, px + 28, y, pw - 56, 18, world.moss, PALETTE.moss, 'rgba(46,42,36,0.15)');
    y += 48;
    text(ctx, world.phase === 'warden' ? 'Moonlight (ghost shows and fades):' : 'Time left:', px + 28, y, 15, PALETTE.inkSoft);
    bar(ctx, px + 28, y + 10, pw - 56, 14, world.timeLeft / world.timeTotal, world.timeLeft < 10 ? PALETTE.red : PALETTE.amber, 'rgba(46,42,36,0.15)');
    y += 52;
    if (world.phase === 'warden') text(ctx, `Heart-stone ${world.bossPassed + 1} of 3 — needs 70% to calm him.`, px + 28, y, 15, PALETTE.inkSoft);
    else text(ctx, 'Drag the stone sideways to shape it. 60% to pass, 90% for 3 stars.', px + 28, y, 15, PALETTE.inkSoft);
    ctx.fillStyle = PALETTE.amber;
    rr(ctx, DONE_RECT.x, DONE_RECT.y, DONE_RECT.w, DONE_RECT.h, 12); ctx.fill();
    ctx.strokeStyle = PALETTE.clayDark; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'DONE — ENTER', DONE_RECT.x + DONE_RECT.w / 2, DONE_RECT.y + 36, 20, PALETTE.ink, 'bold', 'center');
  }
  const logY = py + ph - 66;
  ctx.fillStyle = 'rgba(46,42,36,0.08)';
  rr(ctx, px + 20, logY - 18, pw - 40, 52, 10); ctx.fill();
  const lines = world.log.slice(-2);
  lines.forEach((l, i) => text(ctx, l.length > 72 ? l.slice(0, 72) + '…' : l, px + 32, logY + 4 + i * 20, 14, PALETTE.inkSoft, 'italic'));
}

function drawTopBar(ctx, world) {
  const frac = world.timeTotal > 0 ? world.timeLeft / world.timeTotal : 0;
  bar(ctx, 0, 0, VIEW.width, 8, frac, frac < 0.2 ? PALETTE.red : PALETTE.amber, 'rgba(46,42,36,0.2)');
  if (world.paused) {
    ctx.fillStyle = 'rgba(29,36,64,0.55)'; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'PAUSED — press P to continue', VIEW.width / 2, VIEW.height / 2, 36, PALETTE.cream, 'bold', 'center');
  }
}

function drawTitle(ctx, world) {
  drawSky(ctx, { ...world, isNight: false, isBoss: false });
  const cx = VIEW.width / 2;
  text(ctx, 'MOSS & MORTAR', cx, 170, 72, PALETTE.ink, 'bold', 'center');
  text(ctx, 'Mold living stone into a garden that grows', cx, 215, 26, PALETTE.inkSoft, 'italic', 'center');
  text(ctx, '10 days & nights  ·  5 moonlit puzzles  ·  1 granite warden  ·  30 stars', cx, 258, 19, PALETTE.sageDark, 'bold', 'center');
  const lines = [
    'DAY — drag the stone sideways to match the ghost blueprint. 60% to pass.',
    'NIGHT — click a neighbouring plot to hop the firefly and water the dry moss.',
    'NIGHT 5 — THE GRANITE WARDEN wakes. Mold his three heart-stones in moonlight.',
  ];
  lines.forEach((l, i) => text(ctx, l, cx, 330 + i * 34, 19, PALETTE.ink, 'normal', 'center'));
  ctx.fillStyle = PALETTE.amber;
  rr(ctx, cx - 190, 470, 380, 64, 14); ctx.fill();
  ctx.strokeStyle = PALETTE.clayDark; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'PRESS ENTER TO BEGIN', cx, 510, 24, PALETTE.ink, 'bold', 'center');
  text(ctx, 'Mouse to play  ·  R restart  ·  P pause  ·  M mute', cx, 580, 15, PALETTE.inkSoft, 'normal', 'center');
  drawGardenStrip(ctx, { ...world, placed: [
    { name: 'Garden Path', profile: [0.55, 0.6, 0.62, 0.6, 0.65, 0.7, 0.68, 0.7, 0.72, 0.7, 0.72, 0.74, 0.75, 0.75, 0.75, 0.75], stars: 3 },
    { name: 'Dew Basin', profile: [0.42, 0.5, 0.6, 0.62, 0.6, 0.58, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55], stars: 2 },
    { name: 'Ripple Slab', profile: [0.6, 0.62, 0.62, 0.6, 0.6, 0.62, 0.65, 0.7, 0.75, 0.8, 0.82, 0.85, 0.85, 0.85, 0.85, 0.85], stars: 3 },
  ] });
}

function drawCard(ctx, world) {
  drawSky(ctx, world);
  const c = world.lastCard || { name: 'Cycle complete', stars: 0, note: '' };
  const cx = VIEW.width / 2;
  ctx.fillStyle = PALETTE.panelLight;
  rr(ctx, cx - 330, 150, 660, 380, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(46,42,36,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, c.name, cx, 215, 30, PALETTE.ink, 'bold', 'center');
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < c.stars ? '★' : '☆';
  text(ctx, stars, cx, 285, 52, PALETTE.amber, 'bold', 'center');
  text(ctx, c.note || '', cx, 340, 19, PALETTE.inkSoft, 'italic', 'center');
  text(ctx, `Hearts: ${'♥'.repeat(world.hearts)}${'♡'.repeat(3 - world.hearts)}    Total stars: ${world.stars}/${TOTAL_STARS}`, cx, 395, 19, PALETTE.ink, 'normal', 'center');
  if (world.cycleIndex >= 9) text(ctx, 'The garden is complete. Press ENTER for the ending.', cx, 450, 18, PALETTE.sageDark, 'bold', 'center');
  else text(ctx, 'Press ENTER for the next cycle', cx, 450, 18, PALETTE.sageDark, 'bold', 'center');
  drawGardenStrip(ctx, world);
}

function drawOver(ctx, world) {
  drawSky(ctx, world);
  const cx = VIEW.width / 2;
  text(ctx, world.won ? 'THE GARDEN LIVES' : 'THE GARDEN WITHERS', cx, 210, 56, world.won ? PALETTE.moss : PALETTE.red, 'bold', 'center');
  text(ctx, world.won
    ? 'Ten cycles molded, whispered and calmed. The Warden kneels among the moss.'
    : 'Three hearts spent. The stones go quiet — but the moss remembers.', cx, 260, 20, PALETTE.inkSoft, 'italic', 'center');
  let stars = '';
  for (let i = 0; i < 3; i++) stars += '★';
  text(ctx, `${stars}  ${world.stars} / ${TOTAL_STARS} stars`, cx, 330, 36, PALETTE.amber, 'bold', 'center');
  world.results.forEach((r, i) => {
    text(ctx, `${r.name} — ${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}`, cx, 375 + i * 21, 17, PALETTE.ink, 'normal', 'center');
  });
  text(ctx, 'Press R to play again', cx, 375 + world.results.length * 21 + 20, 19, PALETTE.sageDark, 'bold', 'center');
  drawGardenStrip(ctx, world);
}

export function drawGame(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (world.screen === SCREEN_TITLE) { drawTitle(ctx, world); return; }
  if (world.screen === SCREEN_CARD) { drawCard(ctx, world); return; }
  if (world.screen === SCREEN_OVER) { drawOver(ctx, world); return; }
  drawSky(ctx, world);
  if (world.phase === 'whisper') drawGrid(ctx, world);
  else drawStone(ctx, world);
  drawPanel(ctx, world);
  drawGardenStrip(ctx, world);
  drawTopBar(ctx, world);
}
