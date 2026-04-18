import { isRoomUnlocked, unlockRoom, getUnlockedCount, areAllRoomsUnlocked } from './progress.js';
import { HOUSE_LAYOUT, ROOM_MAPPING, ROOM_ZONES, ENTRANCE_DOOR } from './house-layout.js';

const ROOMS = [
  { id: 'hangok-terme',    name: 'Hangok Terme',       icon: '🎵', color: '#f6ad55', module: './rooms/hangok-terme.js' },
  { id: 'emlekek-kamraja', name: 'Emlékek Kamrája',     icon: '📸', color: '#68d391', module: './rooms/emlekek-kamraja.js' },
  { id: 'vilagjaro',       name: 'A Nagy Világjáró',    icon: '🗺️', color: '#fc8181', module: './rooms/vilagjaro.js' },
  { id: 'agytornaterem',   name: 'Agytornaterem',       icon: '🧠', color: '#63b3ed', module: './rooms/agytornaterem.js' },
  { id: 'leveleslada',     name: 'Titkos Levelesláda',  icon: '💌', color: '#b794f4', module: './rooms/leveleslada.js' },
  { id: 'moziterem',       name: 'Moziterem',           icon: '🎬', color: '#f687b3', module: './rooms/moziterem.js' },
  { id: 'idokapszula',     name: 'Időkapszula',         icon: '⏳', color: '#4fd1c5', module: './rooms/idokapszula.js' },
  { id: 'kalandorok',      name: 'Kalandorok Klubja',   icon: '🏎️', color: '#ed8936', module: './rooms/kalandorok.js' },
  { id: 'ajandekraktar',   name: 'Ajándékraktár',       icon: '🎁', color: '#ecc94b', module: './rooms/ajandekraktar.js' },
  { id: 'furcsa-konyha',   name: 'A Furcsa Konyha',     icon: '🍳', color: '#48bb78', module: './rooms/furcsa-konyha.js' },
  { id: 'a-szef',          name: 'A Széf',              icon: '🔐', color: '#d69e2e', module: './rooms/a-szef.js', isSecret: true },
];

const REGULAR_ROOMS = ROOMS.filter(r => !r.isSecret);
const TOTAL_REGULAR = REGULAR_ROOMS.length;

const grid = document.getElementById('room-grid');
const progressBar = document.getElementById('progress-bar');
const progressGlow = document.getElementById('progress-glow');
const progressText = document.getElementById('progress-text');
const minigameOverlay = document.getElementById('minigame-overlay');
const minigameContainer = document.getElementById('minigame-container');
const contentOverlay = document.getElementById('content-overlay');
const contentContainer = document.getElementById('content-container');
const blueprintHouse = document.getElementById('blueprint-house');

let initialRender = true;

function updateProgressBar() {
  const count = getUnlockedCount();
  const pct = Math.round((count / TOTAL_REGULAR) * 100);
  progressBar.style.width = pct + '%';
  progressGlow.style.width = pct + '%';
  progressText.textContent = `${count} / ${TOTAL_REGULAR} szoba felfedezve`;
}

// Style an unlocked room element
function styleUnlockedRoom(el, room) {
  const c = room.color;
  el.style.setProperty('--room-color', c);
  el.style.borderColor = c + '88';
  el.style.background = `radial-gradient(ellipse at center, ${c}22 0%, ${c}08 50%, transparent 80%)`;
  el.style.boxShadow = `0 0 15px ${c}33, 0 0 40px ${c}15, inset 0 0 25px ${c}0a`;
  el.innerHTML = `
    <div class="room__icon" style="filter:drop-shadow(0 0 8px ${c}88) drop-shadow(0 0 16px ${c}44);">${room.icon}</div>
    <div class="room__name" style="color:${c}; text-shadow:0 0 10px ${c}55;">${room.name}</div>
    <div class="room__status">✓ Felfedezve</div>
  `;
}

