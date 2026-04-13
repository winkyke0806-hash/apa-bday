/**
 * Közös minijáték segédfüggvények.
 * Minden szoba modul exportál: renderMinigame(container, room, onSuccess) és renderContent(container, room)
 */

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
  launchMiniConfetti();
}

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

function launchMiniConfetti() {
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3', '#ecc94b', '#4fd1c5'];
  const shapes = ['confetti-piece--circle', 'confetti-piece--rect', 'confetti-piece--star', 'confetti-piece--heart'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 5 + Math.random() * 12;
    const rot = Math.floor(Math.random() * 720);

    piece.className = `confetti-piece ${shape}`;
    piece.style.left = (10 + Math.random() * 80) + '%';
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--fall-duration', (3 + Math.random() * 3) + 's');
    piece.style.setProperty('--fall-delay', Math.random() * 1 + 's');
    piece.style.setProperty('--sway', (20 + Math.random() * 40) + 'px');
    piece.style.setProperty('--rot1', rot * 0.25 + 'deg');
    piece.style.setProperty('--rot2', rot * 0.5 + 'deg');
    piece.style.setProperty('--rot3', rot * 0.75 + 'deg');
    piece.style.setProperty('--rot4', rot * 0.9 + 'deg');
    piece.style.setProperty('--rot5', rot + 'deg');

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 8000);
  }
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
