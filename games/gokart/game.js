/* ══════════════════════════════════════════
   APU GOKART GP — Game Engine
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

// ─── Track Definition ───
// Oval track defined as inner and outer boundaries (polygon points)
// Track is centered in the canvas, scaled to fit
function generateTrack(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) * 0.42;
  const innerScale = scale * 0.52;

  const points = 64;
  const outer = [];
  const inner = [];

  for (let i = 0; i < points; i++) {
    const a = (Math.PI * 2 * i) / points;
    // Squished oval with bumps for interesting shape
    const outerR = scale * (1 + 0.15 * Math.sin(a * 2) + 0.08 * Math.cos(a * 3));
    const innerR = innerScale * (1 + 0.15 * Math.sin(a * 2) + 0.08 * Math.cos(a * 3));

    outer.push({ x: cx + Math.cos(a) * outerR, y: cy + Math.sin(a) * outerR });
    inner.push({ x: cx + Math.cos(a) * innerR, y: cy + Math.sin(a) * innerR });
  }

  // Start/finish line position
  const startAngle = 0;
  const startOuter = outer[0];
  const startInner = inner[0];

  // Checkpoints (4 quadrants)
  const checkpoints = [0, points / 4, points / 2, (points * 3) / 4].map(i => {
    const idx = Math.floor(i) % points;
    return { outer: outer[idx], inner: inner[idx] };
  });

  return { outer, inner, startOuter, startInner, checkpoints, cx, cy };
}

// ─── Car Physics ───
const CAR = {
  x: 0, y: 0, angle: 0,
  speed: 0,
  // Tuning
  maxSpeed: 5,
  acceleration: 0.12,
  braking: 0.2,
  friction: 0.97,
  turnSpeed: 0.04,
  turnFriction: 0.985, // friction when turning
  offtrackFriction: 0.92,
  width: 14,
  height: 24,
};

// ─── Input ───
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Touch
const touch = { left: false, right: false, gas: false, brake: false };
['left', 'right', 'gas', 'brake'].forEach(zone => {
  const el = document.getElementById(`touch-${zone}`);
  el.addEventListener('touchstart', e => { e.preventDefault(); touch[zone] = true; });
  el.addEventListener('touchend', e => { e.preventDefault(); touch[zone] = false; });
  el.addEventListener('touchcancel', () => touch[zone] = false);
});

function isGas() { return keys['w'] || keys['arrowup'] || touch.gas; }
function isBrake() { return keys['s'] || keys['arrowdown'] || touch.brake; }
function isLeft() { return keys['a'] || keys['arrowleft'] || touch.left; }
function isRight() { return keys['d'] || keys['arrowright'] || touch.right; }

// ─── Game State ───
let track = null;
let gameRunning = false;
let startTime = 0;
let lapTimes = [];
let currentLap = 0;
const TOTAL_LAPS = 3;
let nextCheckpoint = 0;
let checkpointsPassed = 0;
let bestTime = localStorage.getItem('apu-gokart-best') || null;

// Skid marks
let skidMarks = [];

// ─── Point-in-polygon test ───
function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isOnTrack(x, y) {
  return pointInPolygon(x, y, track.outer) && !pointInPolygon(x, y, track.inner);
}

// ─── Checkpoint/Lap detection ───
function distToLine(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function checkCheckpoints() {
  const cp = track.checkpoints[nextCheckpoint];
  const dist = distToLine(CAR.x, CAR.y, cp.outer.x, cp.outer.y, cp.inner.x, cp.inner.y);

  if (dist < 40) {
    nextCheckpoint = (nextCheckpoint + 1) % track.checkpoints.length;
    checkpointsPassed++;

    // Completed a lap?
    if (checkpointsPassed >= track.checkpoints.length) {
      checkpointsPassed = 0;
      const now = performance.now();
      const lapTime = now - (lapTimes.length > 0 ? lapTimes.reduce((a, b) => a + b, 0) + startTime : startTime);
      lapTimes.push(lapTime);
      currentLap++;

      document.getElementById('hud-lap').textContent = `${Math.min(currentLap + 1, TOTAL_LAPS)} / ${TOTAL_LAPS}`;

      if (currentLap >= TOTAL_LAPS) {
        finishRace();
      }
    }
  }
}

// ─── Update ───
function update() {
  if (!gameRunning) return;

  // Steering
  const canTurn = Math.abs(CAR.speed) > 0.3;
  if (isLeft() && canTurn) CAR.angle -= CAR.turnSpeed * (CAR.speed > 0 ? 1 : -0.5);
  if (isRight() && canTurn) CAR.angle += CAR.turnSpeed * (CAR.speed > 0 ? 1 : -0.5);

  // Acceleration / braking
  if (isGas()) CAR.speed += CAR.acceleration;
  if (isBrake()) CAR.speed -= CAR.braking;

  // Clamp speed
  CAR.speed = Math.max(-CAR.maxSpeed * 0.4, Math.min(CAR.maxSpeed, CAR.speed));

  // Friction
  const onTrack = isOnTrack(CAR.x, CAR.y);
  CAR.speed *= onTrack ? CAR.friction : CAR.offtrackFriction;

  // Turn friction (drifting)
  if ((isLeft() || isRight()) && Math.abs(CAR.speed) > 2) {
    CAR.speed *= CAR.turnFriction;

    // Skid marks
    if (Math.abs(CAR.speed) > 2.5) {
      skidMarks.push({
        x: CAR.x, y: CAR.y,
        age: 0, maxAge: 120,
      });
      if (skidMarks.length > 200) skidMarks.shift();
    }
  }

  // Move
  CAR.x += Math.sin(CAR.angle) * CAR.speed;
  CAR.y -= Math.cos(CAR.angle) * CAR.speed;

  // Track collision — push back if off outer or on inner
  if (!pointInPolygon(CAR.x, CAR.y, track.outer) || pointInPolygon(CAR.x, CAR.y, track.inner)) {
    // Push toward track center
    const dx = track.cx - CAR.x;
    const dy = track.cy - CAR.y;
    const dist = Math.hypot(dx, dy);
    CAR.x += (dx / dist) * 2;
    CAR.y += (dy / dist) * 2;
    CAR.speed *= 0.5; // wall bounce penalty
  }

  // Checkpoints
  checkCheckpoints();

  // Update time HUD
  const elapsed = performance.now() - startTime;
  document.getElementById('hud-time').textContent = formatTime(elapsed);

  // Skid mark aging
  skidMarks.forEach(m => m.age++);
  skidMarks = skidMarks.filter(m => m.age < m.maxAge);
}

// ─── Render ───
function render() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background (grass)
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, w, h);

  // Grass texture
  ctx.fillStyle = '#265422';
  for (let i = 0; i < 80; i++) {
    const gx = ((i * 137 + 50) % w);
    const gy = ((i * 191 + 30) % h);
    ctx.fillRect(gx, gy, 3, 3);
  }

  // Track (asphalt)
  ctx.save();
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();

  // Outer fill
  ctx.fillStyle = '#444';
  ctx.fill();

  // Inner cut-out (grass)
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#2d5a27';
  ctx.fill();

  // Inner grass detail
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = '#358030';
  ctx.fill();

  // Track borders
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Curbs (red-white) on outer edge
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.setLineDash([]);

  // Start/finish line
  const sf1 = track.startOuter;
  const sf2 = track.startInner;
  ctx.beginPath();
  ctx.moveTo(sf1.x, sf1.y);
  ctx.lineTo(sf2.x, sf2.y);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Skid marks
  skidMarks.forEach(m => {
    const alpha = 1 - m.age / m.maxAge;
    ctx.fillStyle = `rgba(30, 30, 30, ${alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Car
  ctx.save();
  ctx.translate(CAR.x, CAR.y);
  ctx.rotate(CAR.angle);

  // Car shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-CAR.width / 2 + 2, -CAR.height / 2 + 2, CAR.width, CAR.height);

  // Car body
  ctx.fillStyle = '#e94560';
  ctx.fillRect(-CAR.width / 2, -CAR.height / 2, CAR.width, CAR.height);

  // Windshield
  ctx.fillStyle = '#88ccff';
  ctx.fillRect(-CAR.width / 2 + 2, -CAR.height / 2 + 2, CAR.width - 4, 6);

  // Racing stripe
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1.5, -CAR.height / 2, 3, CAR.height);

  // Exhaust when accelerating
  if (isGas() && CAR.speed > 1) {
    ctx.fillStyle = `rgba(255, 150, 50, ${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, CAR.height / 2 + 4 + Math.random() * 4, 3 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Speed-dependent camera shake (subtle)
  if (CAR.speed > 4) {
    const shake = (CAR.speed - 4) * 0.3;
    canvas.style.transform = `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
  } else {
    canvas.style.transform = '';
  }

  // Mini-map (bottom-right)
  renderMiniMap(w, h);
}

function renderMiniMap(w, h) {
  const size = 100;
  const mx = w - size - 12;
  const my = h - size - 12;
  const scale = size / (Math.min(w, h) * 0.95);

  ctx.save();
  ctx.globalAlpha = 0.6;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(mx - 4, my - 4, size + 8, size + 8);

  // Track
  ctx.beginPath();
  track.outer.forEach((p, i) => {
    const px = mx + (p.x - (w - w * 0.95) / 2) * scale;
    const py = my + (p.y - (h - h * 0.95) / 2) * scale;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Car dot
  const cpx = mx + (CAR.x - (w - w * 0.95) / 2) * scale;
  const cpy = my + (CAR.y - (h - h * 0.95) / 2) * scale;
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
  ctx.fill();

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
      if (i >= steps.length) {
        el.classList.remove('visible');
        resolve();
        return;
      }
      el.textContent = steps[i];
      el.classList.remove('pop');
      el.classList.add('visible');

      setTimeout(() => {
        el.classList.add('pop');
        i++;
        setTimeout(next, 300);
      }, 700);
    }
    next();
  });
}

// ─── Start Race ───
async function startRace() {
  resizeCanvas();
  track = generateTrack(canvas.width, canvas.height);

  // Place car at start line
  const mid = {
    x: (track.startOuter.x + track.startInner.x) / 2,
    y: (track.startOuter.y + track.startInner.y) / 2,
  };
  CAR.x = mid.x;
  CAR.y = mid.y;
  CAR.angle = -Math.PI / 2; // Facing left-ish (along track)
  CAR.speed = 0;

  currentLap = 0;
  lapTimes = [];
  nextCheckpoint = 1; // Skip start checkpoint initially
  checkpointsPassed = 0;
  skidMarks = [];

  document.getElementById('hud-lap').textContent = `1 / ${TOTAL_LAPS}`;
  document.getElementById('hud-best').textContent = bestTime ? formatTime(parseFloat(bestTime)) : '--:--.-';

  showScreen('game');

  // Initial render
  render();

  await runCountdown();

  startTime = performance.now();
  gameRunning = true;
  gameLoop();
}

// ─── Finish ───
function finishRace() {
  gameRunning = false;
  canvas.style.transform = '';

  const totalTime = performance.now() - startTime;

  // Best time
  if (!bestTime || totalTime < parseFloat(bestTime)) {
    bestTime = totalTime;
    localStorage.setItem('apu-gokart-best', totalTime.toString());
  }

  document.getElementById('finish-time').textContent = formatTime(totalTime);

  const lapsEl = document.getElementById('finish-laps');
  lapsEl.innerHTML = lapTimes.map((t, i) =>
    `<div>Kör ${i + 1}: ${formatTime(t)}</div>`
  ).join('');

  setTimeout(() => showScreen('finish'), 500);
}

// ─── Helpers ───
function formatTime(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

// ─── Menu buttons ───
document.getElementById('btn-start').addEventListener('click', startRace);
document.getElementById('btn-howto').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-howto-back').addEventListener('click', () => showScreen('title'));
document.getElementById('btn-retry').addEventListener('click', startRace);
