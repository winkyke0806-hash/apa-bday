# Meglepetés Szülinapi Weboldal — Implementációs Terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Interaktív szülinapi meglepetés weboldal blueprint ház stílusban, 12 szobával és minijátékokkal, GitHub Pages-re deploy-olva.

**Architecture:** Single-page application vanilla HTML/CSS/JS-ben. A főoldal egy blueprint tervrajz ami szobákat jelenít meg. Minden szoba kattintható — zárt szoba minijátékot indít, feloldott szoba tartalmat mutat. A state localStorage-ban perzisztál. A minijátékok önálló JS modulok, közös interface-szel.

**Tech Stack:** HTML5, CSS3 (grid, custom properties, animations), Vanilla JS (ES6+ modules), Leaflet.js (CDN), Canvas API, localStorage, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-04-13-birthday-surprise-website-design.md`

---

## Fájlstruktúra

```
index.html                — Egyetlen HTML oldal (SPA)
css/
  style.css               — Blueprint téma, globális stílusok, reszponzív grid
  animations.css          — Kiszínesedés, konfetti, glow, átmenetek
js/
  app.js                  — Belépési pont, szoba renderelés, navigáció, overlay kezelés
  progress.js             — localStorage CRUD, szoba állapotok, progress bar
  minigame-base.js        — Közös minijáték interface (init, succeed, fail, hint, skip)
  rooms/
    hangok-terme.js       — Dallam-felismerő minijáték + tartalom
    emlekek-kamraja.js    — Memóriajáték + fotógaléria
    vilagjaro.js          — Térkép-kvíz + Leaflet térkép
    agytornaterem.js      — Kvíz + fun facts
    leveleslada.js        — Puzzle kirakó + üzenetek
    moziterem.js          — Torta-készítő + videók
    idokapszula.js        — Sorba rendezés + idővonal
    kalandorok.js         — Képfelismerő + kaland emlékek
    ajandekraktar.js      — Kaparós sorsjegy + kuponok
    furcsa-konyha.js      — Összetevő-keverő + receptek
    kockagyar.js          — Lego építő + építmény
    a-szef.js             — Finale konfetti + összesítő
assets/
  photos/                 — Családi fotók (placeholder-ek amíg a user cseréli)
  audio/                  — Zenei részletek
  video/                  — Videó üzenetek
```

---

## Task 1: Projekt alap és HTML váz

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `js/progress.js`
- Create: `.gitignore`
- Create: `assets/photos/.gitkeep`
- Create: `assets/audio/.gitkeep`
- Create: `assets/video/.gitkeep`

- [ ] **Step 1: Hozd létre a .gitignore fájlt**

```
.env
.env.local
.superpowers/
.DS_Store
Thumbs.db
node_modules/
```

- [ ] **Step 2: Hozd létre az index.html alapvázat**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎂 Boldog Szülinapot, Apu!</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/animations.css">
</head>
<body>
  <!-- Főoldal: Blueprint ház -->
  <div id="blueprint-house" class="view active">
    <header class="house-header">
      <h1 class="house-title">Boldog Szülinapot, Apu!</h1>
      <p class="house-subtitle">Fedezd fel a szobákat — minden ajtó mögött meglepetés vár!</p>
    </header>

    <div class="progress-bar-container">
      <div class="progress-bar" id="progress-bar"></div>
      <span class="progress-text" id="progress-text">0 / 11 szoba felfedezve</span>
    </div>

    <div class="room-grid" id="room-grid">
      <!-- Szobák JS-ből renderelődnek -->
    </div>
  </div>

  <!-- Minijáték overlay -->
  <div id="minigame-overlay" class="view overlay">
    <button class="back-btn" id="back-to-house" aria-label="Vissza a házba">✕</button>
    <div id="minigame-container"></div>
  </div>

  <!-- Tartalom overlay -->
  <div id="content-overlay" class="view overlay">
    <button class="back-btn" id="back-from-content" aria-label="Vissza a házba">✕</button>
    <div id="content-container"></div>
  </div>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Hozd létre a progress.js modult**

```javascript
// js/progress.js
const STORAGE_KEY = 'apu-bday-progress';

export function getProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function isRoomUnlocked(roomId) {
  return !!getProgress()[roomId];
}

export function unlockRoom(roomId) {
  const progress = getProgress();
  progress[roomId] = { unlockedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    console.warn('localStorage nem elérhető — progress nem mentve');
  }
}

export function getUnlockedCount() {
  return Object.keys(getProgress()).length;
}

export function areAllRoomsUnlocked(totalRooms) {
  return getUnlockedCount() >= totalRooms;
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
}
```

- [ ] **Step 4: Hozd létre az app.js alapot a szoba adatokkal és renderelővel**

```javascript
// js/app.js
import { getProgress, isRoomUnlocked, unlockRoom, getUnlockedCount, areAllRoomsUnlocked } from './progress.js';

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

  // A Széf megjelenítése ha minden feloldva
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

async function onRoomClick(room) {
  const unlocked = isRoomUnlocked(room.id);

  if (room.isSecret && !areAllRoomsUnlocked(TOTAL_REGULAR)) return;

  try {
    const mod = await import(room.module);

    if (unlocked || room.isSecret) {
      // Tartalom megjelenítése
      contentContainer.innerHTML = '';
      mod.renderContent(contentContainer, room);
      showView('content');
    } else {
      // Minijáték indítása
      minigameContainer.innerHTML = '';
      mod.renderMinigame(minigameContainer, room, () => {
        unlockRoom(room.id);
        showView('house');
        renderRooms();
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

// Init
renderRooms();
```

- [ ] **Step 5: Hozd létre az assets mappákat és .gitkeep fájlokat**

```bash
mkdir -p assets/photos assets/audio assets/video
touch assets/photos/.gitkeep assets/audio/.gitkeep assets/video/.gitkeep
```

- [ ] **Step 6: Nyisd meg böngészőben és ellenőrizd**

Futtass egy helyi szervert: `npx serve .` vagy `python -m http.server 8000`
Ellenőrizd:
- Az oldal betölt, kék blueprint háttér látható
- 12 szoba jelenik meg (11 zárt + A Széf)
- A progress bar 0/11-et mutat
- Zárt szobára kattintva (még) nem történik semmi (a modulok még nem léteznek)

- [ ] **Step 7: Commit**

```bash
git init
git add .gitignore index.html css/ js/app.js js/progress.js assets/
git commit -m "feat: projekt alap — HTML váz, blueprint ház, szoba renderelő, progress kezelés"
```

---

## Task 2: Blueprint CSS téma

**Files:**
- Create: `css/style.css`
- Create: `css/animations.css`

- [ ] **Step 1: Hozd létre a style.css-t a teljes blueprint témával**

```css
/* css/style.css */

/* === CSS Custom Properties === */
:root {
  --bp-bg: #0a1628;
  --bp-grid: rgba(255, 255, 255, 0.03);
  --bp-line: rgba(255, 255, 255, 0.15);
  --bp-line-strong: rgba(255, 255, 255, 0.25);
  --bp-text: rgba(255, 255, 255, 0.4);
  --bp-text-dim: rgba(255, 255, 255, 0.15);
  --bp-accent: #f6ad55;
  --bp-success: #68d391;
  --bp-locked: rgba(255, 255, 255, 0.05);
  --font-blueprint: 'Courier New', Courier, monospace;
  --font-display: Georgia, 'Times New Roman', serif;
}

/* === Reset === */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-blueprint);
  background: var(--bp-bg);
  color: white;
  min-height: 100vh;
  overflow-x: hidden;
  background-image:
    linear-gradient(var(--bp-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--bp-grid) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* === Views === */
.view { display: none; }
.view.active { display: block; }
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--bp-bg);
  overflow-y: auto;
  padding: 24px;
}
.overlay.active { display: flex; flex-direction: column; align-items: center; }

/* === Header === */
.house-header {
  text-align: center;
  padding: 40px 20px 20px;
}

.house-title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 3rem);
  color: var(--bp-accent);
  text-shadow: 0 0 30px rgba(246, 173, 85, 0.3);
  letter-spacing: 2px;
}

.house-subtitle {
  font-size: clamp(0.8rem, 2vw, 1rem);
  color: var(--bp-text);
  margin-top: 8px;
  letter-spacing: 1px;
}

/* === Progress Bar === */
.progress-bar-container {
  max-width: 500px;
  margin: 20px auto;
  padding: 0 20px;
  position: relative;
}

.progress-bar-container::before {
  content: '';
  display: block;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 20px;
  height: 6px;
  width: 0%;
  background: linear-gradient(90deg, var(--bp-accent), #ed8936);
  border-radius: 20px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  color: var(--bp-text);
  margin-top: 8px;
}

/* === Room Grid === */
.room-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
  max-width: 700px;
  margin: 30px auto;
  padding: 24px;
  border: 1px dashed var(--bp-line-strong);
  position: relative;
}

/* Blueprint "ALAPRAJZ" felirat */
.room-grid::before {
  content: 'ALAPRAJZ — M 1:50';
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 0.65rem;
  color: var(--bp-text-dim);
  letter-spacing: 2px;
}

/* === Room Tiles === */
.room {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
}

/* Locked room: blueprint style */
.room--locked {
  border: 1px dashed var(--bp-line);
  background: var(--bp-locked);
}

.room--locked:hover {
  border-color: var(--bp-line-strong);
  background: rgba(255, 255, 255, 0.08);
}

.room--locked .room__icon {
  font-size: 1.5rem;
  opacity: 0.3;
}

.room--locked .room__name--hidden {
  font-size: 0.65rem;
  color: var(--bp-text);
  margin-top: 4px;
}

.room--locked .room__dimensions {
  font-size: 0.55rem;
  color: var(--bp-text-dim);
  margin-top: 2px;
}

/* Unlocked room: colorful, alive */
.room--unlocked {
  border: 2px solid var(--room-color);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  box-shadow: 0 0 20px color-mix(in srgb, var(--room-color) 30%, transparent);
  animation: roomGlow 3s ease-in-out infinite alternate;
}

.room--unlocked:hover {
  transform: scale(1.03);
  box-shadow: 0 0 30px color-mix(in srgb, var(--room-color) 50%, transparent);
}

.room--unlocked .room__icon {
  font-size: 1.8rem;
}

.room--unlocked .room__name {
  font-size: 0.7rem;
  color: var(--room-color);
  font-weight: bold;
  margin-top: 4px;
}

.room--unlocked .room__status {
  font-size: 0.6rem;
  color: var(--bp-success);
  margin-top: 2px;
}

/* Secret room: A Széf */
.room--secret {
  grid-column: 2 / 4;
}

.room--secret.room--locked {
  border: 2px dashed rgba(214, 158, 46, 0.3);
}

.room--secret .room__status--locked {
  font-size: 0.55rem;
  color: var(--bp-text);
  margin-top: 4px;
}

/* === Back Button === */
.back-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* === Minigame & Content Container === */
#minigame-container,
#content-container {
  width: 100%;
  max-width: 700px;
  margin: 40px auto 0;
}

