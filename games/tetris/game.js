/* ══════════════════════════════════════════
   BIRTHDAY TETRIS
   ══════════════════════════════════════════ */

const COLS = 10, ROWS = 20, CELL = 28;
const board = document.getElementById('board');
const bCtx = board.getContext('2d');
board.width = COLS * CELL;
board.height = ROWS * CELL;

// Preview canvases
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

// ─── Audio ───
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(f, d, type = 'square', vol = 0.05) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = f; g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + d);
}
function sfxMove() { beep(300, 0.04, 'sine', 0.04); }
function sfxRotate() { beep(500, 0.06, 'sine', 0.05); }
function sfxDrop() { beep(150, 0.1, 'square', 0.06); }
function sfxLine() { beep(523, 0.08, 'sine', 0.08); setTimeout(() => beep(659, 0.08, 'sine', 0.08), 60); setTimeout(() => beep(784, 0.1, 'sine', 0.1), 120); }
function sfxTetris() { [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f, 0.12, 'sine', 0.1), i * 80)); }
function sfxDie() { beep(200, 0.3, 'sawtooth', 0.08); setTimeout(() => beep(100, 0.4, 'sawtooth', 0.06), 150); }
function sfxHold() { beep(400, 0.06, 'sine', 0.04); }

// ─── Pieces: birthday colors ───
const PIECES = [
  { shape: [[1,1,1,1]], color: '#3b82f6', emoji: '🎁', name: 'I' },          // I
  { shape: [[1,1],[1,1]], color: '#fbbf24', emoji: '🧁', name: 'O' },         // O
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7', emoji: '🍬', name: 'T' },     // T
  { shape: [[1,0],[1,0],[1,1]], color: '#f6ad55', emoji: '🕯️', name: 'L' },   // L
  { shape: [[0,1],[0,1],[1,1]], color: '#ec4899', emoji: '🎂', name: 'J' },   // J
  { shape: [[0,1,1],[1,1,0]], color: '#22c55e', emoji: '🎈', name: 'S' },     // S
  { shape: [[1,1,0],[0,1,1]], color: '#e94560', emoji: '🎀', name: 'Z' },     // Z
];

// ─── State ───
let grid = [];
let current = null; // { piece, x, y, rotation }
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let lines = 0;
let level = 1;
let highScore = parseInt(localStorage.getItem('tetris-high') || '0');
let gameActive = false;
let dropTimer = 0;
let dropInterval = 1000;
let lastTime = 0;
let particles = [];
let lineFlashRows = [];
let lineFlashTimer = 0;
let comboCount = 0;

// ─── Grid ───
function createGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill(0));
  }
}

// ─── Piece helpers ───
function getShape(piece, rot) {
  let s = piece.shape.map(r => [...r]);
  for (let i = 0; i < (rot % 4); i++) {
    const rows = s.length, cols = s[0].length;
    const rotated = [];
    for (let c = 0; c < cols; c++) {
      rotated.push([]);
      for (let r = rows - 1; r >= 0; r--) {
        rotated[c].push(s[r][c]);
      }
    }
    s = rotated;
  }
  return s;
}

function canPlace(piece, x, y, rot) {
  const s = getShape(piece, rot);
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const gx = x + c, gy = y + r;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
      if (gy >= 0 && grid[gy][gx]) return false;
    }
  }
  return true;
}

function spawnPiece() {
  if (!nextPiece) nextPiece = PIECES[Math.floor(Math.random() * PIECES.length)];
  const piece = nextPiece;
  nextPiece = PIECES[Math.floor(Math.random() * PIECES.length)];
  const s = getShape(piece, 0);
  const x = Math.floor((COLS - s[0].length) / 2);
  current = { piece, x, y: -1, rotation: 0 };
  canHold = true;
  drawPreview(nextCtx, nextPiece);

  if (!canPlace(piece, current.x, current.y, 0)) {
    gameOver();
  }
}

function lockPiece() {
  const s = getShape(current.piece, current.rotation);
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const gy = current.y + r, gx = current.x + c;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
        grid[gy][gx] = current.piece;
      }
    }
  }
  sfxDrop();

  // Particles at landing
  for (let c = 0; c < s[0].length; c++) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: (current.x + c) * CELL + CELL / 2, y: (current.y + s.length - 1) * CELL + CELL,
        vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2,
        life: 12, maxLife: 12, size: 2 + Math.random() * 2, color: current.piece.color,
      });
    }
  }

  clearLines();
  spawnPiece();
}

