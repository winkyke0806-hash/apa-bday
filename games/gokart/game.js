/* ══════════════════════════════════════════
   APU GOKART GP — Game Engine v3
   Realistic track + polished graphics + AI
   ══════════════════════════════════════════ */

// ─── Screens ───
const screens = { title: document.getElementById('title-screen'), howto: document.getElementById('howto-screen'), game: document.getElementById('game-screen'), finish: document.getElementById('finish-screen') };
function showScreen(n) { Object.values(screens).forEach(s => s.classList.remove('active')); screens[n].classList.add('active'); }

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ═══════════════════════════════════
   TRACK — matches reference image:
   Complex indoor kart circuit with
   tight hairpins, S-curves, chicanes
   ═══════════════════════════════════ */

// Centerline waypoints (normalized 0-1, mapped to screen)
// Layout: clockwise, matching the reference photo
const TRACK_RAW = [
  // START straight (bottom-left going right)
  [0.12, 0.78], [0.22, 0.78], [0.32, 0.78], [0.42, 0.78],
  // Gentle right curve
  [0.50, 0.77], [0.56, 0.74],
  // Sharp right hairpin going up-right
  [0.60, 0.68], [0.62, 0.60], [0.62, 0.52],
  // Right kink
  [0.64, 0.46], [0.68, 0.42],
  // Short straight up-right
  [0.72, 0.38], [0.76, 0.34],
  // Top-right hairpin (180°)
  [0.79, 0.28], [0.78, 0.22], [0.74, 0.18], [0.68, 0.17],
  // Left along top
  [0.62, 0.19], [0.56, 0.22],
  // S-curve down
  [0.52, 0.27], [0.50, 0.32], [0.52, 0.37],
  // Right kink into middle section
  [0.48, 0.42], [0.42, 0.44],
  // Left hairpin
  [0.36, 0.42], [0.30, 0.38], [0.26, 0.32],
  // Up to top-left
  [0.24, 0.26], [0.24, 0.20],
  // Top-left hairpin
  [0.26, 0.15], [0.30, 0.12], [0.36, 0.12],
  // Right along top-center
  [0.40, 0.14], [0.44, 0.18],
  // Down through center chicane
  [0.44, 0.24], [0.42, 0.30], [0.38, 0.36],
  // Sweeping left going down
  [0.34, 0.44], [0.28, 0.52], [0.22, 0.56],
  // Down left side
  [0.18, 0.60], [0.15, 0.66], [0.14, 0.72],
  // Back to start
  [0.13, 0.76],
];

const TRACK_HALF_W = 0.032; // half-width as fraction of min(w,h)

let track = null;
let trackLen = 0;

function buildTrack(w, h) {
  const s = Math.min(w, h);
  const hw = TRACK_HALF_W * s;
  let center = TRACK_RAW.map(p => ({ x: p[0] * w, y: p[1] * h }));

  // Chaikin smooth 3x for really smooth curves
  for (let iter = 0; iter < 3; iter++) {
    const next = [];
    for (let i = 0; i < center.length; i++) {
      const j = (i + 1) % center.length;
      next.push({ x: center[i].x * 0.75 + center[j].x * 0.25, y: center[i].y * 0.75 + center[j].y * 0.25 });
      next.push({ x: center[i].x * 0.25 + center[j].x * 0.75, y: center[i].y * 0.25 + center[j].y * 0.75 });
    }
    center = next;
  }

  // Normals → outer/inner
  const outer = [], inner = [];
  for (let i = 0; i < center.length; i++) {
    const prev = center[(i - 1 + center.length) % center.length];
    const nxt = center[(i + 1) % center.length];
    const dx = nxt.x - prev.x, dy = nxt.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    outer.push({ x: center[i].x + nx * hw, y: center[i].y + ny * hw });
    inner.push({ x: center[i].x - nx * hw, y: center[i].y - ny * hw });
  }

  // Length
  let totalLen = 0;
  for (let i = 1; i < center.length; i++) totalLen += Math.hypot(center[i].x - center[i - 1].x, center[i].y - center[i - 1].y);
  totalLen += Math.hypot(center[0].x - center[center.length - 1].x, center[0].y - center[center.length - 1].y);
  trackLen = totalLen;

  // Checkpoints
  const cpIdx = [0, Math.floor(center.length * 0.25), Math.floor(center.length * 0.5), Math.floor(center.length * 0.75)];
  const checkpoints = cpIdx.map(idx => ({ outer: outer[idx], inner: inner[idx], center: center[idx] }));

  // Compute curvature at each point for kerb placement
  const curvature = center.map((p, i) => {
    const prev = center[(i - 1 + center.length) % center.length];
    const nxt = center[(i + 1) % center.length];
    const d1x = p.x - prev.x, d1y = p.y - prev.y;
    const d2x = nxt.x - p.x, d2y = nxt.y - p.y;
    const cross = d1x * d2y - d1y * d2x;
    const mag = (Math.hypot(d1x, d1y) * Math.hypot(d2x, d2y)) || 1;
    return cross / mag;
  });

  return { center, outer, inner, hw, checkpoints, curvature };
}