function renderRooms() {
  grid.innerHTML = '';

  REGULAR_ROOMS.forEach(room => {
    const unlocked = isRoomUnlocked(room.id);
    const el = document.createElement('div');
    el.className = `room ${unlocked ? 'room--unlocked' : 'room--locked'}`;
    el.dataset.roomId = room.id;

    if (unlocked) {
      styleUnlockedRoom(el, room);
    } else {
      el.innerHTML = `
        <div class="room__icon">🔒</div>
        <div class="room__name room__name--hidden">???</div>
        <div class="room__dimensions">${randomDimension()}</div>
      `;
    }

    // Entrance animation only on first load
    if (initialRender) {
      el.classList.add('room--entering');
    }

    el.addEventListener('click', () => onRoomClick(room));
    grid.appendChild(el);
  });

  // A Széf
  const szef = ROOMS.find(r => r.isSecret);
  const szefEl = document.createElement('div');
  const szefUnlocked = areAllRoomsUnlocked(TOTAL_REGULAR);

  szefEl.className = `room room--secret ${szefUnlocked ? 'room--unlocked' : 'room--locked'}`;
  szefEl.dataset.roomId = szef.id;

  if (szefUnlocked) {
    const sc = szef.color;
    szefEl.style.setProperty('--room-color', sc);
    szefEl.style.borderColor = sc + '88';
    szefEl.style.background = `radial-gradient(ellipse at center, ${sc}25, ${sc}08 60%, transparent)`;
    szefEl.style.boxShadow = `0 0 20px ${sc}44, 0 0 50px ${sc}22, inset 0 0 30px ${sc}11`;
    szefEl.innerHTML = `
      <div class="room__icon" style="font-size:2.2rem; filter:drop-shadow(0 0 12px ${sc}aa) drop-shadow(0 0 24px ${sc}55); animation:iconFloat 3s ease-in-out infinite;">🔓</div>
      <div class="room__name" style="color:${sc}; font-family:var(--font-display); font-weight:700; font-size:0.8rem; text-shadow:0 0 12px ${sc}66;">${szef.name}</div>
      <div class="room__status" style="color:#68d391;">✨ Megnyílt! ✨</div>
    `;
    szefEl.addEventListener('click', () => onRoomClick(szef));
  } else {
    szefEl.innerHTML = `
      <div class="room__icon">🔐</div>
      <div class="room__name">A Széf</div>
      <div class="room__status room__status--locked">Fedezd fel az összes szobát!</div>
    `;
  }

  if (initialRender) {
    szefEl.classList.add('room--entering');
  }

  grid.appendChild(szefEl);
  updateProgressBar();
  initialRender = false;
}

function randomDimension() {
  const w = (3 + Math.random() * 2).toFixed(1);
  const h = (3 + Math.random() * 2).toFixed(1);
  return `${w}m × ${h}m`;
}

