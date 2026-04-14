/* ══════════════════════════════════════════
   FLAPPY CAKE — Birthday Edition
   ══════════════════════════════════════════ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ─── Audio ───
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(freq, dur, type = 'square', vol = 0.08) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
}
function sfxJump() { beep(440, 0.1, 'sine', 0.1); beep(660, 0.1, 'sine', 0.08); }
function sfxScore() { beep(523, 0.08, 'square', 0.08); setTimeout(() => beep(659, 0.08, 'square', 0.08), 60); setTimeout(() => beep(784, 0.1, 'square', 0.1), 120); }
function sfxDie() { beep(200, 0.3, 'sawtooth', 0.12); setTimeout(() => beep(100, 0.4, 'sawtooth', 0.1), 150); }
function sfxCollect() { beep(880, 0.08, 'sine', 0.1); setTimeout(() => beep(1100, 0.1, 'sine', 0.08), 60); }
function sfxPowerup() { beep(440, 0.1, 'sine', 0.08); setTimeout(() => beep(660, 0.1, 'sine', 0.08), 80); setTimeout(() => beep(880, 0.15, 'sine', 0.1), 160); }

// ─── Constants ───
const GRAVITY = 0.55;
const JUMP_FORCE = -8.5;
const PIPE_SPEED_BASE = 4.5;
const PIPE_GAP_BASE = 170;
const PIPE_WIDTH = 80;
const PIPE_SPACING = 220;
const CAKE_SIZE = 28;

// ─── Game state ───
let cake = { x: 0, y: 0, vy: 0, rotation: 0, size: CAKE_SIZE };
let pipes = [];
let collectibles = [];
let particles = [];
let score = 0;
let combo = 0;
let maxCombo = 0;
let highScore = parseInt(localStorage.getItem('flappy-cake-high') || '0');
let gameActive = false;
let gameStarted = false;
let frameCount = 0;
let shieldTimer = 0;
let slowTimer = 0;
let tinyTimer = 0;
let screenShake = 0;
let bgOffset = 0;
let dayNightCycle = 0;
let screenFlash = 0; // white flash alpha
let screenFlashColor = '#fff';
let slowMoDeath = 0; // slow-mo frame counter on death
let trail = []; // cake trail positions
let floatingTexts = []; // "+5" floating texts
let milestoneTimer = 0;

// Death messages
const DEATH_MSGS = [
  'A torta leesett az asztalról! 🎂💀',
  'Ez a torta nem tud repülni... vagy mégis? 🤔',
  'Túl sok gyertya volt rajta! 🕯️🔥',
  'A krém nem bírta a gravitációt! 🫠',
  'Plot twist: a csövek nyertek! 🏆',
  'Apu jobban csinálná! 😄',
  'Ez még nem a te napod... vagy mégis? 🎂',
  'A marcipán nem elég aerodinamikus! ✈️',
  'Kell még egy kis gyakorlás! 💪',
  'A torta szétesett... de újra összeáll! 🔄',
];

// Collectible types
const COLLECT_TYPES = [
  { type: 'present', icon: '🎁', points: 5, color: '#e94560' },
  { type: 'balloon', icon: '🎈', points: 3, color: '#3b82f6', effect: 'slow' },
  { type: 'star', icon: '⭐', points: 10, color: '#f6ad55' },
  { type: 'candle', icon: '🕯️', points: 2, color: '#fbbf24' },
  { type: 'shield', icon: '🛡️', points: 0, color: '#22c55e', effect: 'shield' },
  { type: 'tiny', icon: '🔮', points: 0, color: '#a855f7', effect: 'tiny' },
];

// ─── Input ───
function jump() {
  if (!gameActive) return;
  cake.vy = JUMP_FORCE * (slowTimer > 0 ? 0.7 : 1);
  cake.rotation = -0.4;
  sfxJump();

  // Jump particles — bigger burst
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4; // downward spread
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: cake.x + (Math.random() - 0.5) * 10,
      y: cake.y + cake.size / 2,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.sin(angle) * speed,
      life: 18 + Math.random() * 12, maxLife: 30,
      size: 2 + Math.random() * 4,
      color: ['#f6ad55', '#ec4899', '#fbbf24'][Math.floor(Math.random() * 3)],
    });
  }
}

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
window.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); }
});

// ─── Pipe generation ───
function spawnPipe() {
  const w = canvas.width, h = canvas.height;
  const diff = Math.min(score / 30, 1); // slower difficulty ramp

  const gap = PIPE_GAP_BASE - diff * 25; // gap shrinks less (min 145 instead of 130)
  const minTop = 60;
  const maxTop = h - gap - 60;
  const topH = minTop + Math.random() * (maxTop - minTop);

  const moving = score > 8 && Math.random() < 0.3; // moving pipes after score 8
  const moveRange = 30 + Math.random() * 30;
  const moveSpeed = 0.02 + Math.random() * 0.02;

  pipes.push({
    x: w + PIPE_WIDTH,
    topH,
    gap,
    scored: false,
    moving,
    moveOffset: 0,
    moveRange,
    moveSpeed,
    moveDir: 1,
  });

  // Collectible in the gap (60% chance)
  if (Math.random() < 0.6) {
    const typeIdx = Math.random() < 0.15 ? (4 + Math.floor(Math.random() * 2)) : Math.floor(Math.random() * 4); // 15% chance for powerup
    const ct = COLLECT_TYPES[typeIdx];
    collectibles.push({
      x: w + PIPE_WIDTH + PIPE_WIDTH / 2,
      y: topH + gap / 2 + (Math.random() - 0.5) * gap * 0.4,
      type: ct,
      alive: true,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }
}

// ─── Update ───
function update() {
  if (!gameActive) return;
  frameCount++;

  const speedMult = slowTimer > 0 ? 0.5 : 1;
  const pipeSpeed = (PIPE_SPEED_BASE + score * 0.08) * speedMult;

  // Day/night cycle
  dayNightCycle = (Math.sin(frameCount * 0.001) + 1) / 2;

  // Gravity
  const grav = GRAVITY * (slowTimer > 0 ? 0.5 : 1);
  cake.vy += grav;
  cake.y += cake.vy;

  // Rotation
  cake.rotation += (Math.min(cake.vy * 0.04, 0.8) - cake.rotation) * 0.1;

  // Cake size (tiny mode)
  const targetSize = tinyTimer > 0 ? CAKE_SIZE * 0.5 : CAKE_SIZE;
  cake.size += (targetSize - cake.size) * 0.1;

  // Timers
  if (shieldTimer > 0) shieldTimer--;
  if (slowTimer > 0) slowTimer--;
  if (tinyTimer > 0) tinyTimer--;
  if (screenShake > 0) screenShake *= 0.85;

  // Move pipes
  pipes.forEach(p => {
    p.x -= pipeSpeed;
    if (p.moving) {
      p.moveOffset += p.moveSpeed * p.moveDir;
      if (Math.abs(p.moveOffset) > p.moveRange) p.moveDir *= -1;
    }
  });

  // Move collectibles
  collectibles.forEach(c => { c.x -= pipeSpeed; });

  // Spawn pipes
  const lastPipe = pipes[pipes.length - 1];
  if (!lastPipe || lastPipe.x < canvas.width - PIPE_SPACING) spawnPipe();

  // Remove off-screen
  pipes = pipes.filter(p => p.x > -PIPE_WIDTH);
  collectibles = collectibles.filter(c => c.x > -30 && c.alive);

  // Score
  pipes.forEach(p => {
    if (!p.scored && p.x + PIPE_WIDTH < cake.x) {
      p.scored = true;
      score++;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      sfxScore();

      // Combo display
      if (combo > 2) {
        const comboEl = document.getElementById('hud-combo');
        comboEl.textContent = `🔥 ${combo}x COMBO!`;
        comboEl.classList.add('visible');
        setTimeout(() => comboEl.classList.remove('visible'), 1500);
      }

      // Score flash
      screenFlash = 0.15;
      screenFlashColor = combo > 4 ? '#f6ad55' : '#fff';

      // Floating "+1"
      floatingTexts.push({ x: cake.x + 30, y: cake.y - 20, text: combo > 2 ? `+${combo}` : '+1', life: 40, maxLife: 40, color: combo > 4 ? '#f6ad55' : '#4ade80' });

      // Score particles — bigger burst
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: cake.x + 20, y: cake.y - 10,
          vx: 1 + Math.random() * 3, vy: -3 + Math.random() * 2,
          life: 20, maxLife: 20, size: 2 + Math.random() * 3,
          color: ['#4ade80', '#22c55e', '#86efac'][Math.floor(Math.random() * 3)],
        });
      }

      // Milestone flash (every 10 points)
      if (score % 10 === 0 && score > 0) {
        screenFlash = 0.4;
        screenFlashColor = '#f6ad55';
        milestoneTimer = 60;
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 3, text: `🔥 ${score} PONT! 🔥`, life: 60, maxLife: 60, color: '#f6ad55', big: true });
      }
    }
  });

  // Collect items
  collectibles.forEach(c => {
    if (!c.alive) return;
    const dist = Math.hypot(c.x - cake.x, c.y - cake.y);
    if (dist < cake.size + 12) {
      c.alive = false;
      score += c.type.points;
      if (c.type.effect === 'slow') { slowTimer = 180; sfxPowerup(); }
      else if (c.type.effect === 'shield') { shieldTimer = 300; sfxPowerup(); }
      else if (c.type.effect === 'tiny') { tinyTimer = 240; sfxPowerup(); }
      else sfxCollect();

      // Collect flash + floating text
      screenFlash = 0.12;
      screenFlashColor = c.type.color;
      if (c.type.points > 0) floatingTexts.push({ x: c.x, y: c.y - 15, text: `+${c.type.points}`, life: 35, maxLife: 35, color: c.type.color });
      if (c.type.effect) floatingTexts.push({ x: c.x, y: c.y - 30, text: c.type.effect === 'slow' ? '🎈 SLOW-MO!' : c.type.effect === 'shield' ? '🛡️ PAJZS!' : '🔮 TINY!', life: 50, maxLife: 50, color: c.type.color, big: true });

      // Collect particles — ring burst
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14;
        particles.push({
          x: c.x, y: c.y,
          vx: Math.cos(angle) * (3 + Math.random() * 2), vy: Math.sin(angle) * (3 + Math.random() * 2),
          life: 18, maxLife: 18, size: 3 + Math.random() * 2, color: c.type.color,
        });
      }
    }
  });

  // Collision
  const hitBounds = cake.y - cake.size / 2 < 0 || cake.y + cake.size / 2 > canvas.height;
  let hitPipe = false;

  pipes.forEach(p => {
    const px = p.x, pw = PIPE_WIDTH;
    const pTopH = p.topH + p.moveOffset;
    const pBotY = pTopH + p.gap;
    const cs = cake.size / 2;

    if (cake.x + cs > px && cake.x - cs < px + pw) {
      if (cake.y - cs < pTopH || cake.y + cs > pBotY) {
        hitPipe = true;
      }
    }
  });

  if (hitBounds || (hitPipe && shieldTimer <= 0)) {
    die();
  } else if (hitPipe && shieldTimer > 0) {
    shieldTimer = 0;
    screenShake = 8;
    // Shield break particles
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: cake.x, y: cake.y,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        life: 20, maxLife: 20, size: 4, color: '#22c55e',
      });
    }
  }

  // Update particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; });
  particles = particles.filter(p => p.life > 0);

  // Trail
  trail.push({ x: cake.x, y: cake.y, life: 12 });
  if (trail.length > 15) trail.shift();
  trail.forEach(t => t.life--);
  trail = trail.filter(t => t.life > 0);

  // Floating texts
  floatingTexts.forEach(ft => { ft.y -= 1.2; ft.life--; });
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);

  // Screen flash decay
  if (screenFlash > 0) screenFlash *= 0.85;
  if (milestoneTimer > 0) milestoneTimer--;

  // HUD
  document.getElementById('hud-score').textContent = score;

  // Background scroll
  bgOffset -= pipeSpeed * 0.3;
}

// ─── Die ───
function die() {
  gameActive = false;
  sfxDie();
  screenShake = 20;
  screenFlash = 0.5;
  screenFlashColor = '#e94560';
  combo = 0;

  // Death explosion — massive burst
  for (let i = 0; i < 35; i++) {
    const angle = (Math.PI * 2 * i) / 35;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x: cake.x, y: cake.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 25 + Math.random() * 15, maxLife: 40, size: 3 + Math.random() * 6,
      color: ['#e94560', '#f6ad55', '#ec4899', '#fff', '#fbbf24'][Math.floor(Math.random() * 5)],
    });
  }

  // Shockwave ring
  floatingTexts.push({ x: cake.x, y: cake.y, text: '', life: 30, maxLife: 30, color: '#e94560', big: false });

  // High score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappy-cake-high', highScore.toString());
  }

  setTimeout(() => {
    document.getElementById('final-score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('death-msg').textContent = DEATH_MSGS[Math.floor(Math.random() * DEATH_MSGS.length)];
    document.getElementById('combo-best').textContent = maxCombo > 2 ? `Legjobb combo: ${maxCombo}x 🔥` : '';
    document.getElementById('death-screen').classList.remove('hidden');
  }, 800);
}

// ─── Render ───
function render() {
  const w = canvas.width, h = canvas.height;

  // Sky gradient (day/night)
  const dayR = 135, dayG = 206, dayB = 235;
  const nightR = 15, nightG = 23, nightB = 42;
  const t = dayNightCycle;
  const r = Math.floor(dayR + (nightR - dayR) * t);
  const g = Math.floor(dayG + (nightG - dayG) * t);
  const b = Math.floor(dayB + (nightB - dayB) * t);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, `rgb(${r},${g},${b})`);
  skyGrad.addColorStop(1, `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 30)},${Math.max(0, b - 20)})`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Stars at night (twinkling)
  if (t > 0.3) {
    for (let i = 0; i < 50; i++) {
      const sx = (i * 173 + 50) % w, sy = (i * 91 + 20) % (h * 0.6);
      const twinkle = 0.3 + Math.sin(frameCount * 0.03 + i * 1.7) * 0.7;
      ctx.fillStyle = `rgba(255,255,255,${(t - 0.3) * twinkle * 0.5})`;
      ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      // Cross sparkle on brightest stars
      if (i % 7 === 0 && twinkle > 0.8) {
        ctx.strokeStyle = `rgba(255,255,255,${(t - 0.3) * 0.15})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4); ctx.stroke();
      }
    }
    // Moon
    if (t > 0.5) {
      const moonX = w * 0.8, moonY = h * 0.12;
      ctx.fillStyle = `rgba(255,240,200,${(t - 0.5) * 0.6})`;
      ctx.beginPath(); ctx.arc(moonX, moonY, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,240,200,${(t - 0.5) * 0.1})`;
      ctx.beginPath(); ctx.arc(moonX, moonY, 35, 0, Math.PI * 2); ctx.fill();
      // Moon crater
      ctx.fillStyle = `rgba(200,190,160,${(t - 0.5) * 0.15})`;
      ctx.beginPath(); ctx.arc(moonX - 5, moonY - 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 7, moonY + 5, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Sun during day
  if (t < 0.4) {
    const sunX = w * 0.85, sunY = h * 0.1;
    ctx.fillStyle = `rgba(255,220,100,${(0.4 - t) * 0.3})`;
    ctx.beginPath(); ctx.arc(sunX, sunY, 30 + Math.sin(frameCount * 0.02) * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,200,50,${(0.4 - t) * 0.15})`;
    ctx.beginPath(); ctx.arc(sunX, sunY, 50, 0, Math.PI * 2); ctx.fill();
    // Sun rays
    for (let r = 0; r < 8; r++) {
      const angle = (Math.PI * 2 * r) / 8 + frameCount * 0.005;
      ctx.strokeStyle = `rgba(255,220,100,${(0.4 - t) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 35, sunY + Math.sin(angle) * 35);
      ctx.lineTo(sunX + Math.cos(angle) * 55, sunY + Math.sin(angle) * 55);
      ctx.stroke();
    }
  }

  // Camera shake
  if (screenShake > 0.5) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // Background clouds — two parallax layers
  // Far clouds (slow)
  ctx.fillStyle = `rgba(255,255,255,${t > 0.5 ? 0.03 : 0.12})`;
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 400 + bgOffset * 0.2) % (w + 300)) - 150;
    const cy = h * 0.25 + Math.sin(i * 3.7) * 40;
    ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 30, cy - 5, 28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 20, cy + 5, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 55, cy + 8, 20, 0, Math.PI * 2); ctx.fill();
  }
  // Near clouds (faster)
  ctx.fillStyle = `rgba(255,255,255,${t > 0.5 ? 0.04 : 0.15})`;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 300 + bgOffset * 0.5) % (w + 250)) - 120;
    const cy = h * 0.4 + Math.sin(i * 2.3) * 30;
    ctx.beginPath(); ctx.arc(cx, cy, 45 + i * 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 40, cy + 10, 35 + i * 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 25, cy + 12, 30, 0, Math.PI * 2); ctx.fill();
  }

  // Background flying balloons (decorative, slow parallax)
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 500 + bgOffset * 0.35 + 200) % (w + 300)) - 100;
    const by = h * 0.15 + i * h * 0.12 + Math.sin(frameCount * 0.015 + i * 2) * 15;
    const balloonColors = ['#e94560', '#3b82f6', '#f6ad55'];
    ctx.fillStyle = balloonColors[i] + (t > 0.5 ? '33' : '55');
    ctx.beginPath(); ctx.ellipse(bx, by, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = balloonColors[i] + (t > 0.5 ? '22' : '44');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx, by + 10); ctx.lineTo(bx + Math.sin(frameCount * 0.02 + i) * 3, by + 25); ctx.stroke();
  }

  // Mountains/hills silhouette
  ctx.fillStyle = `rgba(${Math.max(0, r - 30)},${Math.max(0, g - 25)},${Math.max(0, b - 15)},0.4)`;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  for (let x = 0; x <= w; x += 40) {
    const hillY = h * 0.62 + Math.sin(x * 0.008 + 1) * 30 + Math.sin(x * 0.015) * 15;
    ctx.lineTo(x, hillY);
  }
  ctx.lineTo(w, h * 0.7); ctx.closePath(); ctx.fill();

  // Ground
  const groundH = 40;
  ctx.fillStyle = t > 0.5 ? '#1a3a1a' : '#4ade80';
  ctx.fillRect(0, h - groundH, w, groundH);
  ctx.fillStyle = t > 0.5 ? '#0f2a0f' : '#22c55e';
  ctx.fillRect(0, h - groundH, w, 4);
  // Ground pattern — detailed
  ctx.fillStyle = t > 0.5 ? '#153015' : '#16a34a';
  for (let i = 0; i < w / 20 + 1; i++) {
    const gx = ((i * 20 + bgOffset) % (w + 20)) - 10;
    ctx.fillRect(gx, h - groundH + 8, 10, 3);
  }
  // Grass blades
  ctx.strokeStyle = t > 0.5 ? '#1a4a1a' : '#22c55e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < w / 8; i++) {
    const gx = ((i * 8 + bgOffset * 0.8) % (w + 16)) - 8;
    const sway = Math.sin(frameCount * 0.04 + i * 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(gx, h - groundH);
    ctx.quadraticCurveTo(gx + sway, h - groundH - 6 - (i % 3) * 2, gx + sway * 1.5, h - groundH - 10 - (i % 4) * 2);
    ctx.stroke();
  }
  // Flowers
  if (t < 0.5) {
    const flowerColors = ['#ec4899', '#f6ad55', '#a855f7', '#e94560', '#fbbf24'];
    for (let i = 0; i < w / 60; i++) {
      const fx = ((i * 60 + 30 + bgOffset * 0.9) % (w + 60)) - 30;
      const fy = h - groundH - 2;
      ctx.fillStyle = flowerColors[i % flowerColors.length];
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(fx, fy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Pipes
  pipes.forEach(p => {
    const topH = p.topH + p.moveOffset;
    const botY = topH + p.gap;

    // Pipe body — gradient
    const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    pipeGrad.addColorStop(0, t > 0.5 ? '#1a4a1a' : '#16a34a');
    pipeGrad.addColorStop(0.5, t > 0.5 ? '#226622' : '#22c55e');
    pipeGrad.addColorStop(1, t > 0.5 ? '#1a4a1a' : '#16a34a');

    // Top pipe
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, topH);
    // Top pipe cap
    ctx.fillStyle = t > 0.5 ? '#226622' : '#22c55e';
    ctx.fillRect(p.x - 4, topH - 20, PIPE_WIDTH + 8, 20);
    ctx.strokeStyle = t > 0.5 ? '#0f3a0f' : '#15803d';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 4, topH - 20, PIPE_WIDTH + 8, 20);

    // Bottom pipe
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(p.x, botY, PIPE_WIDTH, h - botY);
    // Bottom pipe cap
    ctx.fillStyle = t > 0.5 ? '#226622' : '#22c55e';
    ctx.fillRect(p.x - 4, botY, PIPE_WIDTH + 8, 20);
    ctx.strokeStyle = t > 0.5 ? '#0f3a0f' : '#15803d';
    ctx.strokeRect(p.x - 4, botY, PIPE_WIDTH + 8, 20);

    // Pipe highlight strip (3D depth)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(p.x + 8, 0, 6, topH - 20);
    ctx.fillRect(p.x + 8, botY + 20, 6, h - botY - 20);

    // Moving pipe — warning stripes
    if (p.moving) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      for (let s = 0; s < 3; s++) {
        ctx.fillStyle = s % 2 === 0 ? '#e94560' : '#f6ad55';
        ctx.fillRect(p.x - 4 + s * ((PIPE_WIDTH + 8) / 3), topH - 22, (PIPE_WIDTH + 8) / 3, 2);
        ctx.fillRect(p.x - 4 + s * ((PIPE_WIDTH + 8) / 3), botY + 18, (PIPE_WIDTH + 8) / 3, 2);
      }
      ctx.restore();
    }

    // Pipe score zone glow (between pipes)
    if (!p.scored) {
      ctx.fillStyle = `rgba(74, 222, 128, ${0.02 + Math.sin(frameCount * 0.05) * 0.015})`;
      ctx.fillRect(p.x, topH, PIPE_WIDTH, p.gap);
    }
  });

  // Collectibles — enhanced
  collectibles.forEach(c => {
    if (!c.alive) return;
    const bob = Math.sin(frameCount * 0.06 + c.bobOffset) * 6;
    const cx = c.x, cy = c.y + bob;
    const pulse = 0.8 + Math.sin(frameCount * 0.08 + c.bobOffset) * 0.2;

    // Outer glow ring (pulsing)
    ctx.strokeStyle = c.type.color + '33';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 16 * pulse, 0, Math.PI * 2); ctx.stroke();

    // Inner glow
    ctx.fillStyle = c.type.color + '15';
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();

    // Orbiting sparkles
    for (let s = 0; s < 3; s++) {
      const oa = frameCount * 0.04 + s * (Math.PI * 2 / 3) + c.bobOffset;
      const ox = cx + Math.cos(oa) * 18;
      const oy = cy + Math.sin(oa) * 18;
      ctx.fillStyle = c.type.color + '44';
      ctx.beginPath(); ctx.arc(ox, oy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Icon (slightly scaled by pulse)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(c.type.icon, 0, 7);
    ctx.restore();
  });

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color + (p.color.includes('rgba') ? '' : `${Math.floor(alpha * 99).toString(16).padStart(2, '0')}`);
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Trail behind cake
  trail.forEach((t, i) => {
    const alpha = (t.life / 12) * 0.3;
    const s = cake.size * (t.life / 12) * 0.6;
    ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
    ctx.beginPath(); ctx.arc(t.x, t.y, s, 0, Math.PI * 2); ctx.fill();
  });

  // Cake
  if (gameActive || gameStarted) {
    ctx.save();
    ctx.translate(cake.x, cake.y);
    ctx.rotate(cake.rotation);

    const s = cake.size;

    // Shield aura
    if (shieldTimer > 0) {
      ctx.strokeStyle = `rgba(34,197,94,${0.3 + Math.sin(frameCount * 0.1) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, s + 6, 0, Math.PI * 2); ctx.stroke();
    }

    // Slow aura
    if (slowTimer > 0) {
      ctx.strokeStyle = `rgba(59,130,246,${0.2 + Math.sin(frameCount * 0.08) * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, s + 4, 0, Math.PI * 2); ctx.stroke();
    }

    // Neon glow around cake (when combo active)
    if (combo > 2) {
      ctx.shadowColor = '#f6ad55';
      ctx.shadowBlur = 15 + Math.sin(frameCount * 0.1) * 5;
    }

    // Cake body — layered
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 3, s, s * 0.65, 4);
    ctx.fill();

    // Bottom layer darker
    ctx.fillStyle = '#e8d5a3';
    ctx.fillRect(-s / 2 + 2, -s / 3 + s * 0.4, s - 4, s * 0.25);

    // Frosting top
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 3, s, s * 0.18, [4, 4, 0, 0]);
    ctx.fill();

    // Frosting drips — wavy
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 5; i++) {
      const dx = -s / 2 + 2 + i * (s / 5);
      const dripH = 4 + Math.sin(i * 1.7 + frameCount * 0.05) * 3;
      ctx.beginPath();
      ctx.ellipse(dx + s / 10, -s / 3 + s * 0.18 + dripH / 2, 3, dripH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sprinkles
    const sprinkleColors = ['#fbbf24', '#3b82f6', '#22c55e', '#a855f7', '#fff'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
      const sx = -s / 2 + 4 + (i * s / 6);
      const sy = -s / 3 + s * 0.22 + (i % 2) * 3;
      ctx.fillRect(sx, sy, 3, 1.5);
    }

    // Candle — striped
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -s / 3 - 12, 4, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -s / 3 - 12, 4, 2);
    ctx.fillRect(-2, -s / 3 - 8, 4, 2);
    ctx.fillRect(-2, -s / 3 - 4, 4, 2);

    // Flame — animated, multi-layer
    const flameH = 6 + Math.random() * 3;
    const flameW = 3 + Math.random() * 1.5;
    // Outer flame (orange)
    ctx.fillStyle = `rgba(255,${130 + Math.random() * 60},0,${0.6 + Math.random() * 0.3})`;
    ctx.beginPath(); ctx.ellipse(0, -s / 3 - 14 - flameH / 2, flameW, flameH, 0, 0, Math.PI * 2); ctx.fill();
    // Inner flame (yellow)
    ctx.fillStyle = `rgba(255,${220 + Math.random() * 35},50,${0.7 + Math.random() * 0.3})`;
    ctx.beginPath(); ctx.ellipse(0, -s / 3 - 14 - flameH / 2 + 1, flameW * 0.6, flameH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    // Flame glow
    ctx.fillStyle = `rgba(255,200,50,${0.1 + Math.sin(frameCount * 0.15) * 0.05})`;
    ctx.beginPath(); ctx.arc(0, -s / 3 - 15, 14, 0, Math.PI * 2); ctx.fill();

    // Eyes (cute!)
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-s / 5, -s / 3 + s * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s / 5, -s / 3 + s * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
    // Eye highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-s / 5 + 1, -s / 3 + s * 0.11, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s / 5 + 1, -s / 3 + s * 0.11, 1, 0, Math.PI * 2); ctx.fill();
    // Mouth (smile when combo, neutral otherwise)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (combo > 2) {
      ctx.arc(0, -s / 3 + s * 0.2, 4, 0, Math.PI); // big smile
    } else {
      ctx.arc(0, -s / 3 + s * 0.22, 3, 0.2, Math.PI - 0.2); // small smile
    }
    ctx.stroke();

    // Plate
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.roundRect(-s / 2 - 4, s * 0.32 - 2, s + 8, 5, 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  if (screenShake > 0.5) ctx.restore();

  // Floating texts
  floatingTexts.forEach(ft => {
    const alpha = ft.life / ft.maxLife;
    const scale = ft.big ? 1.5 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${ft.big ? 18 : 14}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  // Screen flash
  if (screenFlash > 0.01) {
    ctx.fillStyle = screenFlashColor + Math.floor(screenFlash * 255).toString(16).padStart(2, '0');
    ctx.fillRect(0, 0, w, h);
  }

  // Milestone pulse ring
  if (milestoneTimer > 0) {
    const prog = 1 - milestoneTimer / 60;
    ctx.strokeStyle = `rgba(246, 173, 85, ${(1 - prog) * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cake.x, cake.y, 30 + prog * 80, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ─── Game loop ───
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// ─── Start ───
function startGame() {
  initAudio();
  const w = canvas.width, h = canvas.height;

  cake = { x: w * 0.25, y: h * 0.5, vy: 0, rotation: 0, size: CAKE_SIZE };
  pipes = [];
  collectibles = [];
  particles = [];
  score = 0;
  combo = 0;
  maxCombo = 0;
  frameCount = 0;
  shieldTimer = 0;
  slowTimer = 0;
  tinyTimer = 0;
  screenShake = 0;
  screenFlash = 0;
  bgOffset = 0;
  dayNightCycle = 0;
  trail = [];
  floatingTexts = [];
  milestoneTimer = 0;
  gameActive = true;
  gameStarted = true;

  document.getElementById('hud-score').textContent = '0';
  document.getElementById('hud-combo').classList.remove('visible');
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('death-screen').classList.add('hidden');
}

// ─── Buttons ───
document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);

// ─── Init ───
gameLoop();