// ─── Point in polygon ───
function pip(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function isOnTrack(x, y) { return pip(x, y, track.outer) && !pip(x, y, track.inner); }

/* ═══════════════════════════
   CAR CLASS
   ═══════════════════════════ */
class Car {
  constructor(color, stripe, name, isPlayer = false) {
    this.x = 0; this.y = 0; this.angle = 0; this.speed = 0;
    this.color = color; this.stripe = stripe; this.name = name;
    this.isPlayer = isPlayer;
    this.maxSpeed = isPlayer ? 5.5 : 4.5 + Math.random() * 1.0;
    this.accel = isPlayer ? 0.14 : 0.10 + Math.random() * 0.04;
    this.friction = 0.97; this.offFriction = 0.90;
    this.turnSpeed = isPlayer ? 0.048 : 0.042;
    this.w = 12; this.h = 22;
    this.lap = 0; this.nextCP = 0; this.cpPassed = 0;
    this.finished = false; this.finishTime = 0;
    this.aiTarget = 0; this.aiOffset = (Math.random() - 0.5) * 0.5;
    this.trailX = 0; this.trailY = 0; // for tire trails
  }
}

// ─── Input ───
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const touch = { left: false, right: false, gas: false, brake: false };
['left', 'right', 'gas', 'brake'].forEach(z => {
  const el = document.getElementById(`touch-${z}`);
  if (!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); touch[z] = true; });
  el.addEventListener('touchend', e => { e.preventDefault(); touch[z] = false; });
  el.addEventListener('touchcancel', () => touch[z] = false);
});
const isGas = () => keys['w'] || keys['arrowup'] || touch.gas;
const isBrake = () => keys['s'] || keys['arrowdown'] || touch.brake;
const isLeft = () => keys['a'] || keys['arrowleft'] || touch.left;
const isRight = () => keys['d'] || keys['arrowright'] || touch.right;

// ─── Game State ───
let player, aiCars, allCars;
let gameRunning = false, startTime = 0, lapTimes = [];
const TOTAL_LAPS = 3;
let bestTime = localStorage.getItem('apu-gokart-best') || null;
let skidMarks = [], tireMarks = [];
let positions = [];

const AI_DEFS = [
  { color: '#2563eb', stripe: '#60a5fa', name: 'Kék Villám' },
  { color: '#16a34a', stripe: '#4ade80', name: 'Zöld Szörny' },
  { color: '#9333ea', stripe: '#c084fc', name: 'Lila Rakéta' },
];

/* ═══════════════════════════
   PHYSICS
   ═══════════════════════════ */

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function findNearestIdx(x, y) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < track.center.length; i++) {
    const d = Math.hypot(track.center[i].x - x, track.center[i].y - y);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function checkCarCP(car) {
  if (car.finished) return;
  const cp = track.checkpoints[car.nextCP];
  if (distToSeg(car.x, car.y, cp.outer.x, cp.outer.y, cp.inner.x, cp.inner.y) < track.hw * 1.8) {
    car.nextCP = (car.nextCP + 1) % track.checkpoints.length;
    car.cpPassed++;
    if (car.cpPassed >= track.checkpoints.length) {
      car.cpPassed = 0;
      car.lap++;
      if (car.isPlayer) {
        const now = performance.now();
        const lapTime = now - (lapTimes.length > 0 ? lapTimes.reduce((a, b) => a + b, 0) + startTime : startTime);
        lapTimes.push(lapTime);
        document.getElementById('hud-lap').textContent = `${Math.min(car.lap + 1, TOTAL_LAPS)} / ${TOTAL_LAPS}`;
      }
      if (car.lap >= TOTAL_LAPS) {
        car.finished = true;
        car.finishTime = performance.now() - startTime;
        if (car.isPlayer) finishRace();
      }
    }
  }
}

function updatePlayer(car) {
  const ct = Math.abs(car.speed) > 0.3;
  if (isLeft() && ct) car.angle -= car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isRight() && ct) car.angle += car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isGas()) car.speed += car.accel;
  if (isBrake()) car.speed -= 0.22;
  car.speed = Math.max(-car.maxSpeed * 0.3, Math.min(car.maxSpeed, car.speed));

  const on = isOnTrack(car.x, car.y);
  car.speed *= on ? car.friction : car.offFriction;

  // Drift
  const drifting = (isLeft() || isRight()) && Math.abs(car.speed) > 2.2;
  if (drifting) {
    car.speed *= 0.984;
    skidMarks.push({ x: car.x - Math.sin(car.angle) * 5, y: car.y + Math.cos(car.angle) * 5, age: 0 });
    skidMarks.push({ x: car.x + Math.sin(car.angle + Math.PI / 6) * 4, y: car.y - Math.cos(car.angle + Math.PI / 6) * 4, age: 0 });
    if (skidMarks.length > 500) skidMarks.splice(0, 2);
  }

  car.trailX = car.x; car.trailY = car.y;
  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  if (!isOnTrack(car.x, car.y)) {
    const p = track.center[findNearestIdx(car.x, car.y)];
    const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 3;
    car.y += (p.y - car.y) / d * 3;
    car.speed *= 0.35;
  }
}

