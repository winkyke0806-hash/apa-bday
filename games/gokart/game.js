/* ══════════════════════════════════════════════════════
   APU GOKART GP — TURBO EDITION v3.0
   Modular architecture
   ══════════════════════════════════════════════════════ */

import { G } from './src/state.js';
import { TRACKS, TRACK_LIST, buildTrackFromData, isOnTrack, findNearestIdx, distToSeg, getTrackAngle } from './src/tracks.js';
import { initAudio, sfxBoost, sfxNitro, sfxCollision, sfxLap, sfxCountdown, sfxGo, sfxPowerup } from './src/audio.js';
import { spawnDriftSmoke, spawnSparks, spawnNitroFlame, updateParticles } from './src/particles.js';
import { isGas, isBrake, isLeft, isRight, keys } from './src/input.js';
import { Car, AI_DEFS, AI_PERSONALITIES, SIZE_DEFS } from './src/car.js';
import { spawnPowerups, updatePowerups, usePowerup, hidePowerupHUD } from './src/powerups.js';
import { render } from './src/render.js';
import { initRain, updateRain, renderRain, addComment, updateCommentary, runFlyover, startVictoryDonuts, updateVictoryDonuts } from './src/effects.js';

// ─── DOM ───
G.canvas = document.getElementById('game-canvas');
G.ctx = G.canvas.getContext('2d');

function resizeCanvas() { G.canvas.width = window.innerWidth; G.canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Screens ───
const screens = { title: 'title-screen', howto: 'howto-screen', garage: 'garage-screen', trackspin: 'trackspin-screen', finalize: 'finalize-screen', game: 'game-screen', finish: 'finish-screen' };
function showScreen(n) {
  Object.values(screens).forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(screens[n]).classList.add('active');
}

// ─── Format time ───
function formatTime(ms) {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = Math.floor((ms % 1000) / 100);
  return `${m}:${s.toString().padStart(2, '0')}.${t}`;
}

// ─── Lap notify ───
function showLapNotify(msg) {
  const el = document.getElementById('lap-notify');
  el.textContent = typeof msg === 'number' ? `KÖR ${msg + 1} / ${G.TOTAL_LAPS}` : msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);
}

// ─── Nitro ───
function activateNitro() {
  if (G.player.nitro < 100 || G.player.nitroActive) return;
  G.player.nitroActive = true; G.player.nitro = 100;
  sfxNitro();
  let frames = 0;
  function tick() {
    if (!G.gameRunning || frames > 60) { G.player.nitroActive = false; return; }
    G.player.speed = Math.min(G.player.speed + 0.15, G.player.maxSpeed * 1.4);
    spawnNitroFlame(G.player);
    G.player.nitro = Math.max(0, 100 - (frames / 60) * 100);
    document.getElementById('nitro-bar').style.width = G.player.nitro + '%';
    frames++;
    requestAnimationFrame(tick);
  }
  tick();
}

