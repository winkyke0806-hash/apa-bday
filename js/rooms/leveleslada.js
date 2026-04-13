import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const PUZZLE_IMAGE = 'assets/photos/puzzle.jpg';
const GRID_SIZE = 3;

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
      const isCorrect = pieceIndex === pos;

      el.style.cssText = `
        aspect-ratio:1; cursor:pointer; border-radius:4px;
        background: url(${PUZZLE_IMAGE}) ${col * 50}% ${row * 50}% / 300%;
        border: 2px solid ${selected === pos ? room.color : 'rgba(255,255,255,0.15)'};
        display:flex; align-items:center; justify-content:center;
        transition: border-color 0.2s;
      `;
      el.innerHTML = `<div style="
        width:100%;height:100%;display:flex;align-items:center;justify-content:center;
        font-size:1.2rem;color:rgba(255,255,255,0.4);font-weight:bold;
        background:rgba(${isCorrect ? '104,211,145,0.15' : '255,255,255,0.03'});
        border-radius:3px;
      ">${pieceIndex + 1}</div>`;

      el.addEventListener('click', () => {
        if (selected === null) {
          selected = pos;
          renderPuzzle();
        } else {
          [pieces[selected], pieces[pos]] = [pieces[pos], pieces[selected]];
          selected = null;
          renderPuzzle();
          if (pieces.every((p, i) => p === i)) {
            setTimeout(() => showSuccess(container, room, onSuccess, 'Kiraktad a képet!'), 500);
          }
        }
      });
      gridEl.appendChild(el);
    });
  }

  renderPuzzle();
  createHintSkip(container,
    ['A számozott darabok sorrendbe kell kerüljenek (1-9)', 'Próbáld a sarkokból kezdeni'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">💌 Titkos Levelesláda</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Üzenetek a családtól</p>
    ${MESSAGES.map(m => `
      <div class="content-card">
        <div style="font-size:0.75rem; color:${room.color}; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">${m.from}</div>
        <p style="font-size:1rem; line-height:1.6;">${m.text}</p>
      </div>
    `).join('')}
  `;
}
