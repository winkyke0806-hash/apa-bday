/* ══════════════════════════════════════════
   APU GOKART GP — Game Engine v2
   Custom track + AI opponents
   ══════════════════════════════════════════ */

// ─── Screens ───
const screens = {
  title: document.getElementById('title-screen'),
  howto: document.getElementById('howto-screen'),
  game: document.getElementById('game-screen'),
  finish: document.getElementById('finish-screen'),
};
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ─── Canvas ───
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Track: custom layout based on reference image ───
// Centerline waypoints — scaled to fit any screen
const TRACK_RAW = [
  // Start/finish straight (bottom)
  [0.15, 0.82], [0.30, 0.82], [0.45, 0.82], [0.58, 0.82],
  // Right turn up
  [0.68, 0.80], [0.75, 0.74], [0.78, 0.65],
  // Up right side
  [0.80, 0.55], [0.82, 0.45], [0.83, 0.35],
  // Top-right hairpin
  [0.82, 0.26], [0.78, 0.20], [0.72, 0.17], [0.65, 0.18],
  // S-curve left
  [0.58, 0.22], [0.52, 0.28], [0.48, 0.35],
  // Middle left turn
  [0.44, 0.42], [0.38, 0.45], [0.30, 0.44],
  // Left chicane
  [0.24, 0.40], [0.20, 0.34], [0.18, 0.27],
  // Top-left hairpin
  [0.18, 0.20], [0.22, 0.14], [0.28, 0.12], [0.35, 0.14],
  // Down middle section
  [0.40, 0.18], [0.43, 0.25], [0.42, 0.33],
  // Sweeping left back down
  [0.38, 0.42], [0.32, 0.50], [0.25, 0.55],
  // Lower-left turn
  [0.18, 0.58], [0.14, 0.64], [0.13, 0.72],
  // Back to start
  [0.14, 0.78], [0.15, 0.82],
];

const TRACK_WIDTH = 0.045; // fraction of min(w,h)

let track = null; // { center, outer, inner, width }
let trackLen = 0;
let trackDists = []; // cumulative distance at each waypoint