function updateAI(car) {
  if (car.finished) { car.speed *= 0.97; return; }
  const tc = track.center;
  const tgt = tc[car.aiTarget];
  const prev = tc[(car.aiTarget - 1 + tc.length) % tc.length];
  const nxt = tc[(car.aiTarget + 1) % tc.length];
  const tdx = nxt.x - prev.x, tdy = nxt.y - prev.y, tl = Math.hypot(tdx, tdy) || 1;
  const ox = tgt.x + (-tdy / tl) * track.hw * car.aiOffset;
  const oy = tgt.y + (tdx / tl) * track.hw * car.aiOffset;

  const dx = ox - car.x, dy = oy - car.y;
  let ta = Math.atan2(dx, -dy);
  let diff = ta - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  if (Math.abs(car.speed) > 0.2) car.angle += Math.sign(diff) * Math.min(Math.abs(diff), car.turnSpeed * 1.3);

  const sharp = Math.abs(diff);
  const ts = sharp > 0.4 ? car.maxSpeed * 0.5 : sharp > 0.15 ? car.maxSpeed * 0.75 : car.maxSpeed * (0.88 + Math.random() * 0.12);
  if (car.speed < ts) car.speed += car.accel; else car.speed *= 0.95;

  if (Math.hypot(dx, dy) < track.hw * 1.5) car.aiTarget = (car.aiTarget + 1) % tc.length;

  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  if (!isOnTrack(car.x, car.y)) {
    const p = tc[car.aiTarget];
    const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 3.5;
    car.y += (p.y - car.y) / d * 3.5;
    car.speed *= 0.5;
  }
}

function carCollisions() {
  for (let i = 0; i < allCars.length; i++) for (let j = i + 1; j < allCars.length; j++) {
    const a = allCars[i], b = allCars[j];
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (dist < 16 && dist > 0) {
      const nx = dx / dist, ny = dy / dist, push = (16 - dist) / 2;
      a.x -= nx * push; a.y -= ny * push;
      b.x += nx * push; b.y += ny * push;
      a.speed *= 0.8; b.speed *= 0.8;
    }
  }
}

function updatePositions() {
  positions = [...allCars].sort((a, b) => {
    if (a.lap !== b.lap) return b.lap - a.lap;
    if (a.cpPassed !== b.cpPassed) return b.cpPassed - a.cpPassed;
    const ca = track.checkpoints[a.nextCP]?.center || track.center[0];
    const cb = track.checkpoints[b.nextCP]?.center || track.center[0];
    return Math.hypot(a.x - ca.x, a.y - ca.y) - Math.hypot(b.x - cb.x, b.y - cb.y);
  });
}

function update() {
  if (!gameRunning) return;
  updatePlayer(player);
  aiCars.forEach(updateAI);
  carCollisions();
  allCars.forEach(checkCarCP);
  updatePositions();

  document.getElementById('hud-time').textContent = formatTime(performance.now() - startTime);
  document.getElementById('hud-pos').textContent = `${positions.indexOf(player) + 1}/${allCars.length}`;

  skidMarks.forEach(m => m.age++);
  skidMarks = skidMarks.filter(m => m.age < 150);
}

/* ═══════════════════════════
   RENDER — polished graphics
   ═══════════════════════════ */