// Spectacular unlock effect
function spawnUnlockEffect(roomEl, color) {
  const rect = roomEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 1. Flash overlay
  const flash = document.createElement('div');
  flash.style.cssText = `
    position:fixed; left:${rect.left}px; top:${rect.top}px;
    width:${rect.width}px; height:${rect.height}px;
    background:radial-gradient(circle, rgba(255,255,255,0.6), ${color}44, transparent);
    z-index:998; pointer-events:none; border-radius:4px;
    animation: unlockFlash 0.6s ease-out forwards;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);

  // 2. Double expanding ring
  for (let ring = 0; ring < 2; ring++) {
    const r = document.createElement('div');
    r.style.cssText = `
      position:fixed; left:${rect.left}px; top:${rect.top}px;
      width:${rect.width}px; height:${rect.height}px;
      border:2px solid ${color}; border-radius:4px;
      z-index:997; pointer-events:none;
      animation: unlockRing${ring === 0 ? '' : '2'} ${0.8 + ring * 0.3}s ease-out forwards;
      animation-delay: ${ring * 0.15}s;
    `;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 1200);
  }

  // 3. Particle burst — two waves
  for (let wave = 0; wave < 2; wave++) {
    setTimeout(() => {
      const count = wave === 0 ? 20 : 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (wave * 0.3);
        const dist = (wave === 0 ? 40 : 65) + Math.random() * 30;
        const size = 3 + Math.random() * 4;
        const p = document.createElement('div');
        p.className = 'unlock-particle';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.background = color;
        p.style.color = color;
        p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1100);
      }
    }, wave * 150);
  }
}

async function onRoomClick(room) {
  const unlocked = isRoomUnlocked(room.id);

  if (room.isSecret && !areAllRoomsUnlocked(TOTAL_REGULAR)) return;

  try {
    const mod = await import(room.module);

    if (unlocked || room.isSecret) {
      contentContainer.innerHTML = '';
      mod.renderContent(contentContainer, room);
      showView('content');
    } else {
      minigameContainer.innerHTML = '';
      mod.renderMinigame(minigameContainer, room, () => {
        unlockRoom(room.id);

        // First go back to house view
        showView('house');

        // Re-render rooms (without entrance animations)
        renderRooms();

        // THEN play unlock animation after a short delay so user sees it
        setTimeout(() => {
          const roomEl = grid.querySelector(`[data-room-id="${room.id}"]`);
          if (roomEl) {
            roomEl.classList.add('room--just-unlocked');
            spawnUnlockEffect(roomEl, room.color);
          }
        }, 100);
      });
      showView('minigame');
    }
  } catch (err) {
    console.error(`Hiba a(z) ${room.id} szoba betöltésekor:`, err);
  }
}

function showView(view) {
  blueprintHouse.classList.toggle('active', view === 'house');
  minigameOverlay.classList.toggle('active', view === 'minigame');
  contentOverlay.classList.toggle('active', view === 'content');
}

document.getElementById('back-to-house').addEventListener('click', () => showView('house'));
document.getElementById('back-from-content').addEventListener('click', () => showView('house'));

// ══════════════════════════════
// LOADING → CUTSCENE → TUTORIAL → HOUSE
// ══════════════════════════════

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingPercent = document.getElementById('loading-percent');
const introCutscene = document.getElementById('intro-cutscene');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialStep = document.getElementById('tutorial-step');
const tutorialDots = document.getElementById('tutorial-dots');
const tutorialNextBtn = document.getElementById('tutorial-next');

const TUTORIAL_STEPS = [
  { icon: '🏠', title: 'A Tervrajz', text: 'Ez a ház tervrajza. Minden szoba egy meglepetést rejt — de előbb fel kell oldanod őket!' },
  { icon: '🔒', title: 'Zárt szobák', text: 'Kattints egy zárt szobára. Egy kis minijátékot kell megnyerned, hogy kinyisd az ajtót.' },
  { icon: '🎮', title: 'Minijátékok', text: 'Kvízek, puzzle-ök, memóriajátékok és mások várnak. Ha elakadsz, a Segítség gomb tippet ad!' },
  { icon: '🎁', title: 'Meglepetések', text: 'Feloldott szobákra újra rákattintva megtekintheted a meglepetést: fotók, videók, üzenetek és még sok más.' },
  { icon: '🔐', title: 'A Széf', text: 'Ha mind a 10 szobát feloldod, megnyílik A Széf — a végső nagy meglepetés!' },
];

let tutorialIndex = 0;

// 1. Animated loading bar
function runLoadingBar() {
  return new Promise(resolve => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1 + Math.random() * 3;
      if (progress > 100) progress = 100;
      loadingBar.style.width = progress + '%';
      loadingPercent.textContent = Math.floor(progress) + '%';
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(resolve, 400);
      }
    }, 60);
  });
}

// 2. Cutscene
function runCutscene() {
  return new Promise(resolve => {
    loadingScreen.classList.add('hide');
    setTimeout(() => loadingScreen.style.display = 'none', 1200);

    setTimeout(() => {
      introCutscene.style.display = 'flex';

      // Animate lines one by one
      const lines = introCutscene.querySelectorAll('.cutscene__line');
      let lastDelay = 0;
      lines.forEach(line => {
        const delay = parseInt(line.dataset.delay);
        lastDelay = Math.max(lastDelay, delay);
        setTimeout(() => line.classList.add('visible'), delay);
      });

      // Skip button or auto-advance
      const skipBtn = document.getElementById('skip-cutscene');
      const finish = () => {
        introCutscene.classList.add('hide');
        setTimeout(() => {
          introCutscene.style.display = 'none';
          resolve();
        }, 1500);
      };

      skipBtn.addEventListener('click', finish);

      // Auto-advance after last line + 3s
      setTimeout(finish, lastDelay + 3000);
    }, 800);
  });
}

// 3. Tutorial
function runTutorial() {
  return new Promise(resolve => {
    // Check if already seen
    if (localStorage.getItem('apu-bday-tutorial-done')) {
      resolve();
      return;
    }

    tutorialOverlay.style.display = 'flex';
    renderTutorialStep();

    tutorialNextBtn.addEventListener('click', () => {
      tutorialIndex++;
      if (tutorialIndex >= TUTORIAL_STEPS.length) {
        localStorage.setItem('apu-bday-tutorial-done', 'true');
        tutorialOverlay.classList.add('hide');
        setTimeout(() => {
          tutorialOverlay.style.display = 'none';
          resolve();
        }, 600);
      } else {
        renderTutorialStep();
      }
    });
  });
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialIndex];
  tutorialStep.innerHTML = `
    <div class="tutorial__step-icon">${step.icon}</div>
    <div class="tutorial__step-title">${step.title}</div>
    <div class="tutorial__step-text">${step.text}</div>
  `;
  tutorialStep.classList.add('fade-in');

  // Dots
  tutorialDots.innerHTML = '';
  TUTORIAL_STEPS.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `tutorial__dot ${i === tutorialIndex ? 'tutorial__dot--active' : ''}`;
    tutorialDots.appendChild(dot);
  });

  tutorialNextBtn.textContent = tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'Kezdjük! 🎂' : 'Tovább →';
}

// 4. Floating blueprint annotations in background
function spawnAnnotations() {
  const container = document.getElementById('bp-annotations');
  const texts = [
    'SZOBA 01 — 4.2m × 3.1m', 'AJTÓ SZ-420', 'FALVASTAGSÁG: 25cm',
    'TEHERHORDÓ FAL', 'NYÍLÁSZÁRÓ 90×210', 'PADLÓSZINT ±0.00',
    'MENNYEZET H: 2.80m', 'VILLAMOS VEZETÉK', 'VÍZVEZETÉK Ø32',
    'REV.1 — JÓVÁHAGYVA', 'LÉPCSŐ FEL ↑', 'ERKÉLY 1.2×4.0m',
  ];

  function spawn() {
    const el = document.createElement('div');
    el.className = 'bp-annotation';
    el.textContent = texts[Math.floor(Math.random() * texts.length)];
    el.style.setProperty('--y', (10 + Math.random() * 80) + 'vh');
    el.style.setProperty('--start-x', '-200px');
    el.style.setProperty('--end-x', '110vw');
    el.style.setProperty('--dur', (25 + Math.random() * 35) + 's');
    el.style.animationDelay = Math.random() * 5 + 's';
    container.appendChild(el);
    setTimeout(() => el.remove(), 65000);
  }

  // Initial burst
  for (let i = 0; i < 4; i++) setTimeout(spawn, i * 3000);
  // Ongoing
  setInterval(spawn, 8000);
}

/* ══════════════════════════════
   HOUSE CANVAS — valódi lakás alaprajz
   ══════════════════════════════ */

// House bounding box (auto-calculated from layout)
const hBounds = { x1: 1, y1: 1, x2: 0, y2: 0 };
HOUSE_LAYOUT.forEach(el => {
  if (el.type === 'wall') {
    hBounds.x1 = Math.min(hBounds.x1, el.x1, el.x2);
    hBounds.y1 = Math.min(hBounds.y1, el.y1, el.y2);
    hBounds.x2 = Math.max(hBounds.x2, el.x1, el.x2);
    hBounds.y2 = Math.max(hBounds.y2, el.y1, el.y2);
  }
});
// Add padding
const hPad = 0.04;
hBounds.x1 -= hPad; hBounds.y1 -= hPad; hBounds.x2 += hPad; hBounds.y2 += hPad;
const hW = hBounds.x2 - hBounds.x1, hH = hBounds.y2 - hBounds.y1;

// Transform normalized coords to canvas coords — uniform scale, centered
function toCanvas(nx, ny, w, h) {
  const scaleX = w / hW, scaleY = h / hH;
  const scale = Math.min(scaleX, scaleY); // uniform
  const offsetX = (w - hW * scale) / 2;
  const offsetY = (h - hH * scale) / 2;
  return { x: (nx - hBounds.x1) * scale + offsetX, y: (ny - hBounds.y1) * scale + offsetY };
}
function fromCanvas(cx, cy, w, h) {
  const scaleX = w / hW, scaleY = h / hH;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (w - hW * scale) / 2;
  const offsetY = (h - hH * scale) / 2;
  return { x: (cx - offsetX) / scale + hBounds.x1, y: (cy - offsetY) / scale + hBounds.y1 };
}

function initHouseCanvas() {
  const hCanvas = document.getElementById('house-canvas');
  if (!hCanvas) return;

  // Hide old grid, show canvas
  grid.style.display = 'none';
  hCanvas.style.display = 'block';

  // Square canvas — uniform, no stretching
  const containerW = Math.min(700, window.innerWidth - 20);
  hCanvas.width = containerW * 2;
  hCanvas.height = containerW * 2;
  hCanvas.style.width = containerW + 'px';
  hCanvas.style.height = containerW + 'px';
  hCanvas.style.maxWidth = '100%';

  drawHouse(hCanvas);

  // Click handler — transform coords through house bounds
  hCanvas.addEventListener('click', (e) => {
    const rect = hCanvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width * hCanvas.width;
    const cy = (e.clientY - rect.top) / rect.height * hCanvas.height;
    const { x: nx, y: ny } = fromCanvas(cx, cy, hCanvas.width, hCanvas.height);

    // Check room zones
    for (const [roomName, zone] of Object.entries(ROOM_ZONES)) {
      if (nx >= zone.x1 && nx <= zone.x2 && ny >= zone.y1 && ny <= zone.y2) {
        const roomId = ROOM_MAPPING[roomName];
        if (!roomId) return;
        const room = ROOMS.find(r => r.id === roomId);
        if (room) onRoomClick(room);
        return;
      }
    }

    // Check entrance door (Széf)
    const dx = nx - ENTRANCE_DOOR.x, dy = ny - ENTRANCE_DOOR.y;
    if (Math.hypot(dx, dy) < 0.04) {
      const szef = ROOMS.find(r => r.isSecret);
      if (szef && areAllRoomsUnlocked(TOTAL_REGULAR)) onRoomClick(szef);
    }
  });
}

function drawHouse(hCanvas) {
  const ctx = hCanvas.getContext('2d');
  const w = hCanvas.width, h = hCanvas.height;

  // Clear
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, w, h);

  // Blueprint grid
  ctx.strokeStyle = 'rgba(65,140,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Draw walls
  HOUSE_LAYOUT.forEach(el => {
    if (el.type === 'wall') {
      const p1 = toCanvas(el.x1, el.y1, w, h);
      const p2 = toCanvas(el.x2, el.y2, w, h);
      // Wall body (thick)
      ctx.strokeStyle = 'rgba(100,170,255,0.2)';
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      // Wall outline
      ctx.strokeStyle = 'rgba(100,170,255,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
  });

  // Draw doors
  HOUSE_LAYOUT.forEach(el => {
    if (el.type === 'door') {
      const p = toCanvas(el.x, el.y, w, h);
      const doorR = 32;
      // Clear wall behind door
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(p.x - doorR - 4, p.y - doorR - 4, doorR * 2 + 8, doorR * 2 + 8);
      // Door arc
      ctx.strokeStyle = '#f6ad55';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, doorR, -Math.PI / 2, 0); ctx.stroke();
      // Door lines
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + doorR, p.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - doorR); ctx.stroke();
      // Door knob
      ctx.fillStyle = '#f6ad55';
      ctx.beginPath(); ctx.arc(p.x + doorR * 0.7, p.y - doorR * 0.15, 3, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Draw room fills (colored if unlocked)
  Object.entries(ROOM_ZONES).forEach(([roomName, zone]) => {
    const roomId = ROOM_MAPPING[roomName];
    const room = ROOMS.find(r => r.id === roomId);
    if (!room) return;

    const unlocked = isRoomUnlocked(roomId);
    const p1 = toCanvas(zone.x1, zone.y1, w, h);
    const p2 = toCanvas(zone.x2, zone.y2, w, h);
    const zx = p1.x, zy = p1.y, zw = p2.x - p1.x, zh = p2.y - p1.y;
    const cx = zx + zw / 2, cy = zy + zh / 2;

    if (unlocked) {
      // Colored glow fill
      ctx.fillStyle = room.color + '15';
      ctx.fillRect(zx + 4, zy + 4, zw - 8, zh - 8);
      // Border glow
      ctx.strokeStyle = room.color + '44';
      ctx.lineWidth = 2;
      ctx.strokeRect(zx + 4, zy + 4, zw - 8, zh - 8);
    }

    // Icon
    ctx.font = unlocked ? '36px sans-serif' : '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = unlocked ? 1 : 0.25;
    ctx.fillText(unlocked ? room.icon : '🔒', cx, cy);
    ctx.globalAlpha = 1;

    // Room name
    ctx.font = unlocked ? 'bold 16px JetBrains Mono' : '12px JetBrains Mono';
    ctx.fillStyle = unlocked ? room.color : 'rgba(255,255,255,0.2)';
    ctx.fillText(unlocked ? roomName : '???', cx, cy + 26);

    // Status
    if (unlocked) {
      ctx.font = '12px JetBrains Mono';
      ctx.fillStyle = '#68d391';
      ctx.fillText('✓ Felfedezve', cx, cy + 42);
    }
  });

  // Entrance door / Széf
  const ep = toCanvas(ENTRANCE_DOOR.x, ENTRANCE_DOOR.y, w, h);
  const ex = ep.x, ey = ep.y;
  const allDone = areAllRoomsUnlocked(TOTAL_REGULAR);

  if (allDone) {
    ctx.fillStyle = 'rgba(214,158,46,0.15)';
    ctx.beginPath(); ctx.arc(ex, ey - 35, 35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d69e2e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ex, ey - 35, 32, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🔓', ex, ey - 26);
    ctx.font = 'bold 12px JetBrains Mono';
    ctx.fillStyle = '#d69e2e';
    ctx.fillText('A SZÉF', ex, ey - 55);
  } else {
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.3;
    ctx.fillText('🔐', ex, ey - 26);
    ctx.globalAlpha = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('A SZÉF', ex, ey - 45);
  }

  // Title
  ctx.font = '14px JetBrains Mono';
  ctx.fillStyle = 'rgba(100,170,255,0.25)';
  ctx.textAlign = 'left';
  ctx.fillText('ALAPRAJZ — SZÜLINAPI MEGLEPETÉS HÁZ', 16, 28);
}

// Re-draw after unlock
const _origRenderRooms = renderRooms;
renderRooms = function() {
  _origRenderRooms();
  const hCanvas = document.getElementById('house-canvas');
  if (hCanvas) drawHouse(hCanvas);
};

// 5. Show the house
function showHouse() {
  blueprintHouse.style.display = 'block';
  blueprintHouse.classList.add('active');
}

// ══════════════════════════════
// BOOT SEQUENCE
// ══════════════════════════════

renderRooms();
initHouseCanvas();
spawnAnnotations();

(async () => {
  await runLoadingBar();
  await runCutscene();
  await runTutorial();
  showHouse();
})();