function buildTrack(w, h) {
  const s = Math.min(w, h);
  const center = TRACK_RAW.map(p => ({ x: p[0] * w, y: p[1] * h }));
  const tw = TRACK_WIDTH * s;

  // Smooth the centerline (Chaikin subdivision x2)
  let smooth = [...center];
  for (let iter = 0; iter < 2; iter++) {
    const next = [];
    for (let i = 0; i < smooth.length; i++) {
      const j = (i + 1) % smooth.length;
      const p = smooth[i], q = smooth[j];
      next.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
      next.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
    }
    smooth = next;
  }

  // Build outer/inner by offsetting normals
  const outer = [];
  const inner = [];
  for (let i = 0; i < smooth.length; i++) {
    const prev = smooth[(i - 1 + smooth.length) % smooth.length];
    const next = smooth[(i + 1) % smooth.length];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    outer.push({ x: smooth[i].x + nx * tw, y: smooth[i].y + ny * tw });
    inner.push({ x: smooth[i].x - nx * tw, y: smooth[i].y - ny * tw });
  }

  // Cumulative distances for AI path following
  const dists = [0];
  for (let i = 1; i < smooth.length; i++) {
    dists.push(dists[i - 1] + Math.hypot(smooth[i].x - smooth[i - 1].x, smooth[i].y - smooth[i - 1].y));
  }
  trackLen = dists[dists.length - 1] + Math.hypot(smooth[0].x - smooth[smooth.length - 1].x, smooth[0].y - smooth[smooth.length - 1].y);
  trackDists = dists;

  // Checkpoints at 25%, 50%, 75%, 0% of track
  const cpIndices = [0, Math.floor(smooth.length * 0.25), Math.floor(smooth.length * 0.5), Math.floor(smooth.length * 0.75)];
  const checkpoints = cpIndices.map(idx => ({
    outer: outer[idx], inner: inner[idx], center: smooth[idx]
  }));

  return { center: smooth, outer, inner, width: tw, checkpoints, startIdx: 0 };
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

// ─── Car class ───
class Car {
  constructor(color, name, isPlayer = false) {
    this.x = 0; this.y = 0; this.angle = 0; this.speed = 0;
    this.color = color;
    this.name = name;
    this.isPlayer = isPlayer;
    this.maxSpeed = isPlayer ? 5.2 : 4.2 + Math.random() * 1.2;
    this.accel = isPlayer ? 0.13 : 0.10 + Math.random() * 0.04;
    this.friction = 0.97;
    this.offFriction = 0.91;
    this.turnSpeed = isPlayer ? 0.045 : 0.04;
    this.w = 12; this.h = 22;
    // Race state
    this.lap = 0;
    this.nextCP = 0;
    this.cpPassed = 0;
    this.finished = false;
    this.finishTime = 0;
    // AI
    this.aiTarget = 0; // index into track.center
    this.aiOffset = (Math.random() - 0.5) * 0.6; // lateral offset for variety
  }
}

// ─── Input ───
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
const touch = { left: false, right: false, gas: false, brake: false };
['left', 'right', 'gas', 'brake'].forEach(zone => {
  const el = document.getElementById(`touch-${zone}`);
  if (!el) return;
  el.addEventListener('touchstart', e => { e.preventDefault(); touch[zone] = true; });
  el.addEventListener('touchend', e => { e.preventDefault(); touch[zone] = false; });
  el.addEventListener('touchcancel', () => touch[zone] = false);
});
function isGas() { return keys['w'] || keys['arrowup'] || touch.gas; }
function isBrake() { return keys['s'] || keys['arrowdown'] || touch.brake; }
function isLeft() { return keys['a'] || keys['arrowleft'] || touch.left; }
function isRight() { return keys['d'] || keys['arrowright'] || touch.right; }

// ─── Game state ───
let player = null;
let aiCars = [];
let allCars = [];
let gameRunning = false;
let startTime = 0;
let lapTimes = [];
const TOTAL_LAPS = 3;
let bestTime = localStorage.getItem('apu-gokart-best') || null;
let skidMarks = [];
let positions = []; // sorted by race progress

const AI_COLORS = ['#3b82f6', '#22c55e', '#a855f7'];
const AI_NAMES = ['Kék Villám', 'Zöld Szörny', 'Lila Rakéta'];

// ─── Checkpoint detection ───
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function checkCarCheckpoints(car) {
  if (car.finished) return;
  const cp = track.checkpoints[car.nextCP];
  if (distToSeg(car.x, car.y, cp.outer.x, cp.outer.y, cp.inner.x, cp.inner.y) < track.width * 1.5) {
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

// ─── AI logic ───
function updateAI(car) {
  if (car.finished) { car.speed *= 0.98; return; }

  const tc = track.center;
  const target = tc[car.aiTarget];

  // Steer toward target with lateral offset
  const prev = tc[(car.aiTarget - 1 + tc.length) % tc.length];
  const next = tc[(car.aiTarget + 1) % tc.length];
  const tdx = next.x - prev.x, tdy = next.y - prev.y;
  const tl = Math.hypot(tdx, tdy) || 1;
  const offX = target.x + (-tdy / tl) * track.width * car.aiOffset;
  const offY = target.y + (tdx / tl) * track.width * car.aiOffset;

  const dx = offX - car.x;
  const dy = offY - car.y;
  const targetAngle = Math.atan2(dx, -dy);
  let angleDiff = targetAngle - car.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Steer
  if (Math.abs(car.speed) > 0.2) {
    car.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), car.turnSpeed * 1.2);
  }

  // Speed control — slow in turns
  const turnSharpness = Math.abs(angleDiff);
  const targetSpeed = turnSharpness > 0.3 ? car.maxSpeed * 0.55 : car.maxSpeed * (0.85 + Math.random() * 0.15);
  if (car.speed < targetSpeed) car.speed += car.accel;
  else car.speed *= 0.96;

  // Advance target
  if (Math.hypot(dx, dy) < track.width * 1.2) {
    car.aiTarget = (car.aiTarget + 1) % tc.length;
  }

  // Move
  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  // Track constraint
  if (!isOnTrack(car.x, car.y)) {
    const cx = track.center[car.aiTarget].x;
    const cy = track.center[car.aiTarget].y;
    const d = Math.hypot(cx - car.x, cy - car.y) || 1;
    car.x += (cx - car.x) / d * 3;
    car.y += (cy - car.y) / d * 3;
    car.speed *= 0.6;
  }
}

// ─── Update player ───
function updatePlayer(car) {
  const canTurn = Math.abs(car.speed) > 0.3;
  if (isLeft() && canTurn) car.angle -= car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isRight() && canTurn) car.angle += car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isGas()) car.speed += car.accel;
  if (isBrake()) car.speed -= 0.2;
  car.speed = Math.max(-car.maxSpeed * 0.35, Math.min(car.maxSpeed, car.speed));

  const onTrack = isOnTrack(car.x, car.y);
  car.speed *= onTrack ? car.friction : car.offFriction;

  if ((isLeft() || isRight()) && Math.abs(car.speed) > 2) {
    car.speed *= 0.985;
    if (Math.abs(car.speed) > 2.5) {
      skidMarks.push({ x: car.x, y: car.y, age: 0 });
      if (skidMarks.length > 300) skidMarks.shift();
    }
  }

  car.x += Math.sin(car.angle) * car.speed;
  car.y -= Math.cos(car.angle) * car.speed;

  // Wall collision
  if (!isOnTrack(car.x, car.y)) {
    const nearest = findNearestCenter(car.x, car.y);
    const d = Math.hypot(nearest.x - car.x, nearest.y - car.y) || 1;
    car.x += (nearest.x - car.x) / d * 2.5;
    car.y += (nearest.y - car.y) / d * 2.5;
    car.speed *= 0.4;
  }
}

