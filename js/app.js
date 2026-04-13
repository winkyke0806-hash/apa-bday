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
      el.style.setProperty('--room-color', room.color);
      el.innerHTML = `
        <div class="room__icon">${room.icon}</div>
        <div class="room__name">${room.name}</div>
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
    szefEl.style.setProperty('--room-color', szef.color);
    szefEl.innerHTML = `
      <div class="room__icon">${szef.icon}</div>
      <div class="room__name">${szef.name}</div>
      <div class="room__status">🔓 Megnyílt!</div>
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

// Particle burst when a room is unlocked
function spawnUnlockParticles(roomEl, color) {
  const rect = roomEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    const dist = 30 + Math.random() * 40;
    const p = document.createElement('div');
    p.className = 'unlock-particle';
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.background = color;
    p.style.position = 'fixed';
    p.style.zIndex = '999';
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
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
            spawnUnlockParticles(roomEl, room.color);
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
