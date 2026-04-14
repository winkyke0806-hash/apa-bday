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
// Track drawn by user in track-editor v2 (shifted right +0.05)
const TRACK_RAW = [
  [0.54, 0.084],
  [0.489, 0.081],
  [0.421, 0.087],
  [0.384, 0.123],
  [0.371, 0.187],
  [0.374, 0.244],
  [0.382, 0.308],
  [0.38, 0.377],
  [0.369, 0.438],
  [0.355, 0.472],
  [0.329, 0.501],
  [0.30, 0.514],
  [0.268, 0.523],
  [0.239, 0.53],
  [0.215, 0.533],
  [0.201, 0.514],
  [0.188, 0.466],
  [0.182, 0.416],
  [0.175, 0.318],
  [0.153, 0.28],
  [0.126, 0.273],
  [0.095, 0.3],
  [0.078, 0.346],
  [0.073, 0.391],
  [0.07, 0.509],
  [0.068, 0.539],
  [0.068, 0.666],
  [0.072, 0.734],
  [0.082, 0.788],
  [0.091, 0.823],
  [0.103, 0.859],
  [0.122, 0.876],
  [0.149, 0.888],
  [0.785, 0.889],
  [0.928, 0.891],
  [0.95, 0.834],
  [0.96, 0.783],
  [0.955, 0.73],
  [0.941, 0.691],
  [0.914, 0.658],
  [0.868, 0.609],
  [0.807, 0.584],
  [0.76, 0.591],
  [0.721, 0.61],
  [0.678, 0.641],
  [0.638, 0.66],
  [0.599, 0.666],
  [0.564, 0.616],
  [0.563, 0.534],
  [0.591, 0.508],
  [0.629, 0.497],
  [0.658, 0.502],
  [0.674, 0.46],
  [0.684, 0.408],
  [0.688, 0.344],
  [0.695, 0.306],
  [0.717, 0.271],
  [0.741, 0.244],
  [0.763, 0.242],
  [0.778, 0.256],
  [0.784, 0.277],
  [0.811, 0.383],
  [0.821, 0.43],
  [0.832, 0.469],
  [0.847, 0.509],
  [0.87, 0.522],
  [0.895, 0.51],
  [0.917, 0.458],
  [0.919, 0.387],
  [0.918, 0.313],
  [0.908, 0.187],
  [0.891, 0.144],
  [0.871, 0.116],
  [0.841, 0.108],
  [0.735, 0.091],
  [0.646, 0.093],
];

