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
// Track drawn by user in track-editor
const TRACK_RAW = [
  [0.498, 0.125],
  [0.455, 0.125],
  [0.439, 0.167],
  [0.437, 0.222],
  [0.438, 0.273],
  [0.438, 0.329],
  [0.435, 0.389],
  [0.426, 0.41],
  [0.413, 0.434],
  [0.398, 0.458],
  [0.384, 0.467],
  [0.371, 0.476],
  [0.355, 0.491],
  [0.345, 0.491],
  [0.33, 0.493],
  [0.297, 0.497],
  [0.275, 0.487],
  [0.271, 0.442],
  [0.264, 0.402],
  [0.259, 0.355],
  [0.255, 0.323],
  [0.255, 0.292],
  [0.256, 0.26],
  [0.242, 0.239],
  [0.22, 0.244],
  [0.204, 0.26],
  [0.197, 0.292],
  [0.191, 0.352],
  [0.193, 0.437],
  [0.191, 0.492],
  [0.192, 0.543],
  [0.195, 0.597],
  [0.202, 0.639],
  [0.216, 0.65],
  [0.253, 0.66],
  [0.286, 0.659],
  [0.321, 0.656],
  [0.353, 0.658],
  [0.378, 0.666],
  [0.407, 0.662],
  [0.441, 0.656],
  [0.47, 0.663],
  [0.495, 0.662],
  [0.532, 0.66],
  [0.566, 0.659],
  [0.608, 0.66],
  [0.643, 0.656],
  [0.679, 0.641],
  [0.689, 0.612],
  [0.689, 0.571],
  [0.687, 0.531],
  [0.681, 0.501],
  [0.671, 0.481],
  [0.653, 0.475],
  [0.637, 0.476],
  [0.622, 0.473],
  [0.603, 0.481],
  [0.585, 0.485],
  [0.568, 0.498],
  [0.553, 0.512],
  [0.534, 0.516],
  [0.514, 0.497],
  [0.506, 0.442],
  [0.518, 0.398],
  [0.535, 0.381],
  [0.551, 0.36],
  [0.572, 0.355],
  [0.597, 0.358],
  [0.621, 0.368],
  [0.634, 0.379],
  [0.652, 0.379],
  [0.67, 0.364],
  [0.672, 0.334],
  [0.672, 0.302],
  [0.673, 0.235],
  [0.667, 0.198],
  [0.655, 0.176],
  [0.64, 0.16],
  [0.631, 0.15],
  [0.613, 0.141],
  [0.6, 0.131],
  [0.585, 0.129],
  [0.576, 0.129],
  [0.565, 0.133],
  [0.526, 0.129],
  [0.499, 0.127],
];

const TRACK_HALF_W = 0.042; // half-width — wide enough for 2 cars side by side

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
    this.maxSpeed = isPlayer ? 5.0 : 3.2 + Math.random() * 0.6;
    this.accel = isPlayer ? 0.14 : 0.07 + Math.random() * 0.03;
    this.friction = 0.975; this.offFriction = 0.88;
    this.turnSpeed = isPlayer ? 0.07 : 0.045;
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

  const prevX = car.x, prevY = car.y;
  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  if (!isOnTrack(car.x, car.y)) {
    // Revert to previous position
    car.x = prevX;
    car.y = prevY;
    // Bounce: reverse a bit and slow down
    car.x -= Math.sin(car.angle) * 1.5;
    car.y += Math.cos(car.angle) * 1.5;
    car.speed *= -0.2; // slight bounce back
    // Also nudge toward nearest track center
    const p = track.center[findNearestIdx(car.x, car.y)];
    const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 1.5;
    car.y += (p.y - car.y) / d * 1.5;
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

  const aPrevX = car.x, aPrevY = car.y;
  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  if (!isOnTrack(car.x, car.y)) {
    car.x = aPrevX; car.y = aPrevY;
    const p = tc[car.aiTarget];
    const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 2;
    car.y += (p.y - car.y) / d * 2;
    car.speed *= 0.4;
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

  // ─ INDOOR: Concrete floor ─
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, w, h);

  // Floor texture (concrete panels)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Subtle floor stains
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = i % 2 ? '#1a1a1a' : '#333';
    ctx.beginPath();
    ctx.arc((i * 211 + 47) % w, (i * 157 + 83) % h, 5 + (i % 8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ─ Track surface (smoother asphalt) ─
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#3d3d3d';
  ctx.fill();

  // Inner cutout (concrete island)
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#2a2a2a';
  ctx.fill();

  // ─ Track borders: solid barriers (indoor walls) ─
  // Outer wall (thick, industrial)
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 5;
  ctx.stroke();
  // Bright safety line on wall
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner wall
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#f6ad55';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ─ Center dashes ─
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  track.center.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // ─ Start/finish line ─
  const s0 = track.outer[0], s1 = track.inner[0];
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

  // ─ Indoor details: neon strip lights along outer wall ─
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < track.outer.length; i += 2) {
    const p = track.outer[i];
    ctx.fillStyle = i % 20 < 10 ? '#00ffff' : '#ff00ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

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