/* === Közös minijáték stílusok === */
.minigame-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--bp-accent);
  text-align: center;
  margin-bottom: 8px;
}

.minigame-instructions {
  font-size: 0.85rem;
  color: var(--bp-text);
  text-align: center;
  margin-bottom: 24px;
}

.minigame-btn {
  display: inline-block;
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--bp-accent), #ed8936);
  color: var(--bp-bg);
  border: none;
  border-radius: 8px;
  font-family: var(--font-blueprint);
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.minigame-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(246, 173, 85, 0.4);
}

.minigame-btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.minigame-success {
  text-align: center;
  padding: 40px 20px;
}

.minigame-success h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--bp-success);
  margin-bottom: 12px;
}

/* === Közös tartalom stílusok === */
.content-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 24px;
}

.content-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.content-gallery img {
  width: 100%;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.content-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

/* === Reszponzív === */
@media (max-width: 768px) {
  .room-grid {
    grid-template-columns: repeat(3, 1fr);
    padding: 16px;
    margin: 20px 12px;
  }
  .room--secret { grid-column: 1 / -1; }
}

@media (max-width: 480px) {
  .room-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .house-header { padding: 24px 16px 12px; }
  .room { padding: 10px 6px; }
  .room--unlocked .room__icon { font-size: 1.4rem; }
}
```

- [ ] **Step 2: Hozd létre az animations.css-t**

```css
/* css/animations.css */

/* === Szoba glow animáció === */
@keyframes roomGlow {
  from { box-shadow: 0 0 15px color-mix(in srgb, var(--room-color) 20%, transparent); }
  to   { box-shadow: 0 0 25px color-mix(in srgb, var(--room-color) 40%, transparent); }
}

/* === Szoba feloldás animáció (blueprint → színes) === */
@keyframes roomUnlock {
  0% {
    border-style: dashed;
    border-color: var(--bp-line);
    background: var(--bp-locked);
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
    border-style: solid;
  }
  100% {
    border-style: solid;
    border-color: var(--room-color);
    background: rgba(255, 255, 255, 0.05);
    transform: scale(1);
  }
}

.room--just-unlocked {
  animation: roomUnlock 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* === Konfetti === */
@keyframes confettiFall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.confetti-piece {
  position: fixed;
  width: 10px;
  height: 10px;
  top: -10px;
  z-index: 1000;
  animation: confettiFall var(--fall-duration, 3s) linear forwards;
  animation-delay: var(--fall-delay, 0s);
}

/* === Fade-in === */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.5s ease forwards;
}

/* === Overlay átmenetek === */
.overlay {
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.overlay.active {
  opacity: 1;
  pointer-events: all;
}

/* === Pulse (hint gomb) === */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

- [ ] **Step 3: Nyisd meg böngészőben és ellenőrizd**

Ellenőrizd:
- Kék blueprint háttér rácsvonalakkal
- "ALAPRAJZ — M 1:50" felirat a grid felett
- Zárt szobák szaggatott vonallal, halványan
- A Széf az alsó sorban, szélesebben
- Progress bar 0%-on
- Reszponzív: méretezd át az ablakot (4 → 3 → 2 oszlop)

- [ ] **Step 4: Commit**

```bash
git add css/
git commit -m "feat: blueprint CSS téma — tervrajz stílus, animációk, reszponzív grid"
```

---

## Task 3: Minijáték alap keretrendszer

**Files:**
- Create: `js/minigame-base.js`

- [ ] **Step 1: Hozd létre a minijáték base modult**

```javascript
// js/minigame-base.js

/**
 * Minden szoba modul exportál két függvényt:
 *   renderMinigame(container, room, onSuccess)
 *   renderContent(container, room)
 *
 * Ez a modul segédfüggvényeket ad a minijátékokhoz.
 */

// Sikeres befejezés UI
export function showSuccess(container, room, onSuccess, message = 'Szoba feloldva!') {
  container.innerHTML = `
    <div class="minigame-success fade-in">
      <div style="font-size:4rem; margin-bottom:16px;">${room.icon}</div>
      <h2>${message}</h2>
      <p style="color:rgba(255,255,255,0.6); margin-bottom:24px;">
        A <strong style="color:${room.color}">${room.name}</strong> most már elérhető!
      </p>
      <button class="minigame-btn" id="minigame-done">Megnézem! →</button>
    </div>
  `;
  container.querySelector('#minigame-done').addEventListener('click', onSuccess);
  launchMiniConfetti(container);
}

// Hint/skip rendszer
export function createHintSkip(container, hints, onSkip) {
  let attempts = 0;
  let hintIndex = 0;

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex; gap:8px; justify-content:center; margin-top:16px;';

  const hintBtn = document.createElement('button');
  hintBtn.className = 'minigame-btn minigame-btn--secondary';
  hintBtn.textContent = '💡 Segítség';
  hintBtn.addEventListener('click', () => {
    if (hintIndex < hints.length) {
      showHint(container, hints[hintIndex]);
      hintIndex++;
    }
  });

  const skipBtn = document.createElement('button');
  skipBtn.className = 'minigame-btn minigame-btn--secondary';
  skipBtn.textContent = '⏭️ Átugrom';
  skipBtn.style.display = 'none';

  skipBtn.addEventListener('click', onSkip);

  bar.appendChild(hintBtn);
  bar.appendChild(skipBtn);
  container.appendChild(bar);

  return {
    recordAttempt() {
      attempts++;
      if (attempts >= 5) {
        skipBtn.style.display = 'inline-block';
        skipBtn.classList.add('pulse');
      }
    }
  };
}

function showHint(container, text) {
  let hintEl = container.querySelector('.hint-text');
  if (!hintEl) {
    hintEl = document.createElement('p');
    hintEl.className = 'hint-text';
    hintEl.style.cssText = 'text-align:center; color:#f6ad55; font-size:0.85rem; margin-top:12px; font-style:italic;';
    container.appendChild(hintEl);
  }
  hintEl.textContent = `💡 ${text}`;
}

// Mini konfetti effekt (szoba feloldáskor)
function launchMiniConfetti(container) {
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3'];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--fall-duration', (2 + Math.random() * 2) + 's');
    piece.style.setProperty('--fall-delay', Math.random() * 0.5 + 's');
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

// Keverő segédfüggvény (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Step 2: Ellenőrizd hogy az import működik**

Ideiglenesen adj hozzá egy teszt szoba modult:
```javascript
// js/rooms/hangok-terme.js (ideiglenes placeholder)
import { showSuccess } from '../minigame-base.js';

export function renderMinigame(container, room, onSuccess) {
  container.innerHTML = `
    <h2 class="minigame-title">${room.name}</h2>
    <p class="minigame-instructions">Teszt minijáték — kattints a gombra</p>
    <div style="text-align:center">
      <button class="minigame-btn" id="test-win">Teszt: Megnyertem!</button>
    </div>
  `;
  container.querySelector('#test-win').addEventListener('click', () => {
    showSuccess(container, room, onSuccess);
  });
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">${room.icon} ${room.name}</h2>
    <div class="content-card"><p>Tartalom hamarosan...</p></div>
  `;
}
```

- [ ] **Step 3: Böngészőben ellenőrizd**

Ellenőrizd:
- Zárt szobára (Hangok Terme) kattintva megnyílik a minijáték overlay
- A "Teszt: Megnyertem!" gomb konfettit dob és sikeres üzenetet mutat
- "Megnézem!" gombra a szoba kiszínesedik a tervrajzon
- A feloldott szobára kattintva a tartalom overlay nyílik meg
- Progress bar frissül (1/11)
- Oldal újratöltés után a szoba továbbra is feloldva marad (localStorage)

- [ ] **Step 4: Commit**

```bash
git add js/minigame-base.js js/rooms/hangok-terme.js
git commit -m "feat: minijáték keretrendszer — success UI, hint/skip, konfetti, shuffle"
```

---

## Task 4: Hangok Terme — Dallam-felismerő

**Files:**
- Modify: `js/rooms/hangok-terme.js`

- [ ] **Step 1: Írd meg a dallam-felismerő minijátékot**

```javascript
// js/rooms/hangok-terme.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// A felhasználó cseréli saját dalokra/hangfájlokra
const SONGS = [
  { title: 'Dal 1', file: 'assets/audio/song1.mp3', hint: 'Ez a kedvencünk nyáron' },
  { title: 'Dal 2', file: 'assets/audio/song2.mp3', hint: 'Ezt szoktuk autóban hallgatni' },
  { title: 'Dal 3', file: 'assets/audio/song3.mp3', hint: 'Karácsonykor mindig ez megy' },
];

// Playlist tartalom a feloldás után
const PLAYLIST = [
  { title: 'Kedvenc dal 1', artist: 'Előadó 1' },
  { title: 'Kedvenc dal 2', artist: 'Előadó 2' },
  { title: 'Kedvenc dal 3', artist: 'Előadó 3' },
  { title: 'Kedvenc dal 4', artist: 'Előadó 4' },
  { title: 'Kedvenc dal 5', artist: 'Előadó 5' },
];

export function renderMinigame(container, room, onSuccess) {
  let currentRound = 0;
  let score = 0;
  const rounds = shuffle(SONGS).slice(0, 3);

  function renderRound() {
    if (currentRound >= rounds.length) {
      showSuccess(container, room, onSuccess, `${score}/${rounds.length} helyes — Szoba feloldva!`);
      return;
    }

    const song = rounds[currentRound];
    const options = shuffle([song.title, ...getDecoys(song.title)]);

    container.innerHTML = `
      <h2 class="minigame-title">🎵 Hangok Terme</h2>
      <p class="minigame-instructions">${currentRound + 1}/${rounds.length} — Melyik dal szól?</p>
      <div style="text-align:center; margin-bottom:20px;">
        <button class="minigame-btn" id="play-btn">▶ Lejátszás</button>
        <audio id="song-audio" src="${song.file}" preload="auto"></audio>
      </div>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === song.title) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
        }
        setTimeout(() => { currentRound++; renderRound(); }, 800);
      });
      optionsEl.appendChild(btn);
    });

    container.querySelector('#play-btn').addEventListener('click', () => {
      const audio = container.querySelector('#song-audio');
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setTimeout(() => audio.pause(), 5000); // 5 mp részlet
    });

    const hintSkip = createHintSkip(container,
      [song.hint, `A dal "${song.title.charAt(0)}..." betűvel kezdődik`],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderRound();
}