// Decorations placed by user in deco-editor (shifted +0.05 x to match track)
const DECORATIONS_RAW = [{"type":"tire","x":0.361,"y":0.047},{"type":"tire","x":0.345,"y":0.059},{"type":"tire","x":0.353,"y":0.05},{"type":"tire","x":0.337,"y":0.07},{"type":"tire","x":0.331,"y":0.075},{"type":"tire","x":0.324,"y":0.086},{"type":"tire","x":0.32,"y":0.096},{"type":"tire","x":0.314,"y":0.108},{"type":"tire","x":0.31,"y":0.126},{"type":"tire","x":0.305,"y":0.149},{"type":"tire","x":0.308,"y":0.137},{"type":"tire","x":0.303,"y":0.167},{"type":"tire","x":0.353,"y":0.397},{"type":"tire","x":0.349,"y":0.418},{"type":"tire","x":0.345,"y":0.436},{"type":"tire","x":0.339,"y":0.457},{"type":"tire","x":0.336,"y":0.472},{"type":"tire","x":0.33,"y":0.487},{"type":"tire","x":0.323,"y":0.501},{"type":"tire","x":0.314,"y":0.514},{"type":"tire","x":0.307,"y":0.528},{"type":"tire","x":0.3,"y":0.537},{"type":"tire","x":0.005,"y":0.354},{"type":"tire","x":0.009,"y":0.333},{"type":"tire","x":0.016,"y":0.317},{"type":"tire","x":0.021,"y":0.297},{"type":"tire","x":0.027,"y":0.288},{"type":"tire","x":0.033,"y":0.278},{"type":"tire","x":0.048,"y":0.371},{"type":"tire","x":0.056,"y":0.35},{"type":"tire","x":0.064,"y":0.333},{"type":"tire","x":0.072,"y":0.326},{"type":"tire","x":0.08,"y":0.324},{"type":"tire","x":0.088,"y":0.322},{"type":"tire","x":0.097,"y":0.326},{"type":"tire","x":0.103,"y":0.345},{"type":"tire","x":0.043,"y":0.743},{"type":"tire","x":0.051,"y":0.771},{"type":"tire","x":0.047,"y":0.755},{"type":"tire","x":0.058,"y":0.791},{"type":"tire","x":0.063,"y":0.807},{"type":"tire","x":0.069,"y":0.818},{"type":"tire","x":0.076,"y":0.83},{"type":"tire","x":0.084,"y":0.83},{"type":"tire","x":0.093,"y":0.836},{"type":"tire","x":0.101,"y":0.837},{"type":"tire","x":0.11,"y":0.838},{"type":"tire","x":0.008,"y":0.784},{"type":"tire","x":0.011,"y":0.807},{"type":"tire","x":0.016,"y":0.828},{"type":"tire","x":0.022,"y":0.853},{"type":"tire","x":0.028,"y":0.87},{"type":"tire","x":0.036,"y":0.888},{"type":"tire","x":0.042,"y":0.901},{"type":"tire","x":0.053,"y":0.907},{"type":"tire","x":0.061,"y":0.914},{"type":"tire","x":0.072,"y":0.922},{"type":"tire","x":0.082,"y":0.928},{"type":"tire","x":0.095,"y":0.933},{"type":"tire","x":0.087,"y":0.934},{"type":"tire","x":0.116,"y":0.462},{"type":"tire","x":0.118,"y":0.475},{"type":"tire","x":0.119,"y":0.493},{"type":"tire","x":0.124,"y":0.512},{"type":"tire","x":0.132,"y":0.528},{"type":"tire","x":0.138,"y":0.547},{"type":"tire","x":0.145,"y":0.562},{"type":"tire","x":0.155,"y":0.572},{"type":"tire","x":0.162,"y":0.574},{"type":"tire","x":0.181,"y":0.489},{"type":"tire","x":0.174,"y":0.489},{"type":"tire","x":0.166,"y":0.48},{"type":"tire","x":0.163,"y":0.454},{"type":"tire","x":0.16,"y":0.432},{"type":"tire","x":0.041,"y":0.255},{"type":"tire","x":0.05,"y":0.245},{"type":"tire","x":0.061,"y":0.241},{"type":"tire","x":0.068,"y":0.234},{"type":"tire","x":0.079,"y":0.23},{"type":"tire","x":0.087,"y":0.23},{"type":"tire","x":0.096,"y":0.233},{"type":"tire","x":0.105,"y":0.236},{"type":"tire","x":0.114,"y":0.243},{"type":"tire","x":0.124,"y":0.253},{"type":"tire","x":0.13,"y":0.266},{"type":"tire","x":0.138,"y":0.278},{"type":"tire","x":0.145,"y":0.295},{"type":"tire","x":0.148,"y":0.313},{"type":"tire","x":0.289,"y":0.442},{"type":"tire","x":0.299,"y":0.428},{"type":"tire","x":0.303,"y":0.414},{"type":"tire","x":0.307,"y":0.392},{"type":"tire","x":0.311,"y":0.364},{"type":"tire","x":0.342,"y":0.201},{"type":"tire","x":0.348,"y":0.178},{"type":"tire","x":0.356,"y":0.151},{"type":"tire","x":0.37,"y":0.139},{"type":"tire","x":0.38,"y":0.132},{"type":"garage","x":0.268,"y":0.264},{"type":"grandstand","x":0.439,"y":0.184},{"type":"grandstand","x":0.553,"y":0.197},{"type":"tire","x":0.889,"y":0.929},{"type":"tire","x":0.899,"y":0.913},{"type":"tire","x":0.905,"y":0.892},{"type":"tire","x":0.916,"y":0.872},{"type":"tire","x":0.922,"y":0.845},{"type":"tire","x":0.929,"y":0.817},{"type":"tire","x":0.932,"y":0.789},{"type":"tire","x":0.929,"y":0.75},{"type":"tire","x":0.796,"y":0.445},{"type":"tire","x":0.803,"y":0.459},{"type":"tire","x":0.811,"y":0.466},{"type":"tire","x":0.82,"y":0.47},{"type":"tire","x":0.833,"y":0.471},{"type":"tire","x":0.839,"y":0.454},{"type":"tire","x":0.845,"y":0.43},{"type":"tire","x":0.847,"y":0.403},{"type":"tire","x":0.764,"y":0.491},{"type":"tire","x":0.77,"y":0.511},{"type":"tire","x":0.777,"y":0.53},{"type":"tire","x":0.783,"y":0.537},{"type":"tire","x":0.792,"y":0.547},{"type":"tire","x":0.797,"y":0.55},{"type":"tire","x":0.811,"y":0.563},{"type":"tire","x":0.82,"y":0.564},{"type":"tire","x":0.837,"y":0.564},{"type":"tire","x":0.832,"y":0.564},{"type":"tire","x":0.804,"y":0.557},{"type":"tire","x":0.848,"y":0.555},{"type":"tire","x":0.856,"y":0.549},{"type":"tire","x":0.864,"y":0.533},{"type":"tire","x":0.873,"y":0.514},{"type":"tire","x":0.88,"y":0.501},{"type":"tire","x":0.889,"y":0.482},{"type":"tire","x":0.891,"y":0.461},{"type":"tire","x":0.81,"y":0.154},{"type":"tire","x":0.817,"y":0.167},{"type":"tire","x":0.824,"y":0.178},{"type":"tire","x":0.827,"y":0.186},{"type":"tire","x":0.833,"y":0.201},{"type":"tire","x":0.826,"y":0.07},{"type":"tire","x":0.837,"y":0.08},{"type":"tire","x":0.847,"y":0.095},{"type":"tire","x":0.857,"y":0.105},{"type":"tire","x":0.862,"y":0.117},{"type":"tire","x":0.868,"y":0.133},{"type":"tire","x":0.874,"y":0.149},{"type":"tire","x":0.884,"y":0.172},{"type":"tire","x":0.883,"y":0.188},{"type":"tire","x":0.716,"y":0.305},{"type":"tire","x":0.708,"y":0.289},{"type":"tire","x":0.696,"y":0.295},{"type":"tire","x":0.689,"y":0.311},{"type":"tire","x":0.678,"y":0.317},{"type":"tire","x":0.668,"y":0.334},{"type":"tire","x":0.663,"y":0.353},{"type":"tire","x":0.663,"y":0.375},{"type":"tire","x":0.607,"y":0.547},{"type":"tire","x":0.622,"y":0.55},{"type":"tire","x":0.631,"y":0.528},{"type":"tire","x":0.639,"y":0.501},{"type":"tire","x":0.645,"y":0.483},{"type":"tire","x":0.611,"y":0.403},{"type":"tire","x":0.607,"y":0.417},{"type":"tire","x":0.6,"y":0.434},{"type":"tire","x":0.591,"y":0.443},{"type":"tire","x":0.58,"y":0.443},{"type":"tire","x":0.566,"y":0.449},{"type":"tire","x":0.499,"y":0.5},{"type":"tire","x":0.492,"y":0.509},{"type":"tire","x":0.487,"y":0.538},{"type":"tire","x":0.487,"y":0.563},{"type":"tire","x":0.484,"y":0.589},{"type":"tire","x":0.485,"y":0.616},{"type":"tire","x":0.489,"y":0.636},{"type":"tire","x":0.495,"y":0.654},{"type":"tire","x":0.505,"y":0.668},{"type":"tire","x":0.522,"y":0.695},{"type":"tire","x":0.514,"y":0.683},{"type":"tire","x":0.534,"y":0.712},{"type":"tire","x":0.545,"y":0.714},{"type":"tire","x":0.555,"y":0.72},{"type":"tire","x":0.548,"y":0.555},{"type":"tire","x":0.54,"y":0.563},{"type":"tire","x":0.54,"y":0.583},{"type":"tire","x":0.549,"y":0.604},{"type":"tire","x":0.563,"y":0.614},{"type":"tire","x":0.834,"y":0.672},{"type":"tire","x":0.845,"y":0.687},{"type":"tire","x":0.855,"y":0.705},{"type":"tire","x":0.865,"y":0.722},{"type":"tire","x":0.876,"y":0.753},{"type":"tire","x":0.876,"y":0.775},{"type":"tire","x":0.871,"y":0.816},{"type":"tire","x":0.874,"y":0.796},{"type":"tire","x":0.865,"y":0.838},{"type":"tire","x":0.851,"y":0.843},{"type":"tire","x":0.882,"y":0.626},{"type":"tire","x":0.892,"y":0.638},{"type":"tire","x":0.9,"y":0.649},{"type":"tire","x":0.912,"y":0.662},{"type":"tire","x":0.92,"y":0.676},{"type":"tire","x":0.929,"y":0.704},{"type":"tire","x":0.631,"y":0.264},{"type":"tire","x":0.645,"y":0.254},{"type":"tire","x":0.655,"y":0.233},{"type":"tire","x":0.664,"y":0.217},{"type":"tire","x":0.674,"y":0.208},{"type":"tire","x":0.684,"y":0.207},{"type":"tire","x":0.697,"y":0.2},{"type":"tire","x":0.709,"y":0.199},{"type":"tire","x":0.725,"y":0.203},{"type":"tire","x":0.739,"y":0.213},{"type":"tire","x":0.747,"y":0.224},{"type":"tire","x":0.749,"y":0.246},{"type":"tire","x":0.755,"y":0.266},{"type":"tire","x":0.766,"y":0.297},{"type":"tire","x":0.764,"y":0.279},{"type":"tire","x":0.77,"y":0.326}];
const DECORATIONS = DECORATIONS_RAW.map(d => ({ ...d, x: d.x + 0.05 }));

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

  // ─ Decorations ─
  renderDecorations(w, h);

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

