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
const GRAVITY = 0.45;
const JUMP_FORCE = -7.5;
const PIPE_SPEED_BASE = 3;
const PIPE_GAP_BASE = 160;
const PIPE_WIDTH = 60;
const PIPE_SPACING = 250;
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
let dayNightCycle = 0; // 0-1, 0=day, 0.5=night

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

  // Jump particles
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: cake.x, y: cake.y + cake.size / 2,
      vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2,
      life: 15 + Math.random() * 10, maxLife: 25,
      size: 2 + Math.random() * 3,
      color: '#f6ad55',
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
  const diff = Math.min(score / 15, 1); // difficulty ramp 0-1

  const gap = PIPE_GAP_BASE - diff * 40; // gap shrinks
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

      // Score particles
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: cake.x + 20, y: cake.y - 10,
          vx: 1 + Math.random() * 2, vy: -2 + Math.random(),
          life: 20, maxLife: 20, size: 3, color: '#4ade80',
        });
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

      // Collect particles
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: c.x, y: c.y,
          vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
          life: 15, maxLife: 15, size: 3, color: c.type.color,
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

  // HUD
  document.getElementById('hud-score').textContent = score;

  // Background scroll
  bgOffset -= pipeSpeed * 0.3;
}

// ─── Die ───
function die() {
  gameActive = false;
  sfxDie();
  screenShake = 15;
  combo = 0;

  // Death explosion
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: cake.x, y: cake.y,
      vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
      life: 25, maxLife: 25, size: 3 + Math.random() * 5,
      color: ['#e94560', '#f6ad55', '#ec4899', '#fff'][Math.floor(Math.random() * 4)],
    });
  }

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

  // Stars at night
  if (t > 0.4) {
    ctx.fillStyle = `rgba(255,255,255,${(t - 0.4) * 0.5})`;
    for (let i = 0; i < 30; i++) {
      const sx = (i * 173 + 50) % w, sy = (i * 91 + 20) % (h * 0.6);
      ctx.beginPath(); ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
  }

  // Camera shake
  if (screenShake > 0.5) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // Background clouds/hills
  ctx.fillStyle = `rgba(${Math.max(0, r - 20)},${Math.max(0, g - 15)},${Math.max(0, b - 10)},0.5)`;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 300 + bgOffset * 0.5) % (w + 200)) - 100;
    const cy = h * 0.55 + Math.sin(i * 2) * 30;
    ctx.beginPath(); ctx.arc(cx, cy, 50 + i * 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 40, cy + 10, 40 + i * 8, 0, Math.PI * 2); ctx.fill();
  }

  // Ground
  const groundH = 40;
  ctx.fillStyle = t > 0.5 ? '#1a3a1a' : '#4ade80';
  ctx.fillRect(0, h - groundH, w, groundH);
  ctx.fillStyle = t > 0.5 ? '#0f2a0f' : '#22c55e';
  ctx.fillRect(0, h - groundH, w, 4);
  // Ground pattern
  ctx.fillStyle = t > 0.5 ? '#153015' : '#16a34a';
  for (let i = 0; i < w / 20 + 1; i++) {
    const gx = ((i * 20 + bgOffset) % (w + 20)) - 10;
    ctx.fillRect(gx, h - groundH + 8, 10, 3);
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

    // Moving pipe indicator
    if (p.moving) {
      ctx.fillStyle = 'rgba(255,100,100,0.3)';
      ctx.fillRect(p.x + PIPE_WIDTH / 2 - 1, topH - 5, 2, 5);
      ctx.fillRect(p.x + PIPE_WIDTH / 2 - 1, botY, 2, 5);
    }
  });

  // Collectibles
  collectibles.forEach(c => {
    if (!c.alive) return;
    const bob = Math.sin(frameCount * 0.06 + c.bobOffset) * 6;
    const cx = c.x, cy = c.y + bob;

    // Glow
    ctx.fillStyle = c.type.color + '22';
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();

    // Icon
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(c.type.icon, cx, cy + 6);
  });

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color + (p.color.includes('rgba') ? '' : `${Math.floor(alpha * 99).toString(16).padStart(2, '0')}`);
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

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

    // Cake body
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(-s / 2, -s / 3, s, s * 0.65);

    // Frosting
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(-s / 2, -s / 3, s, s * 0.2);

    // Frosting drips
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 4; i++) {
      const dx = -s / 2 + (i + 0.5) * (s / 4);
      ctx.fillRect(dx, -s / 3 + s * 0.2, 4, 3 + Math.sin(i * 2 + frameCount * 0.05) * 2);
    }

    // Candle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, -s / 3 - 10, 4, 10);
    // Flame
    ctx.fillStyle = `rgba(255,${150 + Math.random() * 50},0,${0.7 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(0, -s / 3 - 13, 3 + Math.random(), 5 + Math.random() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flame glow
    ctx.fillStyle = 'rgba(255,200,50,0.15)';
    ctx.beginPath(); ctx.arc(0, -s / 3 - 13, 10, 0, Math.PI * 2); ctx.fill();

    // Plate
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-s / 2 - 3, s * 0.32 - 2, s + 6, 4);

    ctx.restore();
  }

  if (screenShake > 0.5) ctx.restore();
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
  bgOffset = 0;
  dayNightCycle = 0;
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