// ─── Space key: nitro or powerup ───
window.addEventListener('keydown', e => {
  if (e.key === ' ' && G.gameRunning) {
    e.preventDefault();
    if (G.player.nitro >= 100) activateNitro(); else usePowerup();
  }
  if (G.turboStartWindow && (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')) {
    G.turboStartUsed = true;
  }
});

// ─── Checkpoint detection ───
function checkCarCP(car) {
  if (car.finished) return;
  const cp = G.track.checkpoints[car.nextCP];
  if (distToSeg(car.x, car.y, cp.outer.x, cp.outer.y, cp.inner.x, cp.inner.y) < G.track.hw * 1.8) {
    car.nextCP = (car.nextCP + 1) % G.track.checkpoints.length;
    car.cpPassed++;
    if (car.cpPassed >= G.track.checkpoints.length) {
      car.cpPassed = 0; car.lap++;
      if (car.isPlayer) {
        const now = performance.now();
        const lt = now - (G.lapTimes.length > 0 ? G.lapTimes.reduce((a, b) => a + b, 0) + G.startTime : G.startTime);
        G.lapTimes.push(lt);
        document.getElementById('hud-lap').textContent = `${Math.min(car.lap + 1, G.TOTAL_LAPS)} / ${G.TOTAL_LAPS}`;
        sfxLap();
        if (G.lapTimes.length >= 2) {
          const cur = G.lapTimes[G.lapTimes.length - 1], prev = G.lapTimes[G.lapTimes.length - 2];
          const diff = cur - prev, sign = diff < 0 ? '🟢 -' : '🔴 +';
          showLapNotify(`KÖR ${car.lap}/${G.TOTAL_LAPS} — ${sign}${formatTime(Math.abs(diff))}`);
        } else showLapNotify(car.lap);
      }
      if (car.lap >= G.TOTAL_LAPS) {
        car.finished = true; car.finishTime = performance.now() - G.startTime;
        if (car.isPlayer) finishRace();
      }
    }
  }
}

// ─── Player update ───
function updatePlayer(car) {
  const ct = Math.abs(car.speed) > 0.3;
  if (isLeft() && ct) car.angle -= car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isRight() && ct) car.angle += car.turnSpeed * (car.speed > 0 ? 1 : -0.5);
  if (isGas()) car.speed += car.accel;
  if (isBrake()) car.speed -= 0.22;
  car.speed = Math.max(-car.maxSpeed * 0.3, Math.min(car.nitroActive ? car.maxSpeed * 1.4 : car.maxSpeed, car.speed));
  car.speed *= isOnTrack(car.x, car.y, G.track) ? car.friction : car.offFriction;

  if (car.shieldTimer > 0) car.shieldTimer--;

  const drifting = (isLeft() || isRight()) && Math.abs(car.speed) > 2.2;
  if (drifting) {
    car.speed *= 0.984; car.totalDrift += Math.abs(car.speed) * 0.5;
    if (!car.nitroActive) { car.nitro = Math.min(100, car.nitro + 0.4); document.getElementById('nitro-bar').style.width = car.nitro + '%'; }
    spawnDriftSmoke(car);
    G.skidMarks.push({ x: car.x - Math.sin(car.angle) * 5, y: car.y + Math.cos(car.angle) * 5, age: 0 });
    if (G.skidMarks.length > 500) G.skidMarks.splice(0, 2);
  }

  const prevX = car.x, prevY = car.y;
  car.x += Math.sin(car.angle) * car.speed; car.y -= Math.cos(car.angle) * car.speed;

  if (!isOnTrack(car.x, car.y, G.track)) {
    if (car.shieldTimer > 0) { car.shieldTimer = 0; car.speed *= 0.5; }
    else {
      car.x = prevX; car.y = prevY;
      car.x -= Math.sin(car.angle) * 1.5; car.y += Math.cos(car.angle) * 1.5;
      car.speed *= -0.2; car.collisions++;
      sfxCollision(); spawnSparks(car.x, car.y);
    }
    const p = G.track.center[findNearestIdx(car.x, car.y, G.track)];
    const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 1.5; car.y += (p.y - car.y) / d * 1.5;
  }

  document.getElementById('speedo-value').textContent = Math.round(Math.abs(car.speed) * 40);
}

// ─── AI update ───
function updateAI(car) {
  if (car.finished) { car.speed *= 0.97; return; }
  const tc = G.track.center, tgt = tc[car.aiTarget];
  const prev = tc[(car.aiTarget - 1 + tc.length) % tc.length], nxt = tc[(car.aiTarget + 1) % tc.length];
  const tdx = nxt.x - prev.x, tdy = nxt.y - prev.y, tl = Math.hypot(tdx, tdy) || 1;
  const ox = tgt.x + (-tdy / tl) * G.track.hw * car.aiOffset;
  const oy = tgt.y + (tdx / tl) * G.track.hw * car.aiOffset;
  const dx = ox - car.x, dy = oy - car.y;
  let ta = Math.atan2(dx, -dy), diff = ta - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(car.speed) > 0.2) car.angle += Math.sign(diff) * Math.min(Math.abs(diff), car.turnSpeed * 1.3);
  const sharp = Math.abs(diff);
  const ts = sharp > 0.4 ? car.maxSpeed * 0.5 : sharp > 0.15 ? car.maxSpeed * 0.75 : car.maxSpeed * (0.88 + Math.random() * 0.12);
  if (car.speed < ts) car.speed += car.accel; else car.speed *= 0.95;
  if (Math.hypot(dx, dy) < G.track.hw * 1.5) car.aiTarget = (car.aiTarget + 1) % tc.length;
  const apx = car.x, apy = car.y;
  car.x += Math.sin(car.angle) * car.speed; car.y -= Math.cos(car.angle) * car.speed;
  if (!isOnTrack(car.x, car.y, G.track)) {
    car.x = apx; car.y = apy;
    const p = tc[car.aiTarget]; const d = Math.hypot(p.x - car.x, p.y - car.y) || 1;
    car.x += (p.x - car.x) / d * 2; car.y += (p.y - car.y) / d * 2; car.speed *= 0.4;
  }
}