function ghostY() {
  let gy = current.y;
  while (canPlace(current.piece, current.x, gy + 1, current.rotation)) gy++;
  return gy;
}

// ─── Line clearing ───
function clearLines() {
  const full = [];
  for (let r = 0; r < ROWS; r++) {
    if (grid[r].every(cell => cell !== 0)) full.push(r);
  }

  if (full.length === 0) { comboCount = 0; return; }

  comboCount++;
  lineFlashRows = full;
  lineFlashTimer = 15;

  // Score
  const pts = [0, 100, 300, 500, 800][full.length] * level;
  const comboBonus = comboCount > 1 ? 50 * comboCount * level : 0;
  score += pts + comboBonus;
  lines += full.length;

  // Level up every 10 lines
  const newLevel = Math.floor(lines / 10) + 1;
  if (newLevel > level) {
    level = newLevel;
    dropInterval = Math.max(100, 1000 - (level - 1) * 80);
    document.getElementById('level').textContent = level;
  }

  // SFX
  if (full.length === 4) sfxTetris(); else sfxLine();

  // Flash
  const flashEl = document.getElementById('line-flash');
  full.forEach((row, i) => {
    setTimeout(() => {
      flashEl.style.top = (board.getBoundingClientRect().top + row * CELL) + 'px';
      flashEl.classList.add('visible');
      setTimeout(() => flashEl.classList.remove('visible'), 100);
    }, i * 50);
  });

  // Particles for each cleared row
  full.forEach(row => {
    for (let c = 0; c < COLS; c++) {
      const piece = grid[row][c];
      if (piece) {
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: c * CELL + CELL / 2, y: row * CELL + CELL / 2,
            vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 3,
            life: 20, maxLife: 20, size: 3 + Math.random() * 3, color: piece.color,
          });
        }
      }
    }
  });

  // Remove lines
  setTimeout(() => {
    for (let i = full.length - 1; i >= 0; i--) {
      grid.splice(full[i], 1);
      grid.unshift(new Array(COLS).fill(0));
    }
    lineFlashRows = [];
  }, 200);
}

// ─── Input ───
window.addEventListener('keydown', e => {
  if (!gameActive || !current) return;

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    if (canPlace(current.piece, current.x - 1, current.y, current.rotation)) {
      current.x--; sfxMove();
    }
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    if (canPlace(current.piece, current.x + 1, current.y, current.rotation)) {
      current.x++; sfxMove();
    }
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    if (canPlace(current.piece, current.x, current.y + 1, current.rotation)) {
      current.y++; score += 1;
    }
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    // Rotate with wall kick
    const newRot = (current.rotation + 1) % 4;
    if (canPlace(current.piece, current.x, current.y, newRot)) {
      current.rotation = newRot; sfxRotate();
    } else if (canPlace(current.piece, current.x - 1, current.y, newRot)) {
      current.x--; current.rotation = newRot; sfxRotate();
    } else if (canPlace(current.piece, current.x + 1, current.y, newRot)) {
      current.x++; current.rotation = newRot; sfxRotate();
    }
  } else if (e.key === ' ') {
    e.preventDefault();
    // Hard drop
    let dropped = 0;
    while (canPlace(current.piece, current.x, current.y + 1, current.rotation)) {
      current.y++; dropped++;
    }
    score += dropped * 2;
    lockPiece();
  } else if (e.key === 'c' || e.key === 'C') {
    holdCurrentPiece();
  }
});

// Touch controls (swipe)
let touchStartX = 0, touchStartY = 0;
board.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
board.addEventListener('touchend', e => {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    // Tap = rotate
    const newRot = (current.rotation + 1) % 4;
    if (canPlace(current.piece, current.x, current.y, newRot)) { current.rotation = newRot; sfxRotate(); }
  } else if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > 0 && canPlace(current.piece, current.x + 1, current.y, current.rotation)) { current.x++; sfxMove(); }
    if (dx < 0 && canPlace(current.piece, current.x - 1, current.y, current.rotation)) { current.x--; sfxMove(); }
  } else if (dy > 30) {
    // Swipe down = hard drop
    while (canPlace(current.piece, current.x, current.y + 1, current.rotation)) current.y++;
    lockPiece();
  }
});

// ─── Hold ───
function holdCurrentPiece() {
  if (!canHold) return;
  sfxHold();
  canHold = false;
  const held = current.piece;
  if (holdPiece) {
    const s = getShape(holdPiece, 0);
    current = { piece: holdPiece, x: Math.floor((COLS - s[0].length) / 2), y: -1, rotation: 0 };
  } else {
    spawnPiece();
  }
  holdPiece = held;
  drawPreview(holdCtx, holdPiece);
}

