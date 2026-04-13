import { isRoomUnlocked, unlockRoom, getUnlockedCount, areAllRoomsUnlocked } from './progress.js';

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
  { id: 'kockagyar',       name: 'Kockagyár',           icon: '🧱', color: '#f56565', module: './rooms/kockagyar.js' },
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

function updateProgressBar() {
  const count = getUnlockedCount();
  const pct = Math.round((count / TOTAL_REGULAR) * 100);
  progressBar.style.width = pct + '%';
  progressGlow.style.width = pct + '%';
  progressText.textContent = `${count} / ${TOTAL_REGULAR} szoba felfedezve`;
}

function renderRooms() {
  grid.innerHTML = '';

  REGULAR_ROOMS.forEach(room => {
    const unlocked = isRoomUnlocked(room.id);
    const el = document.createElement('div');
    el.className = `room ${unlocked ? 'room--unlocked' : 'room--locked'}`;
    el.dataset.roomId = room.id;

    if (unlocked) {
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
    } else {
      el.innerHTML = `
        <div class="room__icon">🔒</div>
        <div class="room__name room__name--hidden">???</div>
        <div class="room__dimensions">${randomDimension()}</div>
      `;
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
  grid.appendChild(szefEl);

  updateProgressBar();
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
        showView('house');
        renderRooms();

        // Find the newly unlocked room element and animate it
        requestAnimationFrame(() => {
          const roomEl = grid.querySelector(`[data-room-id="${room.id}"]`);
          if (roomEl) {
            roomEl.classList.add('room--just-unlocked');
            spawnUnlockEffect(roomEl, room.color);
          }
        });
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

// Loading sequence
const loadingScreen = document.getElementById('loading-screen');

function startLoadingSequence() {
  setTimeout(() => {
    loadingScreen.classList.add('hide');
    setTimeout(() => loadingScreen.style.display = 'none', 1000);
  }, 2000);
}

renderRooms();
startLoadingSequence();