function getDecoys(correctTitle) {
  const all = SONGS.map(s => s.title).filter(t => t !== correctTitle);
  return shuffle(all).slice(0, 2);
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🎵 Hangok Terme</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      A közös kedvenc dalaink gyűjteménye
    </p>
    <div class="playlist">
      ${PLAYLIST.map((s, i) => `
        <div class="content-card" style="display:flex; align-items:center; gap:16px;">
          <span style="font-size:1.5rem; color:${room.color};">${i + 1}</span>
          <div>
            <strong>${s.title}</strong>
            <div style="font-size:0.8rem; color:rgba(255,255,255,0.5);">${s.artist}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd**

Ellenőrizd:
- Zárt szobára kattintva a dallam-felismerő indul
- 3 kör megy, mindegyiknél 3 válaszlehetőség
- Helyes válasz: zöld, helytelen: piros
- 3 kör után sikeres feloldás
- Segítség gomb tippet ad
- 5 sikertelen próba után Átugrom gomb megjelenik
- Feloldott szobára kattintva a playlist jelenik meg

- [ ] **Step 3: Commit**

```bash
git add js/rooms/hangok-terme.js
git commit -m "feat: Hangok Terme — dallam-felismerő minijáték és playlist tartalom"
```

---

## Task 5: Emlékek Kamrája — Memóriajáték

**Files:**
- Create: `js/rooms/emlekek-kamraja.js`

- [ ] **Step 1: Írd meg a memóriajáték modult**

```javascript
// js/rooms/emlekek-kamraja.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// Placeholder fotók — a user cseréli sajátjára
const PHOTOS = [
  { id: 1, src: 'assets/photos/memory1.jpg', alt: 'Emlék 1' },
  { id: 2, src: 'assets/photos/memory2.jpg', alt: 'Emlék 2' },
  { id: 3, src: 'assets/photos/memory3.jpg', alt: 'Emlék 3' },
  { id: 4, src: 'assets/photos/memory4.jpg', alt: 'Emlék 4' },
  { id: 5, src: 'assets/photos/memory5.jpg', alt: 'Emlék 5' },
  { id: 6, src: 'assets/photos/memory6.jpg', alt: 'Emlék 6' },
];

const GALLERY_PHOTOS = [
  { src: 'assets/photos/gallery1.jpg', caption: 'Képaláírás 1' },
  { src: 'assets/photos/gallery2.jpg', caption: 'Képaláírás 2' },
  { src: 'assets/photos/gallery3.jpg', caption: 'Képaláírás 3' },
  { src: 'assets/photos/gallery4.jpg', caption: 'Képaláírás 4' },
  { src: 'assets/photos/gallery5.jpg', caption: 'Képaláírás 5' },
  { src: 'assets/photos/gallery6.jpg', caption: 'Képaláírás 6' },
];

export function renderMinigame(container, room, onSuccess) {
  // 6 pár = 12 kártya
  const cards = shuffle([...PHOTOS, ...PHOTOS].map((p, i) => ({ ...p, uid: i })));
  let flipped = [];
  let matched = 0;
  let locked = false;

  container.innerHTML = `
    <h2 class="minigame-title">📸 Emlékek Kamrája</h2>
    <p class="minigame-instructions">Találd meg a párokat! Fordíts fel két kártyát egyszerre.</p>
    <div class="memory-grid" id="memory-grid" style="
      display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
      max-width:500px; margin:0 auto;
    "></div>
  `;

  const gridEl = container.querySelector('#memory-grid');

  cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    el.dataset.index = index;
    el.style.cssText = `
      aspect-ratio:1; border-radius:8px; cursor:pointer;
      background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
      display:flex; align-items:center; justify-content:center;
      font-size:2rem; transition:all 0.3s; position:relative; overflow:hidden;
    `;
    el.textContent = '?';

    el.addEventListener('click', () => {
      if (locked || flipped.includes(index) || el.dataset.matched) return;

      // Flip
      el.style.background = `url(${card.src}) center/cover`;
      el.textContent = '';
      el.style.borderColor = room.color;
      flipped.push(index);

      if (flipped.length === 2) {
        locked = true;
        const [i1, i2] = flipped;
        const c1 = cards[i1];
        const c2 = cards[i2];

        if (c1.id === c2.id) {
          // Match
          matched++;
          gridEl.children[i1].dataset.matched = true;
          gridEl.children[i2].dataset.matched = true;
          flipped = [];
          locked = false;

          if (matched === PHOTOS.length) {
            setTimeout(() => {
              showSuccess(container, room, onSuccess, 'Minden párt megtaláltál!');
            }, 500);
          }
        } else {
          // No match — flip back
          hintSkip.recordAttempt();
          setTimeout(() => {
            gridEl.children[i1].style.background = 'rgba(255,255,255,0.08)';
            gridEl.children[i1].style.borderColor = 'rgba(255,255,255,0.15)';
            gridEl.children[i1].textContent = '?';
            gridEl.children[i2].style.background = 'rgba(255,255,255,0.08)';
            gridEl.children[i2].style.borderColor = 'rgba(255,255,255,0.15)';
            gridEl.children[i2].textContent = '?';
            flipped = [];
            locked = false;
          }, 800);
        }
      }
    });

    gridEl.appendChild(el);
  });

  const hintSkip = createHintSkip(container,
    ['Próbáld a sarkokból indulni', 'Figyelj a színekre — hasonló fotók párban vannak'],
    () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">📸 Emlékek Kamrája</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      A legszebb közös emlékeink
    </p>
    <div class="content-gallery">
      ${GALLERY_PHOTOS.map(p => `
        <div style="text-align:center;">
          <img src="${p.src}" alt="${p.caption}"
            style="width:100%; border-radius:8px; border:2px solid rgba(255,255,255,0.1);"
            onerror="this.style.background='rgba(255,255,255,0.05)'; this.style.minHeight='150px'; this.alt='${p.caption}';">
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:6px;">${p.caption}</p>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd**

Ellenőrizd:
- 4x3-as kártya rács jelenik meg
- Kattintásra a kártya "felfordul" (képet mutat)
- Két egyforma kártya marad, különböző visszafordul
- Mind megtalálva → siker + konfetti
- Placeholder fotók nélkül is működik (? marad, de a logika megy)

- [ ] **Step 3: Commit**

```bash
git add js/rooms/emlekek-kamraja.js
git commit -m "feat: Emlékek Kamrája — memóriajáték és fotógaléria"
```

---

## Task 6: A Nagy Világjáró — Térkép-kvíz + Leaflet

**Files:**
- Create: `js/rooms/vilagjaro.js`
- Modify: `index.html` (Leaflet CDN hozzáadása)

- [ ] **Step 1: Add hozzá a Leaflet CDN-t az index.html head-jéhez**

Az `index.html` `<head>` részébe, a saját CSS-ek elé:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

- [ ] **Step 2: Írd meg a térkép-kvíz modult**

```javascript
// js/rooms/vilagjaro.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// A user cseréli saját utazásokra
const TRIPS = [
  { year: 2019, place: 'Horvátország', lat: 43.5, lng: 16.4, photo: 'assets/photos/trip1.jpg', story: 'A legjobb nyaralásunk!' },
  { year: 2020, place: 'Balaton',      lat: 46.8, lng: 17.7, photo: 'assets/photos/trip2.jpg', story: 'Egész nyáron itt voltunk.' },
  { year: 2021, place: 'Bécs',         lat: 48.2, lng: 16.4, photo: 'assets/photos/trip3.jpg', story: 'A Prater óriáskereke!' },
  { year: 2022, place: 'Olaszország',  lat: 41.9, lng: 12.5, photo: 'assets/photos/trip4.jpg', story: 'Pizza és gelato mindenhol.' },
  { year: 2023, place: 'Prága',        lat: 50.1, lng: 14.4, photo: 'assets/photos/trip5.jpg', story: 'Gyönyörű város volt.' },
];

export function renderMinigame(container, room, onSuccess) {
  const questions = shuffle(TRIPS).slice(0, 3);
  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      showSuccess(container, room, onSuccess, `${score}/${questions.length} helyes — Szoba feloldva!`);
      return;
    }

    const q = questions[currentQ];
    const options = shuffle([q.place, ...getDecoys(q.place)]);

    container.innerHTML = `
      <h2 class="minigame-title">🗺️ A Nagy Világjáró</h2>
      <p class="minigame-instructions">${currentQ + 1}/${questions.length} — Hol voltunk ${q.year}-ben?</p>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === q.place) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { currentQ++; renderQuestion(); }, 800);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container,
      [`${q.year}-ben valahol ${q.place.charAt(0)}...-ban voltunk`],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderQuestion();
}

function getDecoys(correct) {
  const all = TRIPS.map(t => t.place).filter(p => p !== correct);
  return shuffle(all).slice(0, 2);
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🗺️ A Nagy Világjáró</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Közös utazásaink térképe
    </p>
    <div id="travel-map" style="height:400px; border-radius:12px; border:2px solid rgba(255,255,255,0.1); margin-bottom:24px;"></div>
    <div id="trip-list"></div>
  `;

  // Leaflet térkép
  setTimeout(() => {
    const map = L.map('travel-map').setView([47, 15], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    TRIPS.forEach(trip => {
      const marker = L.marker([trip.lat, trip.lng]).addTo(map);
      marker.bindPopup(`
        <strong>${trip.place} (${trip.year})</strong><br>
        <em>${trip.story}</em>
      `);
    });
  }, 100);

  const listEl = container.querySelector('#trip-list');
  TRIPS.sort((a, b) => a.year - b.year).forEach(trip => {
    listEl.innerHTML += `
      <div class="content-card" style="display:flex; gap:16px; align-items:center;">
        <div style="font-size:1.4rem; font-weight:bold; color:${room.color};">${trip.year}</div>
        <div>
          <strong>${trip.place}</strong>
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:4px;">${trip.story}</p>
        </div>
      </div>
    `;
  });
}
```

- [ ] **Step 3: Böngészőben ellenőrizd**

Ellenőrizd:
- Térkép-kvíz: "Hol voltunk 20XX-ben?" kérdések jelennek meg
- Helyes/helytelen vizuális visszajelzés
- Feloldás után: interaktív Leaflet térkép marker-ekkel
- Marker-re kattintva popup a hely nevével és sztorival

- [ ] **Step 4: Commit**

```bash
git add index.html js/rooms/vilagjaro.js
git commit -m "feat: A Nagy Világjáró — térkép-kvíz és Leaflet utazási térkép"
```

---

## Task 7: Agytornaterem — Kvíz apukádról

**Files:**
- Create: `js/rooms/agytornaterem.js`

- [ ] **Step 1: Írd meg a kvíz modult**

```javascript
// js/rooms/agytornaterem.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// A user cseréli saját kérdésekre
const QUESTIONS = [
  { q: 'Mi Apu kedvenc étele?', options: ['Pörkölt', 'Gulyás', 'Rántott hús', 'Pizza'], correct: 'Pörkölt', hint: 'Magyar konyha klasszikus' },
  { q: 'Hány éves korában tanult meg biciklizni?', options: ['4', '5', '6', '7'], correct: '5', hint: 'Óvodás volt még' },
  { q: 'Mi Apu kedvenc filmje?', options: ['Terminator', 'Die Hard', 'Star Wars', 'Indiana Jones'], correct: 'Die Hard', hint: 'Bruce Willis a főszereplő' },
  { q: 'Melyik zenekar a kedvence?', options: ['Queen', 'AC/DC', 'Metallica', 'Beatles'], correct: 'Queen', hint: 'Freddie Mercury' },
  { q: 'Hol született Apu?', options: ['Budapest', 'Debrecen', 'Szeged', 'Győr'], correct: 'Budapest', hint: 'A fővárosban' },
];

const FUN_FACTS = [
  'Apu 3 éves korában már LEGO-zott!',
  'A legtöbb nyaralásunkon Apu volt a sofőr — összesen kb. 50,000 km-t vezetett miattunk.',
  'Apu kedvenc napszaka a reggel, mert akkor a legcsendesebb.',
];

export function renderMinigame(container, room, onSuccess) {
  const questions = shuffle(QUESTIONS).slice(0, 4);
  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      const rating = score === questions.length ? 'Tökéletes! Te aztán ismered Aput!' :
                     score >= 2 ? 'Szép eredmény!' : 'Hát... gyakorolj még! 😄';
      showSuccess(container, room, onSuccess, `${score}/${questions.length} — ${rating}`);
      return;
    }

    const q = questions[currentQ];
    const options = shuffle(q.options);

    container.innerHTML = `
      <h2 class="minigame-title">🧠 Agytornaterem</h2>
      <p class="minigame-instructions">${currentQ + 1}/${questions.length} — ${q.q}</p>
      <div id="options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === q.correct) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          // Mutasd a helyes választ
          [...optionsEl.children].find(b => b.textContent === q.correct).style.background = 'rgba(104, 211, 145, 0.2)';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { currentQ++; renderQuestion(); }, 1000);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container,
      [q.hint],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderQuestion();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🧠 Agytornaterem</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Tudtad-e? — Fun Facts Apuról
    </p>
    ${FUN_FACTS.map(fact => `
      <div class="content-card">
        <p style="font-size:1rem;">💡 ${fact}</p>
      </div>
    `).join('')}
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/agytornaterem.js
git commit -m "feat: Agytornaterem — kvíz apukádról és fun facts"
```

---

## Task 8: Titkos Levelesláda — Puzzle kirakó

**Files:**
- Create: `js/rooms/leveleslada.js`

- [ ] **Step 1: Írd meg a puzzle kirakó modult**

```javascript
// js/rooms/leveleslada.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const PUZZLE_IMAGE = 'assets/photos/puzzle.jpg'; // A user cseréli
const GRID_SIZE = 3; // 3x3 puzzle

const MESSAGES = [
  { from: 'Tőlem', text: 'Boldog szülinapot Apu! Nagyon szeretlek és hálás vagyok mindenért amit értem teszel. ❤️' },
  { from: 'Családtag 1', text: 'Isten éltessen sokáig! Minden jót kívánunk neked!' },
  { from: 'Családtag 2', text: 'Boldog születésnapot! Remélem szép napod lesz!' },
];

export function renderMinigame(container, room, onSuccess) {
  const totalPieces = GRID_SIZE * GRID_SIZE;
  const pieces = shuffle(Array.from({ length: totalPieces }, (_, i) => i));
  let selected = null;

  container.innerHTML = `
    <h2 class="minigame-title">💌 Titkos Levelesláda</h2>
    <p class="minigame-instructions">Rakd ki a képet! Kattints két darabra a cseréhez.</p>
    <div id="puzzle-grid" style="
      display:grid; grid-template-columns:repeat(${GRID_SIZE}, 1fr); gap:2px;
      max-width:350px; margin:0 auto; aspect-ratio:1;
    "></div>
  `;

  const gridEl = container.querySelector('#puzzle-grid');

  function renderPuzzle() {
    gridEl.innerHTML = '';
    pieces.forEach((pieceIndex, pos) => {
      const el = document.createElement('div');
      const row = Math.floor(pieceIndex / GRID_SIZE);
      const col = pieceIndex % GRID_SIZE;

      el.style.cssText = `
        aspect-ratio:1; cursor:pointer; border-radius:4px;
        background: url(${PUZZLE_IMAGE}) ${col * (100 / (GRID_SIZE - 1))}% ${row * (100 / (GRID_SIZE - 1))}% / ${GRID_SIZE * 100}%;
        border: 2px solid ${selected === pos ? room.color : 'rgba(255,255,255,0.15)'};
        transition: border-color 0.2s;
      `;

      // Fallback ha nincs kép
      el.innerHTML = `<div style="
        width:100%; height:100%; display:flex; align-items:center; justify-content:center;
        font-size:1.2rem; color:rgba(255,255,255,0.3); font-weight:bold;
        background:rgba(255,255,255,${pieceIndex === pos ? 0.1 : 0.03});
      ">${pieceIndex + 1}</div>`;

      el.addEventListener('click', () => {
        if (selected === null) {
          selected = pos;
          renderPuzzle();
        } else {
          // Swap
          [pieces[selected], pieces[pos]] = [pieces[pos], pieces[selected]];
          selected = null;
          renderPuzzle();

          // Ellenőrzés
          if (pieces.every((p, i) => p === i)) {
            setTimeout(() => {
              showSuccess(container, room, onSuccess, 'Kiraktad a képet!');
            }, 500);
          }
        }
      });

      gridEl.appendChild(el);
    });
  }

  renderPuzzle();

  const hintSkip = createHintSkip(container,
    ['A számozott darabok sorrendbe kell kerüljenek (1-9)', 'Próbáld a sarkokból kezdeni'],
    () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">💌 Titkos Levelesláda</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Üzenetek a családtól
    </p>
    ${MESSAGES.map(m => `
      <div class="content-card">
        <div style="font-size:0.75rem; color:${room.color}; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">${m.from}</div>
        <p style="font-size:1rem; line-height:1.6;">${m.text}</p>
      </div>
    `).join('')}
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/leveleslada.js
git commit -m "feat: Titkos Levelesláda — puzzle kirakó és családi üzenetek"
```

---

## Task 9: Moziterem — Torta-készítő + Videók

**Files:**
- Create: `js/rooms/moziterem.js`

- [ ] **Step 1: Írd meg a torta-készítő modult**

```javascript
// js/rooms/moziterem.js
import { showSuccess, createHintSkip } from '../minigame-base.js';

const STEPS = [
  { instruction: 'Törd fel a tojásokat! 🥚', emoji: '🥚', action: 'Kattints 3x!' },
  { instruction: 'Szórd bele a lisztet! 🌾', emoji: '🌾', action: 'Kattints 5x!' },
  { instruction: 'Öntsd hozzá a tejet! 🥛', emoji: '🥛', action: 'Kattints 3x!' },
  { instruction: 'Keverd össze! 🥄', emoji: '🥄', action: 'Kattints gyorsan 10x!' },
  { instruction: 'Tedd a sütőbe! 🔥', emoji: '🔥', action: 'Kattints 1x!' },
  { instruction: 'Díszítsd a tortát! 🎂', emoji: '🎂', action: 'Kattints 5x!' },
];

const VIDEOS = [
  { title: 'Videó üzenet 1', src: 'assets/video/video1.mp4', poster: 'assets/photos/video-poster1.jpg' },
  { title: 'Videó üzenet 2', src: 'assets/video/video2.mp4', poster: 'assets/photos/video-poster2.jpg' },
];

export function renderMinigame(container, room, onSuccess) {
  let currentStep = 0;
  let clicks = 0;
  const clickTargets = [3, 5, 3, 10, 1, 5];

  function renderStep() {
    if (currentStep >= STEPS.length) {
      showSuccess(container, room, onSuccess, 'A torta kész! 🎂');
      return;
    }

    const step = STEPS[currentStep];
    const target = clickTargets[currentStep];
    clicks = 0;

    container.innerHTML = `
      <h2 class="minigame-title">🎬 Moziterem</h2>
      <p class="minigame-instructions">${currentStep + 1}/${STEPS.length} — ${step.instruction}</p>
      <div style="text-align:center;">
        <div id="cake-area" style="
          font-size:5rem; cursor:pointer; user-select:none;
          transition:transform 0.1s;
        ">${step.emoji}</div>
        <p style="color:rgba(255,255,255,0.4); margin-top:12px; font-size:0.85rem;">
          ${step.action} — <span id="click-count">0</span>/${target}
        </p>
        <div style="background:rgba(255,255,255,0.08); border-radius:10px; height:8px; max-width:300px; margin:12px auto; overflow:hidden;">
          <div id="step-bar" style="height:100%; background:${room.color}; width:0%; transition:width 0.2s; border-radius:10px;"></div>
        </div>
      </div>
    `;

    const cakeArea = container.querySelector('#cake-area');
    const countEl = container.querySelector('#click-count');
    const barEl = container.querySelector('#step-bar');

    cakeArea.addEventListener('click', () => {
      clicks++;
      countEl.textContent = clicks;
      barEl.style.width = (clicks / target * 100) + '%';
      cakeArea.style.transform = 'scale(1.2)';
      setTimeout(() => cakeArea.style.transform = 'scale(1)', 100);

      if (clicks >= target) {
        currentStep++;
        setTimeout(renderStep, 400);
      }
    });

    createHintSkip(container, ['Csak kattintgass!'],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderStep();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🎬 Moziterem</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Videó üzenetek neked, Apu!
    </p>
    ${VIDEOS.map(v => `
      <div class="content-card" style="text-align:center;">
        <h3 style="color:${room.color}; margin-bottom:12px;">${v.title}</h3>
        <video controls style="width:100%; border-radius:8px; max-height:400px;"
          poster="${v.poster}" preload="none">
          <source src="${v.src}" type="video/mp4">
          A böngésző nem támogatja a videó lejátszást.
        </video>
      </div>
    `).join('')}
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/moziterem.js
git commit -m "feat: Moziterem — torta-készítő kattintós játék és videó üzenetek"
```

---

## Task 10: Időkapszula — Sorba rendezés + Idővonal

**Files:**
- Create: `js/rooms/idokapszula.js`

- [ ] **Step 1: Írd meg a sorba rendezés modult**

```javascript
// js/rooms/idokapszula.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// A user cseréli saját eseményekre
const EVENTS = [
  { year: 1975, text: 'Apu megszületik', icon: '👶' },
  { year: 1981, text: 'Első iskolai nap', icon: '🏫' },
  { year: 1993, text: 'Egyetemi diploma', icon: '🎓' },
  { year: 1998, text: 'Összeházasodik Anyuval', icon: '💒' },
  { year: 2002, text: 'Megszületek én', icon: '🍼' },
  { year: 2010, text: 'Első közös nyaralás', icon: '🏖️' },
  { year: 2020, text: 'Közös Lego projekt', icon: '🧱' },
];

export function renderMinigame(container, room, onSuccess) {
  let items = shuffle(EVENTS);

  container.innerHTML = `
    <h2 class="minigame-title">⏳ Időkapszula</h2>
    <p class="minigame-instructions">Rakd időrendbe az eseményeket! Húzd a helyükre vagy kattints kettőre a cseréhez.</p>
    <div id="timeline-items" style="max-width:450px; margin:0 auto;"></div>
    <div style="text-align:center; margin-top:20px;">
      <button class="minigame-btn" id="check-order">Ellenőrzés ✓</button>
    </div>
  `;

  let selected = null;
  const listEl = container.querySelector('#timeline-items');

  function renderItems() {
    listEl.innerHTML = '';
    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'content-card';
      el.style.cssText = `
        cursor:pointer; display:flex; align-items:center; gap:12px;
        border-color:${selected === index ? room.color : 'rgba(255,255,255,0.1)'};
        transition:border-color 0.2s;
      `;
      el.innerHTML = `
        <span style="font-size:1.5rem;">${item.icon}</span>
        <span style="font-size:0.9rem;">${item.text}</span>
      `;
      el.addEventListener('click', () => {
        if (selected === null) {
          selected = index;
        } else {
          [items[selected], items[index]] = [items[index], items[selected]];
          selected = null;
        }
        renderItems();
      });
      listEl.appendChild(el);
    });
  }

  renderItems();

  const hintSkip = createHintSkip(container,
    ['A legrégebbi esemény kerüljön legfelülre', 'Gondolj bele melyik történt előbb — a születés vagy az iskola?'],
    () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
  );

  container.querySelector('#check-order').addEventListener('click', () => {
    const isCorrect = items.every((item, i) => i === 0 || item.year >= items[i - 1].year);
    if (isCorrect) {
      showSuccess(container, room, onSuccess, 'Tökéletes időrend!');
    } else {
      // Jelöld be a rosszul álló elemeket
      hintSkip.recordAttempt();
      const cards = listEl.children;
      for (let i = 1; i < items.length; i++) {
        if (items[i].year < items[i - 1].year) {
          cards[i].style.borderColor = '#fc8181';
          cards[i - 1].style.borderColor = '#fc8181';
        }
      }
      setTimeout(() => renderItems(), 1500);
    }
  });
}

export function renderContent(container, room) {
  const sorted = [...EVENTS].sort((a, b) => a.year - b.year);
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">⏳ Időkapszula</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Apu életének mérföldkövei
    </p>
    <div style="position:relative; max-width:450px; margin:0 auto; padding-left:40px;">
      <div style="position:absolute; left:18px; top:0; bottom:0; width:2px; background:${room.color}; opacity:0.3;"></div>
      ${sorted.map(e => `
        <div style="position:relative; margin-bottom:24px;" class="fade-in">
          <div style="position:absolute; left:-32px; width:24px; height:24px; border-radius:50%;
            background:${room.color}; display:flex; align-items:center; justify-content:center; font-size:0.7rem;">
            ${e.icon}
          </div>
          <div class="content-card">
            <div style="font-size:0.7rem; color:${room.color}; font-weight:bold;">${e.year}</div>
            <div style="margin-top:4px;">${e.text}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/idokapszula.js
git commit -m "feat: Időkapszula — sorba rendezés játék és idővonal"
```

---

## Task 11: Kalandorok Klubja — Képfelismerő

**Files:**
- Create: `js/rooms/kalandorok.js`

- [ ] **Step 1: Írd meg a képfelismerő modult**

```javascript
// js/rooms/kalandorok.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// A user cseréli saját képekre
const CHALLENGES = [
  { image: 'assets/photos/adventure1.jpg', answer: 'Gokart pálya', options: ['Gokart pálya', 'Autóverseny', 'Bowling'], hint: 'Kicsi autók, nagy sebesség', blur: 15 },
  { image: 'assets/photos/adventure2.jpg', answer: 'Szabadulószoba', options: ['Szabadulószoba', 'Múzeum', 'Mozi'], hint: 'Rejtvények és zárak', blur: 15 },
  { image: 'assets/photos/adventure3.jpg', answer: 'Vidámpark', options: ['Vidámpark', 'Strand', 'Játszótér'], hint: 'Hullámvasút!', blur: 15 },
];

const ADVENTURES = [
  { title: 'Gokartozás', photo: 'assets/photos/adventure1.jpg', story: 'Leírás a gokartozásról...' },
  { title: 'Szabadulószoba', photo: 'assets/photos/adventure2.jpg', story: 'Leírás a szabadulószobáról...' },
  { title: 'Vidámpark', photo: 'assets/photos/adventure3.jpg', story: 'Leírás a vidámpark élményről...' },
];

export function renderMinigame(container, room, onSuccess) {
  const challenges = shuffle(CHALLENGES);
  let current = 0;
  let score = 0;

  function renderChallenge() {
    if (current >= challenges.length) {
      showSuccess(container, room, onSuccess, `${score}/${challenges.length} — Szoba feloldva!`);
      return;
    }

    const c = challenges[current];
    const options = shuffle(c.options);

    container.innerHTML = `
      <h2 class="minigame-title">🏎️ Kalandorok Klubja</h2>
      <p class="minigame-instructions">${current + 1}/${challenges.length} — Hol voltunk? Ismerős a kép?</p>
      <div style="text-align:center; margin-bottom:20px;">
        <div style="
          width:300px; height:200px; margin:0 auto; border-radius:12px; overflow:hidden;
          border:2px solid rgba(255,255,255,0.1);
          background:url(${c.image}) center/cover;
          filter:blur(${c.blur}px); transition:filter 2s;
        " id="blur-image"></div>
        <p style="font-size:0.75rem; color:rgba(255,255,255,0.3); margin-top:8px;">A kép lassan kitisztul...</p>
      </div>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:350px; margin:0 auto;"></div>
    `;

    // Fokozatosan kitisztul
    const imgEl = container.querySelector('#blur-image');
    let blur = c.blur;
    const interval = setInterval(() => {
      blur = Math.max(0, blur - 1);
      imgEl.style.filter = `blur(${blur}px)`;
      if (blur <= 0) clearInterval(interval);
    }, 500);

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        clearInterval(interval);
        if (opt === c.answer) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          hintSkip.recordAttempt();
        }
        imgEl.style.filter = 'blur(0px)';
        setTimeout(() => { current++; renderChallenge(); }, 1200);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container, [c.hint],
      () => { clearInterval(interval); showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderChallenge();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🏎️ Kalandorok Klubja</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      A legjobb közös kalandjaink
    </p>
    ${ADVENTURES.map(a => `
      <div class="content-card" style="overflow:hidden;">
        <img src="${a.photo}" alt="${a.title}"
          style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:12px;"
          onerror="this.style.display='none'">
        <h3 style="color:${room.color};">${a.title}</h3>
        <p style="color:rgba(255,255,255,0.6); margin-top:8px; line-height:1.6;">${a.story}</p>
      </div>
    `).join('')}
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/kalandorok.js
git commit -m "feat: Kalandorok Klubja — képfelismerő játék és kaland emlékek"
```

---

## Task 12: Ajándékraktár — Kaparós sorsjegy

**Files:**
- Create: `js/rooms/ajandekraktar.js`

- [ ] **Step 1: Írd meg a kaparós sorsjegy modult**

```javascript
// js/rooms/ajandekraktar.js
import { showSuccess, createHintSkip } from '../minigame-base.js';

const COUPONS = [
  { title: 'Mosogatás', description: 'Egy teljes nap mosogatást vállalok!', emoji: '🍽️' },
  { title: 'Főzés', description: 'Főzök amit csak kérsz!', emoji: '👨‍🍳' },
  { title: 'Masszázs', description: 'Egy 15 perces vállmasszázs', emoji: '💆' },
  { title: 'Filmnap', description: 'Te választod a filmet, én hozom a popcornt!', emoji: '🍿' },
  { title: 'Autómosás', description: 'Megmosom az autót kívül-belül', emoji: '🚗' },
  { title: 'Szabadnap', description: 'Egy nap amikor mindent én intézek', emoji: '😴' },
];

export function renderMinigame(container, room, onSuccess) {
  let scratched = 0;
  const targetScratches = 3;

  container.innerHTML = `
    <h2 class="minigame-title">🎁 Ajándékraktár</h2>
    <p class="minigame-instructions">Kapard le a sorsjegyeket! Húzd az egered/ujjad a szürke felületen.</p>
    <div id="scratch-cards" style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:500px; margin:0 auto;"></div>
  `;

  const cardsEl = container.querySelector('#scratch-cards');

  COUPONS.slice(0, targetScratches).forEach((coupon, i) => {
    const card = document.createElement('div');
    card.style.cssText = 'position:relative; aspect-ratio:3/4; border-radius:12px; overflow:hidden;';

    // Alatta a kupon
    const content = document.createElement('div');
    content.style.cssText = `
      position:absolute; inset:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center; padding:12px; text-align:center;
      background:rgba(255,255,255,0.05); border:2px solid ${room.color};
      border-radius:12px;
    `;
    content.innerHTML = `
      <div style="font-size:2.5rem;">${coupon.emoji}</div>
      <div style="font-size:0.85rem; font-weight:bold; color:${room.color}; margin-top:8px;">${coupon.title}</div>
      <div style="font-size:0.7rem; color:rgba(255,255,255,0.5); margin-top:4px;">${coupon.description}</div>
    `;

    // Canvas felette (kaparós réteg)
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 260;
    canvas.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; border-radius:12px;';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, 200, 260);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Kapard le!', 100, 130);

    let isScratching = false;
    let scratchedPixels = 0;

    function scratch(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Ellenőrzés: elég lett-e kaparva
      const imageData = ctx.getImageData(0, 0, 200, 260);
      let transparent = 0;
      for (let j = 3; j < imageData.data.length; j += 4) {
        if (imageData.data[j] === 0) transparent++;
      }
      const pct = transparent / (200 * 260);

      if (pct > 0.5 && !card.dataset.done) {
        card.dataset.done = 'true';
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 0.5s';
        scratched++;
        if (scratched >= targetScratches) {
          setTimeout(() => {
            showSuccess(container, room, onSuccess, 'Minden kupont lekapartál!');
          }, 600);
        }
      }
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: (touch.clientX - rect.left) / rect.width * 200,
        y: (touch.clientY - rect.top) / rect.height * 260,
      };
    }

    canvas.addEventListener('mousedown', (e) => { isScratching = true; const p = getPos(e); scratch(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if (isScratching) { const p = getPos(e); scratch(p.x, p.y); } });
    canvas.addEventListener('mouseup', () => isScratching = false);
    canvas.addEventListener('mouseleave', () => isScratching = false);

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isScratching = true; const p = getPos(e); scratch(p.x, p.y); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (isScratching) { const p = getPos(e); scratch(p.x, p.y); } });
    canvas.addEventListener('touchend', () => isScratching = false);

    card.appendChild(content);
    card.appendChild(canvas);
    cardsEl.appendChild(card);
  });

  createHintSkip(container, ['Húzd az egered a szürke felületen'],
    () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🎁 Ajándékraktár</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Kuponok — bármikor beválthatóak!
    </p>
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px;">
      ${COUPONS.map(c => `
        <div class="content-card" style="text-align:center; border-color:${room.color};">
          <div style="font-size:2.5rem;">${c.emoji}</div>
          <div style="font-weight:bold; color:${room.color}; margin-top:8px;">${c.title}</div>
          <div style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:4px;">${c.description}</div>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/ajandekraktar.js
git commit -m "feat: Ajándékraktár — kaparós sorsjegy és kuponok"
```

---

## Task 13: A Furcsa Konyha — Összetevő-keverő

**Files:**
- Create: `js/rooms/furcsa-konyha.js`

- [ ] **Step 1: Írd meg az összetevő-keverő modult**

```javascript
// js/rooms/furcsa-konyha.js
import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const INGREDIENTS = ['Csoki', 'Paprika', 'Sajt', 'Banán', 'Mogyoró', 'Méz', 'Citrom', 'Avokádó', 'Kókusz', 'Fahéj'];
const ADJECTIVES = ['Ropogós', 'Krémes', 'Tüzes', 'Csípős', 'Selymes', 'Habos', 'Szaftos', 'Füstölt'];
const DISH_TYPES = ['Torta', 'Leves', 'Szendvics', 'Ragu', 'Smoothie', 'Muffin', 'Pite', 'Tekercs'];

const RECIPES = [
  { name: 'Csokis-Chilis Lávasütemény', ingredients: ['Étcsoki', 'Chili pehely', 'Vaj', 'Cukor', 'Tojás'], description: 'Furcsán hangzik, de a csoki és a chili tökéletes páros! A láva sütemény belseje folyós marad.' },
  { name: 'Sajtos-Körtés Melegszendvics', ingredients: ['Kéksajt', 'Körte', 'Dió', 'Méz', 'Kenyér'], description: 'Az édes körte és a sós sajt mennyei kombináció. A dió adja a ropogósat!' },
  { name: 'Avokádós Csoki Mousse', ingredients: ['Avokádó', 'Kakaó', 'Méz', 'Kókusztej', 'Vanília'], description: 'Az avokádó krémes állagot ad és nem érzed az ízét. Csak csoki és boldogság!' },
  { name: 'Sütőtökös-Fahéjas Latte', ingredients: ['Sütőtök püré', 'Fahéj', 'Tej', 'Kávé', 'Juharszirup'], description: 'Őszi klasszikus ami furcsán hangzik de világhódító lett. Próbáld ki!' },
];

export function renderMinigame(container, room, onSuccess) {
  let mixCount = 0;
  const targetMixes = 3;

  function renderMixer() {
    if (mixCount >= targetMixes) {
      showSuccess(container, room, onSuccess, 'Mesterkukta lettél!');
      return;
    }

    const ing1 = shuffle(INGREDIENTS)[0];
    const ing2 = shuffle(INGREDIENTS.filter(i => i !== ing1))[0];
    const adj = shuffle(ADJECTIVES)[0];
    const dish = shuffle(DISH_TYPES)[0];

    container.innerHTML = `
      <h2 class="minigame-title">🍳 A Furcsa Konyha</h2>
      <p class="minigame-instructions">${mixCount + 1}/${targetMixes} — Keverd össze a hozzávalókat!</p>
      <div style="text-align:center;">
        <div style="display:flex; justify-content:center; gap:16px; align-items:center; margin:20px 0;">
          <div style="font-size:2rem; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px;">${ing1}</div>
          <div style="font-size:2rem;">+</div>
          <div style="font-size:2rem; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px;">${ing2}</div>
        </div>
        <button class="minigame-btn" id="mix-btn" style="font-size:1.2rem;">🥄 Összekeverem!</button>
        <div id="result" style="margin-top:20px; display:none;">
          <div style="font-size:1.2rem; color:${room.color}; font-weight:bold;">
            ✨ ${adj} ${ing1}-${ing2} ${dish} ✨
          </div>
          <p style="color:rgba(255,255,255,0.4); margin-top:8px; font-size:0.85rem;">Hangzik furcsán? Biztos finom!</p>
          <button class="minigame-btn" id="next-mix" style="margin-top:12px;">Következő keverés →</button>
        </div>
      </div>
    `;

    container.querySelector('#mix-btn').addEventListener('click', () => {
      container.querySelector('#mix-btn').style.display = 'none';
      container.querySelector('#result').style.display = 'block';
      container.querySelector('#result').classList.add('fade-in');
    });

    container.querySelector('#next-mix').addEventListener('click', () => {
      mixCount++;
      renderMixer();
    });

    createHintSkip(container, ['Csak kevergess!'],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderMixer();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🍳 A Furcsa Konyha</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Furcsán hangzó, de isteni receptek
    </p>
    ${RECIPES.map(r => `
      <div class="content-card">
        <h3 style="color:${room.color}; margin-bottom:8px;">${r.name}</h3>
        <div style="font-size:0.8rem; color:rgba(255,255,255,0.4); margin-bottom:8px;">
          Hozzávalók: ${r.ingredients.join(', ')}
        </div>
        <p style="line-height:1.6;">${r.description}</p>
      </div>
    `).join('')}
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/furcsa-konyha.js
git commit -m "feat: A Furcsa Konyha — összetevő-keverő és recept gyűjtemény"
```

---

## Task 14: Kockagyár — Lego építő

**Files:**
- Create: `js/rooms/kockagyar.js`

- [ ] **Step 1: Írd meg a Lego építő modult**

```javascript
// js/rooms/kockagyar.js
import { showSuccess, createHintSkip } from '../minigame-base.js';

const COLORS = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5'];
const GRID_W = 8;
const GRID_H = 10;
const TARGET_BRICKS = 15;

export function renderMinigame(container, room, onSuccess) {
  let placedBricks = 0;
  let selectedColor = COLORS[0];
  const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(null));

  container.innerHTML = `
    <h2 class="minigame-title">🧱 Kockagyár</h2>
    <p class="minigame-instructions">Építs valamit! Válassz színt és kattints a rácsra. Rakj le ${TARGET_BRICKS} kockát!</p>
    <div style="text-align:center;">
      <div id="color-picker" style="display:flex; justify-content:center; gap:6px; margin-bottom:16px;"></div>
      <div id="lego-grid" style="
        display:inline-grid; grid-template-columns:repeat(${GRID_W}, 36px);
        gap:1px; background:rgba(255,255,255,0.05); padding:4px; border-radius:8px;
        border:2px solid rgba(255,255,255,0.1);
      "></div>
      <p style="color:rgba(255,255,255,0.4); margin-top:12px; font-size:0.85rem;">
        <span id="brick-count">0</span> / ${TARGET_BRICKS} kocka lerakva
      </p>
    </div>
  `;

  // Szín választó
  const pickerEl = container.querySelector('#color-picker');
  COLORS.forEach(color => {
    const btn = document.createElement('div');
    btn.style.cssText = `
      width:30px; height:30px; border-radius:6px; cursor:pointer;
      background:${color}; border:3px solid ${color === selectedColor ? 'white' : 'transparent'};
      transition:border-color 0.2s;
    `;
    btn.addEventListener('click', () => {
      selectedColor = color;
      [...pickerEl.children].forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = 'white';
    });
    pickerEl.appendChild(btn);
  });

  // Rács
  const gridEl = container.querySelector('#lego-grid');
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        width:36px; height:36px; border-radius:4px; cursor:pointer;
        background:rgba(255,255,255,0.02); transition:background 0.15s;
        display:flex; align-items:center; justify-content:center;
      `;
      cell.addEventListener('click', () => {
        if (!grid[y][x]) {
          grid[y][x] = selectedColor;
          cell.style.background = selectedColor;
          // Lego pötty
          cell.innerHTML = '<div style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.2);"></div>';
          placedBricks++;
          container.querySelector('#brick-count').textContent = placedBricks;

          if (placedBricks >= TARGET_BRICKS) {
            setTimeout(() => {
              showSuccess(container, room, onSuccess, 'Remek építmény!');
            }, 500);
          }
        } else {
          // Eltávolítás
          grid[y][x] = null;
          cell.style.background = 'rgba(255,255,255,0.02)';
          cell.innerHTML = '';
          placedBricks = Math.max(0, placedBricks - 1);
          container.querySelector('#brick-count').textContent = placedBricks;
        }
      });
      cell.addEventListener('mouseenter', () => {
        if (!grid[y][x]) cell.style.background = selectedColor + '44';
      });
      cell.addEventListener('mouseleave', () => {
        if (!grid[y][x]) cell.style.background = 'rgba(255,255,255,0.02)';
      });
      gridEl.appendChild(cell);
    }
  }

  createHintSkip(container, ['Építs egy házat, autót, vagy bármit!', 'Kattints egy üres cellára a kocka lerakásához'],
    () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🧱 Kockagyár</h2>
    <div class="content-card" style="text-align:center;">
      <div style="font-size:4rem; margin-bottom:16px;">🏆</div>
      <h3 style="color:${room.color};">Mesterkonstruktőr!</h3>
      <p style="color:rgba(255,255,255,0.6); margin-top:12px; line-height:1.6;">
        A közös LEGO építéseink mindig a legjobb programok voltak.
        Köszönöm hogy megtanítottál türelmesen építeni — nemcsak LEGO-ból,
        hanem az életben is. 🧱❤️
      </p>
    </div>
  `;
}
```

- [ ] **Step 2: Böngészőben ellenőrizd, commit**

```bash
git add js/rooms/kockagyar.js
git commit -m "feat: Kockagyár — Lego építő minijáték"
```

---

## Task 15: A Széf — Nagy finale

**Files:**
- Create: `js/rooms/a-szef.js`

- [ ] **Step 1: Írd meg a finale modult**

```javascript
// js/rooms/a-szef.js

export function renderMinigame() {
  // A Széf nem rendelkezik minijátékkal — automatikusan nyílik
}

export function renderContent(container, room) {
  // Nagy konfetti
  launchBigConfetti();

  container.innerHTML = `
    <div style="text-align:center; padding:40px 20px;" class="fade-in">
      <div style="font-size:5rem; margin-bottom:20px;">🎉🎂🎉</div>
      <h1 style="font-family:Georgia,serif; font-size:clamp(2rem,6vw,3.5rem); color:#f6ad55; margin-bottom:16px;">
        Boldog Szülinapot, Apu!
      </h1>
      <p style="font-size:1.1rem; color:rgba(255,255,255,0.7); line-height:1.8; max-width:500px; margin:0 auto 32px;">
        Végigmentél az összes szobán! Minden meglepetés a tiéd.<br>
        Köszönöm hogy a legjobb Apu vagy a világon. ❤️
      </p>

      <div style="
        background:rgba(255,255,255,0.05); border:2px solid #f6ad55;
        border-radius:16px; padding:24px; max-width:500px; margin:0 auto;
      ">
        <h3 style="color:#f6ad55; margin-bottom:16px;">📊 A Te statisztikáid:</h3>
        <div id="stats" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.3); margin-top:40px; font-size:0.8rem;">
        Szeretettel készítette a családod 💛
      </p>
    </div>
  `;

  // Statisztikák
  const statsEl = container.querySelector('#stats');
  const progress = JSON.parse(localStorage.getItem('apu-bday-progress') || '{}');
  const roomCount = Object.keys(progress).length;

  const stats = [
    { label: 'Felfedezett szobák', value: `${roomCount} 🚪` },
    { label: 'Státusz', value: 'Mester Felfedező 🏆' },
  ];

  stats.forEach(s => {
    statsEl.innerHTML += `
      <div style="text-align:center;">
        <div style="font-size:1.4rem; font-weight:bold; color:#f6ad55;">${s.value}</div>
        <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:4px;">${s.label}</div>
      </div>
    `;
  });
}

function launchBigConfetti() {
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3', '#ecc94b', '#4fd1c5'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 10) + 'px';
    piece.style.height = (6 + Math.random() * 10) + 'px';
    piece.style.setProperty('--fall-duration', (3 + Math.random() * 4) + 's');
    piece.style.setProperty('--fall-delay', Math.random() * 2 + 's');
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 8000);
  }
}
```

- [ ] **Step 2: Módosítsd az app.js-t hogy A Széf közvetlenül tartalom nézetet nyisson**

Az `onRoomClick` függvényben az `a-szef` szoba speciális kezelést kap: mivel nincs minijátéka, mindig a tartalmat mutassa, ha minden szoba feloldva van. Ez már a jelenlegi kódban kezelve van az `isSecret` flag-gel — a szoba nem kattintható amíg nincs minden feloldva, és ha feloldva van, akkor a content ág fut. Ellenőrizd hogy a `renderMinigame` ág sosem hívódik az `a-szef`-re.

- [ ] **Step 3: Böngészőben ellenőrizd**

Teszteléshez: nyisd meg a böngésző konzolt és futtasd:
```javascript
// Minden szoba feloldása teszteléshez
const rooms = ['hangok-terme','emlekek-kamraja','vilagjaro','agytornaterem','leveleslada','moziterem','idokapszula','kalandorok','ajandekraktar','furcsa-konyha','kockagyar'];
const progress = {};
rooms.forEach(r => progress[r] = { unlockedAt: Date.now() });
localStorage.setItem('apu-bday-progress', JSON.stringify(progress));
location.reload();
```

Ellenőrizd:
- Az összes szoba kiszínesedik
- A Széf kattinthatóvá válik
- Kattintásra: nagy konfetti + összesítő üzenet
- Statisztikák megjelennek
- Utána: `localStorage.removeItem('apu-bday-progress')` és reload a resethez

- [ ] **Step 4: Commit**

```bash
git add js/rooms/a-szef.js
git commit -m "feat: A Széf — nagy finale konfettivel és statisztikákkal"
```

---

## Task 16: Végső teszt és GitHub Pages deploy

**Files:**
- Modify: esetleges javítások bármely fájlban

- [ ] **Step 1: Teljes átfutás tesztelés**

Nyisd meg böngészőben és menj végig az ÖSSZES szobán:
1. Kattints minden zárt szobára sorban
2. Játszd végig minden minijátékot
3. Ellenőrizd hogy mindegyik feloldás után kiszínesedik a szoba
4. Ellenőrizd a feloldott tartalmakat (kattints a színes szobákra)
5. Ha mind kész → A Széf megnyílik, konfetti megy
6. Tesztelj mobilon is (reszponzivitás)
7. Zárd be és nyisd újra a böngészőt → progress megmarad

- [ ] **Step 2: Javítsd ki a talált hibákat**

Ha bármi nem működik, javítsd ki és commitolj.

- [ ] **Step 3: GitHub Pages deploy**

```bash
git remote add origin https://github.com/USERNAME/apu-bday.git
git branch -M main
git push -u origin main
```

Ezután a GitHub repo Settings → Pages → Source: Deploy from branch → main → / (root) → Save.

Az oldal elérhető lesz: `https://USERNAME.github.io/apu-bday/`

- [ ] **Step 4: Végső commit**

```bash
git add -A
git commit -m "chore: deploy — kész az oldal, GitHub Pages aktív"
```

---

## Tartalom testreszabás útmutató

Az összes placeholder szöveget, fotót, videót a user cseréli saját tartalmára. Érintett fájlok:

| Fájl | Mit kell cserélni |
|------|------------------|
| `js/rooms/hangok-terme.js` | `SONGS` (dalok + fájlok), `PLAYLIST` (dal lista) |
| `js/rooms/emlekek-kamraja.js` | `PHOTOS` (memória fotók), `GALLERY_PHOTOS` (galéria) |
| `js/rooms/vilagjaro.js` | `TRIPS` (utazások: év, hely, koordináták, fotó, sztori) |
| `js/rooms/agytornaterem.js` | `QUESTIONS` (kvíz kérdések), `FUN_FACTS` |
| `js/rooms/leveleslada.js` | `PUZZLE_IMAGE`, `MESSAGES` (üzenetek) |
| `js/rooms/moziterem.js` | `VIDEOS` (videó fájlok) |
| `js/rooms/idokapszula.js` | `EVENTS` (életesemények: év, szöveg) |
| `js/rooms/kalandorok.js` | `CHALLENGES` (fotók), `ADVENTURES` (sztorik) |
| `js/rooms/ajandekraktar.js` | `COUPONS` (kupon szövegek) |
| `js/rooms/furcsa-konyha.js` | `RECIPES` (receptek) |
| `js/rooms/kockagyar.js` | Tartalom szöveg a `renderContent`-ben |
| `js/rooms/a-szef.js` | Finale üzenet szöveg |
| `assets/photos/` | Családi fotók |
| `assets/audio/` | Zenei részletek |
| `assets/video/` | Videó üzenetek |