// ─── Collisions + positions ───
function carCollisions() {
  for (let i = 0; i < G.allCars.length; i++) for (let j = i + 1; j < G.allCars.length; j++) {
    const a = G.allCars[i], b = G.allCars[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (dist < 16 && dist > 0) { const nx = dx / dist, ny = dy / dist, push = (16 - dist) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push; a.speed *= 0.8; b.speed *= 0.8; }
  }
}

function updatePositions() {
  G.positions = [...G.allCars].sort((a, b) => {
    if (a.lap !== b.lap) return b.lap - a.lap; if (a.cpPassed !== b.cpPassed) return b.cpPassed - a.cpPassed;
    const ca = G.track.checkpoints[a.nextCP]?.center || G.track.center[0], cb = G.track.checkpoints[b.nextCP]?.center || G.track.center[0];
    return Math.hypot(a.x - ca.x, a.y - ca.y) - Math.hypot(b.x - cb.x, b.y - cb.y);
  });
}

// ─── Main update ───
function update() {
  if (!G.gameRunning) return;
  updatePlayer(G.player);
  G.aiCars.forEach(updateAI);
  carCollisions();
  G.allCars.forEach(checkCarCP);
  updatePositions();
  updatePowerups();
  updateParticles();

  document.getElementById('hud-time').textContent = formatTime(performance.now() - G.startTime);
  const curPos = G.positions.indexOf(G.player) + 1;
  document.getElementById('hud-pos').textContent = `${curPos}/${G.allCars.length}`;

  if (curPos !== G.lastPosition) { if (curPos < G.lastPosition) showLapNotify(`↑ ${curPos}. hely!`); G.lastPosition = curPos; }

  // Slipstream
  G.aiCars.forEach(ai => {
    const dx = ai.x - G.player.x, dy = ai.y - G.player.y, dist = Math.hypot(dx, dy);
    let ad = Math.atan2(dx, -dy) - G.player.angle;
    while (ad > Math.PI) ad -= Math.PI * 2; while (ad < -Math.PI) ad += Math.PI * 2;
    if (dist < 60 && dist > 15 && Math.abs(ad) < 0.4) G.player.speed += 0.02;
  });

  // Rubber banding
  if (curPos === G.allCars.length && G.player.lap < G.TOTAL_LAPS - 1) {
    G.aiCars.forEach(ai => { if (!ai.finished) ai.speed *= 0.995; });
  }

  // Ghost recording
  if (G.ghostData.length < 100000) G.ghostData.push({ x: G.player.x, y: G.player.y, angle: G.player.angle });

  // Weather
  updateRain(G.canvas.width, G.canvas.height);

  // Rain makes track slippery
  if (G.weather === 'rain') {
    G.player.friction = 0.96; // more slippery
    G.player.turnSpeed = G.player.isPlayer ? 0.055 : G.player.turnSpeed; // harder to steer
  }

  // Commentary triggers
  updateCommentary();
  // Drift comment
  if (G.player.driftScore > 100 && G.player.driftScore < 105) addComment('drift');
  // Collision comment
  if (G.player.collisions > 0 && G.player.collisions !== G._lastCollCount) {
    addComment('collision');
    G._lastCollCount = G.player.collisions;
  }
  // Position change → overtake
  if (curPos < G.lastPosition && curPos <= 2) addComment('overtake');
  // Lead
  if (curPos === 1 && G.lastPosition !== 1) addComment('lead');

  // Victory donuts
  updateVictoryDonuts();

  G.skidMarks.forEach(m => m.age++);
  G.skidMarks = G.skidMarks.filter(m => m.age < 150);
}

// ─── Game loop ───
function gameLoop() { update(); render(); if (G.gameRunning) requestAnimationFrame(gameLoop); }

// ─── Countdown ───
function runCountdown() {
  return new Promise(resolve => {
    const el = document.getElementById('countdown');
    const steps = ['3', '2', '1', 'RAJT!'];
    let i = 0;
    G.turboStartWindow = false; G.turboStartUsed = false;

    function flashScreen() {
      const flash = document.createElement('div');
      flash.className = 'countdown-flash';
      document.getElementById('game-screen').appendChild(flash);
      setTimeout(() => flash.remove(), 300);
    }

    function next() {
      if (i >= steps.length) {
        el.classList.remove('visible', 'go-text');
        if (G.turboStartUsed) {
          G.player.speed = G.player.maxSpeed * 0.6; sfxBoost();
          for (let j = 0; j < 15; j++) spawnSparks(G.player.x, G.player.y);
          showLapNotify('⚡ TURBO START!');
        }
        G.turboStartWindow = false; resolve(); return;
      }

      el.textContent = steps[i];
      el.classList.remove('pop', 'go-text');
      el.classList.add('visible');
      if (i === 3) el.classList.add('go-text');

      flashScreen();
      if (i < 3) sfxCountdown(); else { sfxGo(); G.turboStartWindow = true; }

      setTimeout(() => {
        el.classList.add('pop');
        i++;
        setTimeout(next, 350);
      }, 750);
    }
    next();
  });
}

// ─── Start Race ───
async function startRace() {
  initAudio(); resizeCanvas();

  const trackDef = TRACKS[G.currentTrackId];
  G.track = buildTrackFromData(trackDef.data, G.canvas.width, G.canvas.height, G.reverseMode);

  const sd = SIZE_DEFS[G.garageState.size];
  G.player = new Car(G.garageState.bodyColor, G.garageState.stripeColor, G.garageState.name, true);
  G.player.w = sd.w; G.player.h = sd.h; G.player.maxSpeed = sd.maxSpeed; G.player.accel = sd.accel; G.player.turnSpeed = sd.turnSpeed;

  const diffMult = { easy: 0.75, normal: 0.9, hard: 1.05 };
  const dm = diffMult[G.difficulty];
  G.aiCars = AI_DEFS.map(d => {
    const c = new Car(d.color, d.stripe, d.name);
    c.maxSpeed *= dm;
    c.accel *= dm;
    // Apply personality
    const pers = AI_PERSONALITIES[d.personality] || {};
    c.maxSpeed *= pers.speedMult || 1;
    c.turnSpeed *= pers.turnMult || 1;
    c.personality = d.personality;
    return c;
  });
  G.allCars = [G.player, ...G.aiCars];

  G.allCars.forEach((car, i) => {
    const idx = (G.track.center.length - i * 6) % G.track.center.length;
    const p = G.track.center[idx < 0 ? idx + G.track.center.length : idx];
    car.x = p.x + (i % 2 === 0 ? -6 : 6); car.y = p.y;
    car.angle = getTrackAngle(idx, G.track); car.speed = 0;
    car.lap = 0; car.nextCP = 1; car.cpPassed = 0; car.finished = false;
    car.aiTarget = Math.min(20 + i * 5, G.track.center.length - 1);
  });

  G.lapTimes = []; G.skidMarks = []; G.particles = []; G.oilSlicks = []; G.playerPowerup = null;
  G.ghostData = []; G.ghostFrame = 0; G.lastPosition = 4;
  hidePowerupHUD(); G.player.nitro = 0;
  document.getElementById('nitro-bar').style.width = '0%';
  spawnPowerups();
  // Load ghost for THIS track only
  const ghostKey = `apu-gokart-ghost-${G.currentTrackId}${G.reverseMode ? '-rev' : ''}`;
  try { G.ghostPlayback = JSON.parse(localStorage.getItem(ghostKey) || '[]'); } catch { G.ghostPlayback = []; }

  G.camera.x = G.player.x; G.camera.y = G.player.y; G.camera.zoom = 2.2;
  G._lastCollCount = 0;
  G.donutMode = false;

  // Init weather
  if (G.weather === 'rain') initRain(G.canvas.width, G.canvas.height);

  document.getElementById('hud-lap').textContent = `1 / ${G.TOTAL_LAPS}`;
  document.getElementById('hud-best').textContent = G.bestTime ? formatTime(parseFloat(G.bestTime)) : '--:--.-';
  document.getElementById('hud-pos').textContent = `4/${G.allCars.length}`;

  showScreen('game');

  // Store render fn for flyover
  G._renderFn = { render };

  // Camera flyover intro
  await runFlyover();

  // Then countdown
  render();
  await runCountdown();

  G.startTime = performance.now(); G.gameRunning = true;
  gameLoop();
}

// ─── Finish ───
function finishRace() {
  G.canvas.style.transform = '';
  const total = performance.now() - G.startTime;
  const pos = G.positions.indexOf(G.player) + 1;

  // Victory donuts if 1st place
  if (pos === 1) {
    startVictoryDonuts();
    // Keep running game loop for donuts, then stop
    setTimeout(() => { G.gameRunning = false; }, 3000);
  } else {
    G.gameRunning = false;
  }
  if (!G.bestTime || total < parseFloat(G.bestTime)) { G.bestTime = total; localStorage.setItem('apu-gokart-best', total.toString()); }
  // Save ghost per-track
  const ghostSaveKey = `apu-gokart-ghost-${G.currentTrackId}${G.reverseMode ? '-rev' : ''}`;
  try { localStorage.setItem(ghostSaveKey, JSON.stringify(G.ghostData)); } catch {}

  // Save track record
  const trackId = G.currentTrackId;
  if (!G.trackRecords[trackId] || total < G.trackRecords[trackId]) {
    G.trackRecords[trackId] = total;
    localStorage.setItem('apu-gokart-records', JSON.stringify(G.trackRecords));
  }

  document.getElementById('finish-trophy').textContent = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '🏁';
  document.getElementById('finish-title').textContent = pos === 1 ? 'GYŐZELEM!' : pos === 2 ? 'SZÉP VOLT!' : pos === 3 ? 'DOBOGÓ!' : 'CÉL!';
  document.getElementById('finish-time').textContent = formatTime(total);
  document.getElementById('finish-stats').innerHTML = `
    <div class="finish-stat"><div class="finish-stat-value">${pos}.</div><div class="finish-stat-label">HELYEZÉS</div></div>
    <div class="finish-stat"><div class="finish-stat-value">${Math.round(G.player.totalDrift)}</div><div class="finish-stat-label">DRIFT PONT</div></div>
    <div class="finish-stat"><div class="finish-stat-value">${G.player.collisions}</div><div class="finish-stat-label">ÜTKÖZÉS</div></div>
    <div class="finish-stat"><div class="finish-stat-value">${formatTime(Math.min(...G.lapTimes))}</div><div class="finish-stat-label">LEGJOBB KÖR</div></div>
  `;
  document.getElementById('finish-laps').innerHTML = G.lapTimes.map((t, i) => `<div>Kör ${i + 1}: ${formatTime(t)}</div>`).join('');

  // Achievements
  const newAch = [];
  const A = G.achievements;
  if (pos === 1 && !A.firstWin) { A.firstWin = true; newAch.push('🏆 Első győzelem!'); }
  if (G.player.collisions === 0 && !A.noHit) { A.noHit = true; newAch.push('🛡️ Sebezhetetlen'); }
  if (G.player.totalDrift > 500 && !A.driftKing) { A.driftKing = true; newAch.push('🔥 Drift Király'); }
  if (total < 180000 && !A.speedDemon) { A.speedDemon = true; newAch.push('⚡ Speed Demon'); }
  if (pos === 1 && G.difficulty === 'hard' && !A.hardWin) { A.hardWin = true; newAch.push('💀 Nehéz győztes'); }
  if (G.nightMode && pos <= 2 && !A.nightOwl) { A.nightOwl = true; newAch.push('🌙 Éjszakai bagoly'); }
  if (G.turboStartUsed && !A.turboStart) { A.turboStart = true; newAch.push('🚀 Turbo Start mester'); }
  localStorage.setItem('apu-gokart-achievements', JSON.stringify(A));

  if (newAch.length > 0) {
    const d = document.createElement('div');
    d.innerHTML = `<div style="margin-top:12px;font-size:0.7rem;color:#f6ad55;">${newAch.map(a => `<div>${a}</div>`).join('')}</div>`;
    document.getElementById('finish-stats').after(d);
  }

  setTimeout(() => showScreen('finish'), 400);
}

/* ═══════════════════════════
   GARAGE UI
   ═══════════════════════════ */

const BODY_COLORS = ['#e94560', '#3b82f6', '#22c55e', '#f6ad55', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#fff', '#333'];
const STRIPE_COLORS = ['#ff8a9e', '#60a5fa', '#4ade80', '#fcd34d', '#c084fc', '#f9a8d4', '#5eead4', '#fdba74', '#888', '#e94560'];

function initGarage() {
  ['body', 'stripe'].forEach(kind => {
    const colors = kind === 'body' ? BODY_COLORS : STRIPE_COLORS;
    const row = document.getElementById(`${kind}-colors`);
    row.innerHTML = '';
    colors.forEach(c => {
      const el = document.createElement('div');
      el.className = `color-swatch ${c === G.garageState[kind + 'Color'] ? 'active' : ''}`;
      el.style.background = c;
      el.addEventListener('click', () => { G.garageState[kind + 'Color'] = c; row.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active')); el.classList.add('active'); drawCarPreview(); });
      row.appendChild(el);
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === G.garageState.size);
    btn.addEventListener('click', () => { G.garageState.size = btn.dataset.size; document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); drawCarPreview(); });
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === G.difficulty);
    btn.addEventListener('click', () => { G.difficulty = btn.dataset.diff; document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
  });

  document.querySelectorAll('.track-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.track === G.currentTrackId);
    btn.addEventListener('click', () => { G.currentTrackId = btn.dataset.track; document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.mode === 'night') === G.nightMode);
    btn.addEventListener('click', () => { G.nightMode = btn.dataset.mode === 'night'; document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
  });

  const revBtn = document.querySelector('.reverse-btn');
  if (revBtn) {
    revBtn.classList.toggle('active', G.reverseMode);
    revBtn.textContent = G.reverseMode ? '🔄 Reverse' : '↔️ Normál';
    revBtn.addEventListener('click', () => { G.reverseMode = !G.reverseMode; revBtn.classList.toggle('active', G.reverseMode); revBtn.textContent = G.reverseMode ? '🔄 Reverse' : '↔️ Normál'; });
  }

  // Weather buttons
  document.querySelectorAll('.weather-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.weather === G.weather);
    btn.addEventListener('click', () => {
      G.weather = btn.dataset.weather;
      document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const nameInput = document.getElementById('car-name');
  nameInput.value = G.garageState.name;
  nameInput.addEventListener('input', () => { G.garageState.name = nameInput.value || 'Apu'; drawCarPreview(); });

  drawCarPreview();
}

function drawCarPreview() {
  const cvs = document.getElementById('car-preview'), c = cvs.getContext('2d'), cw = cvs.width, ch = cvs.height;
  c.clearRect(0, 0, cw, ch);
  const sd = SIZE_DEFS[G.garageState.size], scale = 3.5, W = sd.w * scale, H = sd.h * scale, cx = cw / 2, cy = ch / 2 - 10;
  c.fillStyle = 'rgba(0,0,0,0.4)'; rr(c, cx - W / 2 + 3, cy - H / 2 + 3, W, H, 6); c.fill();
  c.fillStyle = G.garageState.bodyColor; rr(c, cx - W / 2, cy - H / 2, W, H, 6); c.fill();
  c.fillStyle = G.garageState.stripeColor; c.fillRect(cx - 3, cy - H / 2 + 3, 6, H - 6);
  c.fillStyle = 'rgba(120,200,255,0.7)'; rr(c, cx - W / 2 + 4, cy - H / 2 + 4, W - 8, 12, 3); c.fill();
  c.fillStyle = '#ff3333'; c.fillRect(cx - W / 2 + 2, cy + H / 2 - 6, 6, 4); c.fillRect(cx + W / 2 - 8, cy + H / 2 - 6, 6, 4);
  c.fillStyle = '#fff'; c.font = 'bold 11px JetBrains Mono'; c.textAlign = 'center'; c.fillText(G.garageState.name, cx, cy + H / 2 + 22);
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.font = '9px JetBrains Mono'; c.fillText(sd.label, cx, cy + H / 2 + 36);
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }

/* ═══════════════════════════
   TRACK SELECTOR (garázs)
   ═══════════════════════════ */

function populateTrackSelector() {
  const row = document.querySelector('.track-btn')?.parentElement;
  if (!row) return;
  row.innerHTML = '';
  TRACK_LIST.forEach(id => {
    const t = TRACKS[id];
    const btn = document.createElement('button');
    btn.className = `track-btn ${id === G.currentTrackId ? 'active' : ''}`;
    btn.dataset.track = id;
    btn.textContent = `${t.icon} ${t.name}`;
    btn.style.fontSize = '0.45rem';
    btn.addEventListener('click', () => {
      G.currentTrackId = id;
      row.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    row.appendChild(btn);
  });
}

/* ═══════════════════════════
   TRACK SPINNER
   ═══════════════════════════ */

function runTrackSpinner(randomize = false) {
  return new Promise(resolve => {
    if (!randomize) {
      // Skip spinner, go straight to finalize with selected track
      resolve(G.currentTrackId);
      return;
    }

    showScreen('trackspin');
    const wheel = document.getElementById('spin-wheel');
    const selectedEl = document.getElementById('spin-selected');
    selectedEl.textContent = '';

    // Build wheel items (repeat list 6x for scrolling effect)
    wheel.innerHTML = '';
    const ids = [];
    for (let rep = 0; rep < 8; rep++) {
      TRACK_LIST.forEach(id => {
        ids.push(id);
        const item = document.createElement('div');
        item.className = 'spin-item';
        const t = TRACKS[id];
        item.textContent = `${t.icon} ${t.name}`;
        wheel.appendChild(item);
      });
    }

    // Random target
    const targetIdx = Math.floor(TRACK_LIST.length * 5 + Math.random() * TRACK_LIST.length);
    const itemHeight = 41; // approximate height of each item
    const targetScroll = targetIdx * itemHeight - 100; // center offset

    // Animate scroll
    let current = 0;
    const duration = 3000;
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      current = eased * targetScroll;
      wheel.scrollTop = current;

      // Highlight center item
      const centerIdx = Math.floor((current + 120) / itemHeight);
      wheel.querySelectorAll('.spin-item').forEach((el, i) => {
        el.classList.toggle('center', i === centerIdx);
      });

      // Click sound on each new item
      if (t < 0.9 && Math.floor(current / itemHeight) !== Math.floor((current - 5) / itemHeight)) {
        sfxCountdown();
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Done
        const resultId = ids[targetIdx] || TRACK_LIST[0];
        G.currentTrackId = resultId;
        const track = TRACKS[resultId];
        selectedEl.innerHTML = `<div style="color:${track.color}; font-size:2rem; margin-bottom:4px;">${track.icon}</div><div>${track.name}</div>`;
        sfxGo();

        setTimeout(() => resolve(resultId), 1200);
      }
    }

    requestAnimationFrame(tick);
  });
}

/* ═══════════════════════════
   FINALIZING PAGE
   ═══════════════════════════ */

function showFinalizePage() {
  return new Promise(resolve => {
    showScreen('finalize');

    const trackDef = TRACKS[G.currentTrackId];

    // Track card
    document.getElementById('finalize-track').innerHTML = `
      <div class="finalize-track-icon">${trackDef.icon}</div>
      <div class="finalize-track-name" style="color:${trackDef.color};">${trackDef.name}</div>
      <div class="finalize-track-desc">${trackDef.description}</div>
      <div class="finalize-track-type">${trackDef.type.toUpperCase()} • ${G.reverseMode ? 'REVERSE' : 'NORMÁL'} • ${G.nightMode ? 'ÉJSZAKA' : 'NAPPAL'}</div>
    `;

    // Starting grid with all cars
    const carsEl = document.getElementById('finalize-cars');
    carsEl.innerHTML = '';

    const allDrivers = [
      { color: G.garageState.bodyColor, stripe: G.garageState.stripeColor, name: G.garageState.name, isPlayer: true },
      ...AI_DEFS.map(d => ({ color: d.color, stripe: d.stripe, name: d.name, isPlayer: false, desc: d.desc }))
    ];

    // Shuffle grid positions
    const gridOrder = allDrivers.sort(() => Math.random() - 0.5);
    gridOrder.forEach((driver, i) => {
      const card = document.createElement('div');
      card.className = `finalize-car ${driver.isPlayer ? 'player' : ''}`;
      card.style.animationDelay = `${i * 0.15}s`;
      card.style.animation = 'fadeIn 0.4s ease forwards';
      card.style.opacity = '0';
      card.innerHTML = `
        <div class="finalize-car-pos">P${i + 1}</div>
        <div class="finalize-car-dot" style="background:${driver.color};">
          <div style="width:3px;height:100%;background:${driver.stripe};margin:0 auto;border-radius:1px;"></div>
        </div>
        <div class="finalize-car-name">${driver.name}</div>
        ${driver.desc ? `<div style="font-size:0.35rem;color:rgba(255,255,255,0.3);margin-top:2px;">${driver.desc}</div>` : ''}
      `;
      carsEl.appendChild(card);
    });

    // Countdown timer
    let countdown = 4;
    const timerEl = document.getElementById('finalize-timer');
    timerEl.textContent = countdown;

    const interval = setInterval(() => {
      countdown--;
      timerEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

/* ═══════════════════════════
   FULL RACE FLOW
   ═══════════════════════════ */

async function startRaceFlow(spinRandom = false) {
  localStorage.setItem('apu-gokart-car', JSON.stringify(G.garageState));

  // 1. Track spinner (if random)
  await runTrackSpinner(spinRandom);

  // 2. Finalizing page
  await showFinalizePage();

  // 3. Start actual race
  await startRace();
}

/* ═══════════════════════════
   CHAMPIONSHIP MODE
   ═══════════════════════════ */

async function startChampionship() {
  localStorage.setItem('apu-gokart-car', JSON.stringify(G.garageState));

  const tracks = [...TRACK_LIST].sort(() => Math.random() - 0.5).slice(0, 3);
  const points = { player: 0 };
  AI_DEFS.forEach(d => points[d.name] = 0);
  const POINT_TABLE = [25, 18, 15, 12]; // points per position

  for (let race = 0; race < 3; race++) {
    G.currentTrackId = tracks[race];

    // Show spinner for this track
    await runTrackSpinner(true);
    await showFinalizePage();
    await startRace();

    // Wait for race to finish
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (!G.gameRunning && !G.donutMode) {
          clearInterval(check);
          // Award points
          G.positions.forEach((car, idx) => {
            const name = car.isPlayer ? 'player' : car.name;
            points[name] = (points[name] || 0) + (POINT_TABLE[idx] || 10);
          });
          resolve();
        }
      }, 500);
    });

    // Show finish screen, wait for user to click retry/continue
    if (race < 2) {
      // Change retry button text
      document.getElementById('btn-retry').textContent = `🏁 ${race + 2}/${3} VERSENY →`;
      await new Promise(resolve => {
        const handler = () => { document.getElementById('btn-retry').removeEventListener('click', handler); resolve(); };
        document.getElementById('btn-retry').addEventListener('click', handler);
      });
    }
  }

  // Championship results
  document.getElementById('btn-retry').textContent = '🔄 ÚJRA';
  const sorted = Object.entries(points).sort((a, b) => b[1] - a[1]);
  const playerPos = sorted.findIndex(e => e[0] === 'player') + 1;

  document.getElementById('finish-trophy').textContent = playerPos === 1 ? '👑' : '🏆';
  document.getElementById('finish-title').textContent = playerPos === 1 ? 'BAJNOK!' : `${playerPos}. hely a bajnokságban`;
  document.getElementById('finish-time').textContent = `${points.player} pont`;
  document.getElementById('finish-stats').innerHTML = sorted.map((entry, i) => {
    const [name, pts] = entry;
    const displayName = name === 'player' ? G.garageState.name : name;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    return `<div class="finish-stat"><div class="finish-stat-value">${medal} ${pts}</div><div class="finish-stat-label">${displayName}</div></div>`;
  }).join('');
  document.getElementById('finish-laps').innerHTML = tracks.map((t, i) => `<div>${TRACKS[t].icon} ${TRACKS[t].name}</div>`).join('');
  showScreen('finish');
}

/* ═══════════════════════════
   MENU BUTTONS
   ═══════════════════════════ */

document.getElementById('btn-garage').addEventListener('click', () => { populateTrackSelector(); initGarage(); showScreen('garage'); });
document.getElementById('btn-howto').addEventListener('click', () => showScreen('howto'));
document.getElementById('btn-howto-back').addEventListener('click', () => showScreen('title'));
document.getElementById('btn-garage-back').addEventListener('click', () => showScreen('title'));
document.getElementById('btn-race').addEventListener('click', () => startRaceFlow(false));
document.getElementById('btn-championship').addEventListener('click', () => startChampionship());
document.getElementById('btn-retry').addEventListener('click', startRace);
document.getElementById('btn-back-title').addEventListener('click', () => showScreen('title'));
