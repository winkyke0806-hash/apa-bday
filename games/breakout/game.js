/* ══════════════════════════════════════════
   BIRTHDAY BREAKOUT
   ══════════════════════════════════════════ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// ─── Audio ───
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(f, d, type = 'square', vol = 0.06) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = f; g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + d);
}
function sfxHit() { beep(520 + Math.random() * 200, 0.08, 'sine', 0.08); }
function sfxBreak() { beep(800 + Math.random() * 200, 0.1, 'sine', 0.1); setTimeout(() => beep(1000, 0.08, 'sine', 0.08), 50); }
function sfxWall() { beep(300, 0.05, 'square', 0.04); }
function sfxDie() { beep(200, 0.3, 'sawtooth', 0.1); setTimeout(() => beep(100, 0.4, 'sawtooth', 0.08), 150); }
function sfxPowerup() { beep(440, 0.08, 'sine', 0.08); setTimeout(() => beep(660, 0.08, 'sine', 0.08), 60); setTimeout(() => beep(880, 0.12, 'sine', 0.1), 120); }
function sfxLevelUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'sine', 0.1), i * 100)); }

// ─── Game constants ───
const PADDLE_H = 14;
const BALL_R = 7;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_H = 22;
const BRICK_PAD = 4;
const MAX_LEVEL = 5;

// Brick types by row
const BRICK_TYPES = [
  { emoji: '🎂', color: '#ec4899', points: 10, hp: 1 },
  { emoji: '🎁', color: '#e94560', points: 8, hp: 1 },
  { emoji: '🕯️', color: '#fbbf24', points: 6, hp: 1 },
  { emoji: '🧁', color: '#f6ad55', points: 5, hp: 1 },
  { emoji: '🍬', color: '#a855f7', points: 4, hp: 1 },
  { emoji: '🎈', color: '#3b82f6', points: 3, hp: 1 },
];

const POWERUP_TYPES = [
  { id: 'wide', icon: '↔️', color: '#22c55e', desc: 'Szélesebb ütő' },
  { id: 'multi', icon: '⚾', color: '#3b82f6', desc: 'Multi-ball' },
  { id: 'fire', icon: '🔥', color: '#e94560', desc: 'Tűzlabda' },
  { id: 'sticky', icon: '🍯', color: '#f6ad55', desc: 'Ragadós ütő' },
  { id: 'life', icon: '❤️', color: '#ec4899', desc: '+1 élet' },
];

// ─── State ───
let paddle = { x: 0, w: 100, h: PADDLE_H };
let balls = [];
let bricks = [];
let powerups = []; // falling powerups
let particles = [];
let floatingTexts = [];
let score = 0;
let lives = 3;
let level = 1;
let combo = 0;
let maxCombo = 0;
let highScore = parseInt(localStorage.getItem('breakout-high') || '0');
let gameActive = false;
let stickyMode = false;
let stickyBall = null; // ball stuck to paddle
let fireMode = 0; // frames remaining
let screenShake = 0;
let screenFlash = 0;
let screenFlashColor = '#fff';
let frameCount = 0;

// ─── Input ───
let mouseX = 0;
canvas.addEventListener('mousemove', e => mouseX = e.clientX);
canvas.addEventListener('touchmove', e => { e.preventDefault(); mouseX = e.touches[0].clientX; });
canvas.addEventListener('click', () => { if (stickyBall) releaseStickyBall(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); if (stickyBall) releaseStickyBall(); });

function releaseStickyBall() {
  if (!stickyBall) return;
  stickyBall.vy = -Math.abs(stickyBall.speed);
  stickyBall.vx = (stickyBall.x - paddle.x) * 0.05;
  stickyBall = null;
  stickyMode = false;
}

// ─── Level generation ───
function generateBricks() {
  bricks = [];
  const w = canvas.width;
  const brickW = (w - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
  const startY = 60;

  const rows = Math.min(BRICK_ROWS, 4 + level);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      // Some bricks missing for variety
      if (level > 1 && Math.random() < 0.1) continue;

      const type = BRICK_TYPES[r % BRICK_TYPES.length];
      const hp = level >= 3 && r < 2 ? 2 : type.hp; // top rows stronger at level 3+

      bricks.push({
        x: BRICK_PAD + c * (brickW + BRICK_PAD),
        y: startY + r * (BRICK_H + BRICK_PAD),
        w: brickW,
        h: BRICK_H,
        type,
        hp,
        maxHp: hp,
        alive: true,
      });
    }
  }
}

// ─── Ball creation ───
function createBall(x, y, angle) {
  const speed = 4.5 + level * 0.3;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    r: BALL_R,
    fire: fireMode > 0,
    trail: [],
  };
}

// ─── Update ───
function update() {
  if (!gameActive) return;
  frameCount++;

  const w = canvas.width, h = canvas.height;

  // Paddle follow mouse
  paddle.x += (mouseX - paddle.x) * 0.15;
  paddle.x = Math.max(paddle.w / 2, Math.min(w - paddle.w / 2, paddle.x));
  const paddleTop = h - 50;

  // Sticky ball follows paddle
  if (stickyBall) {
    stickyBall.x = paddle.x + (stickyBall._stickyOffset || 0);
    stickyBall.y = paddleTop - stickyBall.r - 1;
  }

  // Fire mode countdown
  if (fireMode > 0) fireMode--;

  // Timers
  if (screenShake > 0) screenShake *= 0.85;
  if (screenFlash > 0) screenFlash *= 0.85;

  // Update balls
  balls.forEach(ball => {
    if (ball === stickyBall) return;

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounce
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); sfxWall(); }
    if (ball.x + ball.r > w) { ball.x = w - ball.r; ball.vx = -Math.abs(ball.vx); sfxWall(); }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); sfxWall(); }

    // Paddle bounce
    if (ball.vy > 0 && ball.y + ball.r > paddleTop && ball.y + ball.r < paddleTop + paddle.h + 5 &&
        ball.x > paddle.x - paddle.w / 2 && ball.x < paddle.x + paddle.w / 2) {
      ball.y = paddleTop - ball.r;
      const hitPos = (ball.x - paddle.x) / (paddle.w / 2); // -1 to 1
      const angle = -Math.PI / 2 + hitPos * Math.PI / 3; // -90° ± 60°
      ball.vx = Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;
      sfxHit();
      combo = 0; // reset combo on paddle hit

      if (stickyMode && !stickyBall) {
        stickyBall = ball;
        ball._stickyOffset = ball.x - paddle.x;
        ball.vx = 0; ball.vy = 0;
      }

      // Paddle hit particles
      for (let i = 0; i < 5; i++) {
        particles.push({ x: ball.x, y: paddleTop, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, life: 12, maxLife: 12, size: 2 + Math.random() * 2, color: '#f6ad55' });
      }
    }

    // Brick collision
    bricks.forEach(brick => {
      if (!brick.alive) return;
      if (ball.x + ball.r > brick.x && ball.x - ball.r < brick.x + brick.w &&
          ball.y + ball.r > brick.y && ball.y - ball.r < brick.y + brick.h) {

        brick.hp--;
        if (brick.hp <= 0) {
          brick.alive = false;
          score += brick.type.points * (1 + Math.floor(combo / 3));
          combo++;
          if (combo > maxCombo) maxCombo = combo;
          sfxBreak();

          // Drop powerup (15% chance)
          if (Math.random() < 0.15) {
            const pu = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            powerups.push({ x: brick.x + brick.w / 2, y: brick.y + brick.h / 2, type: pu, vy: 2 });
          }

          // Break particles
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: brick.x + Math.random() * brick.w, y: brick.y + Math.random() * brick.h,
              vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              life: 18, maxLife: 18, size: 2 + Math.random() * 3, color: brick.type.color,
            });
          }

          // Flash + floating text
          screenFlash = 0.08;
          screenFlashColor = brick.type.color;
          const pts = brick.type.points * (1 + Math.floor(combo / 3));
          floatingTexts.push({ x: brick.x + brick.w / 2, y: brick.y, text: `+${pts}`, life: 30, maxLife: 30, color: brick.type.color });

          // Combo popup
          if (combo > 2 && combo % 3 === 0) {
            const el = document.getElementById('combo-popup');
            el.textContent = `🔥 ${combo}x COMBO!`;
            el.classList.add('visible');
            setTimeout(() => el.classList.remove('visible'), 1200);
          }
        } else {
          sfxHit();
          // Damage flash
          screenFlash = 0.04;
        }

        // Bounce (unless fire mode)
        if (!ball.fire) {
          // Determine bounce direction
          const overlapX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - ball.x + ball.r);
          const overlapY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - ball.y + ball.r);
          if (overlapX < overlapY) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
        }
      }
    });

    // Ball lost (below screen)
    if (ball.y - ball.r > h) {
      ball._dead = true;
    }
  });

  // Remove dead balls
  balls = balls.filter(b => !b._dead);
  if (balls.length === 0 && gameActive) {
    lives--;
    combo = 0;
    if (lives <= 0) {
      gameOver();
    } else {
      sfxDie();
      screenShake = 10;
      spawnBall();
    }
    updateLivesHUD();
  }

  // Powerups falling
  powerups.forEach(pu => {
    pu.y += pu.vy;
    // Catch by paddle
    if (pu.y > paddleTop - 10 && pu.y < paddleTop + paddle.h &&
        pu.x > paddle.x - paddle.w / 2 && pu.x < paddle.x + paddle.w / 2) {
      pu._caught = true;
      applyPowerup(pu.type);
    }
    if (pu.y > h + 20) pu._caught = true;
  });
  powerups = powerups.filter(pu => !pu._caught);

  // Floating texts
  floatingTexts.forEach(ft => { ft.y -= 1; ft.life--; });
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);

  // Particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; });
  particles = particles.filter(p => p.life > 0);

  // Check level complete
  if (bricks.every(b => !b.alive)) {
    if (level >= MAX_LEVEL) {
      winGame();
    } else {
      nextLevel();
    }
  }

  // HUD
  document.getElementById('hud-score').textContent = score;
}

// ─── Powerup application ───
function applyPowerup(type) {
  sfxPowerup();
  screenFlash = 0.15;
  screenFlashColor = type.color;
  floatingTexts.push({ x: paddle.x, y: canvas.height - 80, text: type.icon + ' ' + type.desc, life: 50, maxLife: 50, color: type.color, big: true });

  if (type.id === 'wide') {
    paddle.w = Math.min(200, paddle.w + 30);
    setTimeout(() => paddle.w = Math.max(80, paddle.w - 30), 10000);
  } else if (type.id === 'multi') {
    const newBalls = [];
    balls.forEach(b => {
      if (b === stickyBall) return;
      for (let i = 0; i < 2; i++) {
        const nb = createBall(b.x, b.y, Math.atan2(b.vy, b.vx) + (i === 0 ? 0.4 : -0.4));
        nb.fire = b.fire;
        newBalls.push(nb);
      }
    });
    balls.push(...newBalls);
  } else if (type.id === 'fire') {
    fireMode = 600; // 10 seconds
    balls.forEach(b => b.fire = true);
  } else if (type.id === 'sticky') {
    stickyMode = true;
  } else if (type.id === 'life') {
    lives = Math.min(5, lives + 1);
    updateLivesHUD();
  }
}

// ─── Render ───
function render() {
  const w = canvas.width, h = canvas.height;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Screen shake
  if (screenShake > 0.5) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  const paddleTop = h - 50;

  // Bricks
  bricks.forEach(brick => {
    if (!brick.alive) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.w, brick.h);

    // Body gradient
    const bg = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
    bg.addColorStop(0, brick.type.color);
    bg.addColorStop(1, brick.type.color + 'aa');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
    ctx.fill();

    // HP indicator (for multi-HP bricks)
    if (brick.maxHp > 1) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = brick.hp > 1 ? 2 : 0.5;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
      ctx.stroke();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, brick.h * 0.35);

    // Emoji
    ctx.font = `${Math.min(14, brick.h - 6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(brick.type.emoji, brick.x + brick.w / 2, brick.y + brick.h / 2 + 5);
  });

  // Powerups falling
  powerups.forEach(pu => {
    const bob = Math.sin(frameCount * 0.08 + pu.x) * 3;
    ctx.fillStyle = pu.type.color + '33';
    ctx.beginPath(); ctx.arc(pu.x, pu.y + bob, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pu.type.color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pu.x, pu.y + bob, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pu.type.icon, pu.x, pu.y + bob + 5);
  });

  // Ball trails
  balls.forEach(ball => {
    ball.trail.forEach((t, i) => {
      const alpha = (i / ball.trail.length) * 0.3;
      ctx.fillStyle = ball.fire ? `rgba(255,100,0,${alpha})` : `rgba(255,255,255,${alpha})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, ball.r * (i / ball.trail.length) * 0.7, 0, Math.PI * 2); ctx.fill();
    });
  });

  // Balls
  balls.forEach(ball => {
    // Glow
    if (ball.fire) {
      ctx.fillStyle = 'rgba(255,100,0,0.15)';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r * 3, 0, Math.PI * 2); ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(ball.x + 2, ball.y + 2, ball.r, 0, Math.PI * 2); ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.r);
    ballGrad.addColorStop(0, ball.fire ? '#ff6600' : '#fff');
    ballGrad.addColorStop(1, ball.fire ? '#cc3300' : '#ccc');
    ctx.fillStyle = ballGrad;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();

    // Fire effect
    if (ball.fire) {
      ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},0,${0.4 + Math.random() * 0.3})`;
      ctx.beginPath(); ctx.arc(ball.x + (Math.random() - 0.5) * 4, ball.y + (Math.random() - 0.5) * 4, ball.r * 0.8 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Paddle
  const pw = paddle.w, ph = paddle.h;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.roundRect(paddle.x - pw / 2 + 2, paddleTop + 2, pw, ph, 6); ctx.fill();
  // Body
  const padGrad = ctx.createLinearGradient(0, paddleTop, 0, paddleTop + ph);
  padGrad.addColorStop(0, stickyMode ? '#f6ad55' : '#ec4899');
  padGrad.addColorStop(1, stickyMode ? '#d97706' : '#be185d');
  ctx.fillStyle = padGrad;
  ctx.beginPath(); ctx.roundRect(paddle.x - pw / 2, paddleTop, pw, ph, 6); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath(); ctx.roundRect(paddle.x - pw / 2 + 4, paddleTop + 2, pw - 8, ph * 0.4, 3); ctx.fill();
  // Edge details
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.arc(paddle.x - pw / 2 + 6, paddleTop + ph / 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(paddle.x + pw / 2 - 6, paddleTop + ph / 2, 3, 0, Math.PI * 2); ctx.fill();

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (screenShake > 0.5) ctx.restore();

  // Floating texts
  floatingTexts.forEach(ft => {
    const alpha = ft.life / ft.maxLife;
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${ft.big ? 14 : 11}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color; ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;

  // Screen flash
  if (screenFlash > 0.01) {
    ctx.fillStyle = screenFlashColor + Math.floor(screenFlash * 255).toString(16).padStart(2, '0');
    ctx.fillRect(0, 0, w, h);
  }
}

// ─── Game flow ───
function spawnBall() {
  const b = createBall(paddle.x, canvas.height - 50 - PADDLE_H - BALL_R - 2, -Math.PI / 2);
  balls.push(b);
  stickyBall = b;
  b._stickyOffset = 0;
  b.vx = 0; b.vy = 0;
  stickyMode = true;
}

function startGame() {
  initAudio();
  score = 0; lives = 3; level = 1; combo = 0; maxCombo = 0;
  paddle.w = 100; fireMode = 0; stickyMode = false; stickyBall = null;
  balls = []; powerups = []; particles = []; floatingTexts = [];
  screenShake = 0; screenFlash = 0; frameCount = 0;
  paddle.x = canvas.width / 2;
  generateBricks();
  spawnBall();
  updateLivesHUD();
  document.getElementById('hud-level').textContent = level;
  gameActive = true;
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');
}

function nextLevel() {
  level++;
  sfxLevelUp();
  screenFlash = 0.3; screenFlashColor = '#f6ad55';

  const el = document.getElementById('level-popup');
  el.textContent = `⭐ SZINT ${level} ⭐`;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);

  document.getElementById('hud-level').textContent = level;
  paddle.w = 100; fireMode = 0;
  balls = []; powerups = [];
  generateBricks();
  setTimeout(() => spawnBall(), 500);
}

function gameOver() {
  gameActive = false;
  sfxDie(); screenShake = 15;
  if (score > highScore) { highScore = score; localStorage.setItem('breakout-high', highScore.toString()); }
  setTimeout(() => {
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-level').textContent = level;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }, 800);
}

function winGame() {
  gameActive = false;
  sfxLevelUp();
  if (score > highScore) { highScore = score; localStorage.setItem('breakout-high', highScore.toString()); }
  setTimeout(() => {
    document.getElementById('win-score').textContent = score;
    document.getElementById('win-screen').classList.remove('hidden');
  }, 500);
}

function updateLivesHUD() {
  document.getElementById('hud-lives').textContent = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives));
}

// ─── Game loop ───
function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }

document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-win-retry').addEventListener('click', startGame);

gameLoop();