// ─── Preview drawing ───
function drawPreview(ctx, piece) {
  ctx.clearRect(0, 0, 80, 80);
  if (!piece) return;
  const s = piece.shape;
  const cellSize = 16;
  const offsetX = (80 - s[0].length * cellSize) / 2;
  const offsetY = (80 - s.length * cellSize) / 2;

  s.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const x = offsetX + c * cellSize, y = offsetY + r * cellSize;
      ctx.fillStyle = piece.color;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 1, y + 1, cellSize - 2, (cellSize - 2) * 0.35);
    });
  });
}

// ─── Render ───
function render() {
  const w = board.width, h = board.height;

  // Background
  bCtx.fillStyle = '#0a0f1a';
  bCtx.fillRect(0, 0, w, h);

  // Grid lines
  bCtx.strokeStyle = 'rgba(255,255,255,0.04)';
  bCtx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) { bCtx.beginPath(); bCtx.moveTo(c * CELL, 0); bCtx.lineTo(c * CELL, h); bCtx.stroke(); }
  for (let r = 0; r <= ROWS; r++) { bCtx.beginPath(); bCtx.moveTo(0, r * CELL); bCtx.lineTo(w, r * CELL); bCtx.stroke(); }

  // Placed blocks
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = grid[r][c];
      if (!piece) continue;

      const flash = lineFlashRows.includes(r) ? 1 : 0;
      drawBlock(bCtx, c * CELL, r * CELL, CELL, piece.color, flash);
    }
  }

  // Ghost piece
  if (current && gameActive) {
    const gy = ghostY();
    const s = getShape(current.piece, current.rotation);
    bCtx.globalAlpha = 0.2;
    s.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        bCtx.fillStyle = current.piece.color;
        bCtx.fillRect((current.x + c) * CELL + 2, (gy + r) * CELL + 2, CELL - 4, CELL - 4);
      });
    });
    bCtx.globalAlpha = 1;
  }

  // Current piece
  if (current && gameActive) {
    const s = getShape(current.piece, current.rotation);
    s.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const py = current.y + r;
        if (py < 0) return;
        drawBlock(bCtx, (current.x + c) * CELL, py * CELL, CELL, current.piece.color, 0);
      });
    });
  }

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    bCtx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    bCtx.globalAlpha = alpha;
    bCtx.beginPath(); bCtx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); bCtx.fill();
  });
  bCtx.globalAlpha = 1;

  // Update particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; });
  particles = particles.filter(p => p.life > 0);
}

function drawBlock(ctx, x, y, size, color, flash) {
  const s = size;
  const pad = 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + pad + 1, y + pad + 1, s - pad * 2, s - pad * 2);

  // Body
  ctx.fillStyle = flash ? '#fff' : color;
  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, s - pad * 2, s - pad * 2, 3);
  ctx.fill();

  if (!flash) {
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + pad, y + pad, s - pad * 2, (s - pad * 2) * 0.3);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + pad, y + s * 0.65, s - pad * 2, (s - pad * 2) * 0.3);

    // Inner bevel
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + pad + 1, y + pad + 1, s - pad * 2 - 2, s - pad * 2 - 2, 2);
    ctx.stroke();
  }
}

// ─── Game loop ───
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  if (gameActive && current) {
    dropTimer += dt;
    if (dropTimer >= dropInterval) {
      dropTimer = 0;
      if (canPlace(current.piece, current.x, current.y + 1, current.rotation)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
  }

  render();

  // HUD
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = lines;

  requestAnimationFrame(gameLoop);
}

// ─── Game flow ───
function startGame() {
  initAudio();
  createGrid();
  score = 0; lines = 0; level = 1; comboCount = 0;
  dropInterval = 1000; dropTimer = 0;
  holdPiece = null; nextPiece = null;
  particles = []; lineFlashRows = [];
  canHold = true;

  holdCtx.clearRect(0, 0, 80, 80);
  document.getElementById('level').textContent = 1;
  document.getElementById('high').textContent = highScore;

  spawnPiece();
  gameActive = true;

  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
}

function gameOver() {
  gameActive = false;
  sfxDie();

  if (score > highScore) { highScore = score; localStorage.setItem('tetris-high', highScore.toString()); }

  setTimeout(() => {
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-high').textContent = highScore;
    document.getElementById('gameover-screen').classList.remove('hidden');
  }, 500);
}

// ─── Buttons ───
document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);

requestAnimationFrame(gameLoop);