function findNearestCenter(x, y) {
  let best = track.center[0], bestD = Infinity;
  for (const p of track.center) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// ─── Car-car collision ───
function carCollisions() {
  for (let i = 0; i < allCars.length; i++) {
    for (let j = i + 1; j < allCars.length; j++) {
      const a = allCars[i], b = allCars[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18 && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const push = (18 - dist) / 2;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        a.speed *= 0.85; b.speed *= 0.85;
      }
    }
  }
}

// ─── Positions ───
function updatePositions() {
  positions = [...allCars].sort((a, b) => {
    if (a.lap !== b.lap) return b.lap - a.lap;
    if (a.cpPassed !== b.cpPassed) return b.cpPassed - a.cpPassed;
    // Same checkpoint — who's closer to next?
    const cpA = track.checkpoints[a.nextCP]?.center || track.center[0];
    const cpB = track.checkpoints[b.nextCP]?.center || track.center[0];
    return Math.hypot(a.x - cpA.x, a.y - cpA.y) - Math.hypot(b.x - cpB.x, b.y - cpB.y);
  });
}

// ─── Main update ───
function update() {
  if (!gameRunning) return;
  updatePlayer(player);
  aiCars.forEach(updateAI);
  carCollisions();
  allCars.forEach(checkCarCheckpoints);
  updatePositions();

  // HUD
  const elapsed = performance.now() - startTime;
  document.getElementById('hud-time').textContent = formatTime(elapsed);
  const pos = positions.indexOf(player) + 1;
  document.getElementById('hud-pos').textContent = `${pos}. hely`;

  // Skid aging
  skidMarks.forEach(m => m.age++);
  skidMarks = skidMarks.filter(m => m.age < 120);
}

// ─── Render ───
function render() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Grass
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#265422';
  for (let i = 0; i < 100; i++) {
    ctx.fillRect((i * 137 + 50) % w, (i * 191 + 30) % h, 2, 2);
  }

  // Track asphalt
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#3a3a3a';
  ctx.fill();

  // Inner grass
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#2d5a27';
  ctx.fill();
  ctx.fillStyle = '#358030';
  ctx.fill();

  // Track center line (dashed)
  ctx.beginPath();
  track.center.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.setLineDash([8, 12]);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // Borders
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.stroke();

  // Curbs on outer
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Start/finish line
  const s0 = track.outer[0], s1 = track.inner[0];
  ctx.beginPath();
  ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Skid marks
  skidMarks.forEach(m => {
    ctx.fillStyle = `rgba(30,30,30,${(1 - m.age / 120) * 0.35})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Render all cars (sorted by Y for depth)
  const sorted = [...allCars].sort((a, b) => a.y - b.y);
  sorted.forEach(car => renderCar(car));

  // Camera shake
  if (player.speed > 4) {
    const s = (player.speed - 4) * 0.3;
    canvas.style.transform = `translate(${(Math.random() - 0.5) * s}px, ${(Math.random() - 0.5) * s}px)`;
  } else {
    canvas.style.transform = '';
  }

  // Mini-map
  renderMiniMap(w, h);
}

function renderCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-car.w / 2 + 2, -car.h / 2 + 2, car.w, car.h);

  // Body
  ctx.fillStyle = car.color;
  ctx.fillRect(-car.w / 2, -car.h / 2, car.w, car.h);

  // Windshield
  ctx.fillStyle = '#88ccff';
  ctx.fillRect(-car.w / 2 + 2, -car.h / 2 + 2, car.w - 4, 5);

  // Stripe
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(-1, -car.h / 2, 2, car.h);

  // Exhaust for player
  if (car.isPlayer && isGas() && car.speed > 1) {
    ctx.fillStyle = `rgba(255,150,50,${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, car.h / 2 + 3 + Math.random() * 3, 2.5 + Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Name tag for AI
  if (!car.isPlayer) {
    ctx.rotate(-car.angle); // Un-rotate for text
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '7px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(car.name, 0, -car.h / 2 - 6);
  }

  ctx.restore();
}

function renderMiniMap(w, h) {
  const size = Math.min(110, w * 0.15);
  const mx = w - size - 10, my = h - size - 10;
  const pad = 8;

  // Bounding box of track
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  track.center.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  const tw = maxX - minX, th = maxY - minY;
  const sc = (size - pad * 2) / Math.max(tw, th);

  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(mx, my, size, size);

  // Track outline
  ctx.beginPath();
  track.center.forEach((p, i) => {
    const px = mx + pad + (p.x - minX) * sc;
    const py = my + pad + (p.y - minY) * sc;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 2;
  ctx.stroke();

  // All car dots
  allCars.forEach(car => {
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.arc(mx + pad + (car.x - minX) * sc, my + pad + (car.y - minY) * sc, car.isPlayer ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ─── Game Loop ───
function gameLoop() {
  update();
  render();
  if (gameRunning) requestAnimationFrame(gameLoop);
}

// ─── Countdown ───
function runCountdown() {
  return new Promise(resolve => {
    const el = document.getElementById('countdown');
    const steps = ['3', '2', '1', 'RAJT!'];
    let i = 0;
    function next() {
      if (i >= steps.length) { el.classList.remove('visible'); resolve(); return; }
      el.textContent = steps[i];
      el.classList.remove('pop');
      el.classList.add('visible');
      setTimeout(() => { el.classList.add('pop'); i++; setTimeout(next, 300); }, 700);
    }
    next();
  });
}

// ─── Start Race ───
async function startRace() {
  resizeCanvas();
  track = buildTrack(canvas.width, canvas.height);

  // Create cars
  player = new Car('#e94560', 'Apu', true);
  aiCars = AI_COLORS.map((c, i) => new Car(c, AI_NAMES[i]));
  allCars = [player, ...aiCars];

  // Place on start grid (staggered)
  const startPts = [0, 2, 4, 6].map(i => {
    const idx = (track.center.length - i) % track.center.length;
    return track.center[idx];
  });

  allCars.forEach((car, i) => {
    const p = startPts[i];
    car.x = p.x + (i % 2 === 0 ? -8 : 8);
    car.y = p.y;
    car.angle = getTrackAngle(track.center.length - i * 2);
    car.speed = 0;
    car.lap = 0;
    car.nextCP = 1;
    car.cpPassed = 0;
    car.finished = false;
    car.aiTarget = 10 + i * 3; // stagger AI targets
  });

  lapTimes = [];
  skidMarks = [];

  document.getElementById('hud-lap').textContent = `1 / ${TOTAL_LAPS}`;
  document.getElementById('hud-best').textContent = bestTime ? formatTime(parseFloat(bestTime)) : '--:--.-';
  document.getElementById('hud-pos').textContent = '4. hely';

  showScreen('game');
  render();
  await runCountdown();

  startTime = performance.now();
  gameRunning = true;
  gameLoop();
}

function getTrackAngle(idx) {
  const tc = track.center;
  const i = ((idx % tc.length) + tc.length) % tc.length;
  const next = tc[(i + 1) % tc.length];
  const cur = tc[i];
  return Math.atan2(next.x - cur.x, -(next.y - cur.y));
}

// ─── Finish ───
function finishRace() {
  gameRunning = false;
  canvas.style.transform = '';
  const totalTime = performance.now() - startTime;

  if (!bestTime || totalTime < parseFloat(bestTime)) {
    bestTime = totalTime;
    localStorage.setItem('apu-gokart-best', totalTime.toString());
  }

  const pos = positions.indexOf(player) + 1;
  document.getElementById('finish-time').textContent = formatTime(totalTime);

  const lapsEl = document.getElementById('finish-laps');
  lapsEl.innerHTML = `
    <div style="font-size:1.2rem; color:${pos === 1 ? '#f6ad55' : '#fff'}; margin-bottom:8px;">
      ${pos}. helyezés ${pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : ''}
    </div>
    ${lapTimes.map((t, i) => `<div>Kör ${i + 1}: ${formatTime(t)}</div>`).join('')}
  `;

  setTimeout(() => showScreen('finish'), 500);
}

// ─── Helpers ───
function formatTime(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

// ─── Menu ───
document.getElementById('btn-start').addEventListener('click', startRace);
document.getElementById('btn-howto').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-howto-back').addEventListener('click', () => showScreen('title'));
document.getElementById('btn-retry').addEventListener('click', startRace);