function renderDecorations(w, h) {
  DECORATIONS.forEach(d => {
    const px = d.x * w, py = d.y * h;

    if (d.type === 'tire') {
      // Tire barrier — stacked black tires
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner ring
      ctx.strokeStyle = '#282828';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.stroke();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    else if (d.type === 'grandstand') {
      // Tribün — metal bleachers with colored dots (people)
      const gw = 70, gh = 40;
      // Structure
      ctx.fillStyle = '#444';
      ctx.fillRect(px - gw/2, py - gh/2, gw, gh);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - gw/2, py - gh/2, gw, gh);
      // Rows
      ctx.fillStyle = '#555';
      ctx.fillRect(px - gw/2, py - gh/2 + 8, gw, 2);
      ctx.fillRect(px - gw/2, py - gh/2 + 16, gw, 2);
      // People (colored dots) — more rows and columns
      const pColors = ['#e94560','#f6ad55','#3b82f6','#22c55e','#a855f7','#fff','#ff6b9d','#ffd93d'];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
          ctx.fillStyle = pColors[(row * 8 + col) % pColors.length];
          ctx.beginPath();
          ctx.arc(px - gw/2 + 6 + col * 8, py - gh/2 + 6 + row * 9, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // "GOKART GP" banner
      ctx.fillStyle = '#e94560';
      ctx.fillRect(px - gw/2, py + gh/2 + 2, gw, 10);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('GOKART GP', px, py + gh/2 + 10);
    }

    else if (d.type === 'garage') {
      // Garage/paddock — larger building with 3 bays
      const gw = 65, gh = 45;
      // Building shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px - gw/2 + 3, py - gh/2 + 3, gw, gh);
      // Building
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px - gw/2, py - gh/2, gw, gh);
      // Roof stripe
      ctx.fillStyle = '#e94560';
      ctx.fillRect(px - gw/2, py - gh/2, gw, 6);
      // 3 garage doors
      for (let i = 0; i < 3; i++) {
        const dx = px - gw/2 + 5 + i * 20;
        ctx.fillStyle = '#555';
        ctx.fillRect(dx, py - 2, 16, gh/2 + 2);
        // Door lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 0.5;
        for (let line = 0; line < 4; line++) {
          ctx.beginPath();
          ctx.moveTo(dx, py + 2 + line * 5);
          ctx.lineTo(dx + 16, py + 2 + line * 5);
          ctx.stroke();
        }
      }
      // Border
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - gw/2, py - gh/2, gw, gh);
      // Label
      ctx.fillStyle = '#f6ad55';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('⚙ PIT STOP', px, py - gh/2 - 5);
    }
  });
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