function render() {
  const w = canvas.width, h = canvas.height;

  // ─ Background: dark green with texture ─
  ctx.fillStyle = '#1e4d1a';
  ctx.fillRect(0, 0, w, h);

  // Grass patches (subtle variation)
  for (let i = 0; i < 200; i++) {
    const gx = (i * 173 + 29) % w, gy = (i * 241 + 67) % h;
    ctx.fillStyle = i % 3 === 0 ? '#1a4216' : '#225520';
    ctx.fillRect(gx, gy, 4 + (i % 3), 4 + (i % 2));
  }

  // ─ Track surface ─
  // Outer fill (asphalt)
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#333';
  ctx.fill();

  // Inner cutout (grass island)
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#1e4d1a';
  ctx.fill();

  // Inner island lighter center
  ctx.beginPath();
  track.center.forEach((p, i) => {
    const ip = track.inner[i];
    const mx = (p.x + ip.x) / 2, my = (p.y + ip.y) / 2;
    i === 0 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my);
  });
  ctx.closePath();
  ctx.fillStyle = '#245a20';
  ctx.fill();

  // ─ Asphalt detail: rubber marks ─
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < track.center.length; i += 8) {
    const p = track.center[i];
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(p.x + (Math.sin(i) * 6), p.y + (Math.cos(i) * 6), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ─ Kerbs (red-white) on high-curvature sections ─
  for (let i = 0; i < track.center.length; i++) {
    if (Math.abs(track.curvature[i]) > 0.015) {
      const o = track.outer[i];
      const blockIdx = Math.floor(i / 4);
      ctx.fillStyle = blockIdx % 2 === 0 ? '#cc2233' : '#fff';
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─ Tire barriers on sharp corners ─
  for (let i = 0; i < track.center.length; i += 3) {
    if (Math.abs(track.curvature[i]) > 0.025) {
      const o = track.outer[i];
      // Stack of tires
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ─ Track borders ─
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ─ Center dashes ─
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  track.center.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // ─ Start/finish ─
  const s0 = track.outer[0], s1 = track.inner[0];
  // Checkerboard pattern
  const sfDx = s1.x - s0.x, sfDy = s1.y - s0.y;
  const sfLen = Math.hypot(sfDx, sfDy);
  const sfNx = sfDx / sfLen, sfNy = sfDy / sfLen;
  const squares = 8;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < squares; col++) {
      const t = col / squares;
      const bx = s0.x + sfNx * sfLen * t;
      const by = s0.y + sfNy * sfLen * t;
      const sz = sfLen / squares;
      ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#111';
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(sfDy, sfDx));
      ctx.fillRect(0, -3 + row * 3, sz, 3);
      ctx.restore();
    }
  }

  // ─ Skid marks ─
  skidMarks.forEach(m => {
    const a = 1 - m.age / 150;
    ctx.fillStyle = `rgba(20,20,20,${a * 0.3})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // ─ Cars (depth sorted) ─
  [...allCars].sort((a, b) => a.y - b.y).forEach(renderCar);

  // Camera shake
  if (player.speed > 4.5) {
    const s = (player.speed - 4.5) * 0.25;
    canvas.style.transform = `translate(${(Math.random() - 0.5) * s}px,${(Math.random() - 0.5) * s}px)`;
  } else canvas.style.transform = '';

  // Mini-map
  renderMiniMap(w, h);
}

function renderCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const W = car.w, H = car.h;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, -W / 2 + 1.5, -H / 2 + 1.5, W, H, 3);
  ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  roundRect(ctx, -W / 2, -H / 2, W, H, 3);
  ctx.fill();

  // Racing stripe
  ctx.fillStyle = car.stripe;
  ctx.fillRect(-1.5, -H / 2 + 1, 3, H - 2);

  // Windshield
  ctx.fillStyle = 'rgba(120,200,255,0.7)';
  roundRect(ctx, -W / 2 + 2, -H / 2 + 2, W - 4, 5, 1.5);
  ctx.fill();

  // Rear lights
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(-W / 2 + 1, H / 2 - 3, 3, 2);
  ctx.fillRect(W / 2 - 4, H / 2 - 3, 3, 2);

  // Headlights glow
  if (car.isPlayer && car.speed > 0.5) {
    ctx.fillStyle = `rgba(255,240,200,${0.15 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(0, -H / 2 - 8, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exhaust
  if (car.speed > 1.5) {
    ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},30,${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(-2, H / 2 + 2 + Math.random() * 3, 2 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, H / 2 + 2 + Math.random() * 3, 2 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Name tag
  if (!car.isPlayer) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 7px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(car.name, car.x, car.y - car.h / 2 - 8);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function renderMiniMap(w, h) {
  const size = Math.min(120, w * 0.16);
  const mx = w - size - 12, my = h - size - 12;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  track.center.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  const tw = maxX - minX, th = maxY - minY;
  const sc = (size - 16) / Math.max(tw, th);

  ctx.save();
  ctx.globalAlpha = 0.7;

  // BG
  roundRect(ctx, mx - 2, my - 2, size + 4, size + 4, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();

  // Track
  ctx.beginPath();
  track.center.forEach((p, i) => {
    const px = mx + 8 + (p.x - minX) * sc, py = my + 8 + (p.y - minY) * sc;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cars
  allCars.forEach(car => {
    const cx = mx + 8 + (car.x - minX) * sc, cy = my + 8 + (car.y - minY) * sc;
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.arc(cx, cy, car.isPlayer ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (car.isPlayer) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  ctx.restore();
}

/* ═══════════════════════════
   GAME FLOW
   ═══════════════════════════ */

function gameLoop() { update(); render(); if (gameRunning) requestAnimationFrame(gameLoop); }

function runCountdown() {
  return new Promise(resolve => {
    const el = document.getElementById('countdown');
    const steps = ['3', '2', '1', 'RAJT!'];
    let i = 0;
    function next() {
      if (i >= steps.length) { el.classList.remove('visible'); resolve(); return; }
      el.textContent = steps[i];
      el.classList.remove('pop'); el.classList.add('visible');
      setTimeout(() => { el.classList.add('pop'); i++; setTimeout(next, 300); }, 700);
    }
    next();
  });
}

function getTrackAngle(idx) {
  const tc = track.center;
  const i = ((idx % tc.length) + tc.length) % tc.length;
  const n = tc[(i + 1) % tc.length], c = tc[i];
  return Math.atan2(n.x - c.x, -(n.y - c.y));
}

async function startRace() {
  resizeCanvas();
  track = buildTrack(canvas.width, canvas.height);

  player = new Car('#e94560', '#ff8a9e', 'Apu', true);
  aiCars = AI_DEFS.map(d => new Car(d.color, d.stripe, d.name));
  allCars = [player, ...aiCars];

  // Grid placement
  const gridSpacing = 6;
  allCars.forEach((car, i) => {
    const idx = (track.center.length - i * gridSpacing) % track.center.length;
    const p = track.center[idx < 0 ? idx + track.center.length : idx];
    car.x = p.x + (i % 2 === 0 ? -6 : 6);
    car.y = p.y;
    car.angle = getTrackAngle(idx);
    car.speed = 0;
    car.lap = 0; car.nextCP = 1; car.cpPassed = 0;
    car.finished = false;
    car.aiTarget = Math.min(20 + i * 5, track.center.length - 1);
  });

  lapTimes = []; skidMarks = [];
  document.getElementById('hud-lap').textContent = `1 / ${TOTAL_LAPS}`;
  document.getElementById('hud-best').textContent = bestTime ? formatTime(parseFloat(bestTime)) : '--:--.-';
  document.getElementById('hud-pos').textContent = `4/${allCars.length}`;

  showScreen('game');
  render();
  await runCountdown();

  startTime = performance.now();
  gameRunning = true;
  gameLoop();
}

function finishRace() {
  gameRunning = false;
  canvas.style.transform = '';
  const total = performance.now() - startTime;
  if (!bestTime || total < parseFloat(bestTime)) { bestTime = total; localStorage.setItem('apu-gokart-best', total.toString()); }

  const pos = positions.indexOf(player) + 1;
  document.getElementById('finish-time').textContent = formatTime(total);
  document.getElementById('finish-laps').innerHTML = `
    <div style="font-size:1.3rem;color:${pos === 1 ? '#f6ad55' : '#fff'};margin-bottom:10px;">
      ${pos}. helyezés ${['', '🥇', '🥈', '🥉', ''][pos]}
    </div>
    ${lapTimes.map((t, i) => `<div>Kör ${i + 1}: ${formatTime(t)}</div>`).join('')}
  `;
  setTimeout(() => showScreen('finish'), 400);
}

function formatTime(ms) {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = Math.floor((ms % 1000) / 100);
  return `${m}:${s.toString().padStart(2, '0')}.${t}`;
}

// ─── Menu ───
document.getElementById('btn-start').addEventListener('click', startRace);
document.getElementById('btn-howto').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-howto-back').addEventListener('click', () => showScreen('title'));
document.getElementById('btn-retry').addEventListener('click', startRace);
