import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// Placeholder — a user cseréli saját eseményekre
const EVENTS = [
  { year: 1978, text: 'Apu megszületik', icon: '👶' },
  { year: 1984, text: 'Első iskolai nap', icon: '🏫' },
  { year: 1996, text: 'Egyetemi diploma', icon: '🎓' },
  { year: 2000, text: 'Első saját lakás', icon: '🏠' },
  { year: 2005, text: 'Megszületek én', icon: '🍼' },
  { year: 2012, text: 'Első közös nyaralás', icon: '🏖️' },
];

export function renderMinigame(container, room, onSuccess) {
  let items = shuffle([...EVENTS]);
  let selected = null;
  let attempts = 0;

  container.innerHTML = `
    <h2 class="minigame-title">⏳ Időkapszula</h2>
    <p class="minigame-instructions">Rakd időrendbe az eseményeket! Kattints két kártyára a cseréhez.</p>
    <div id="timeline-items" style="max-width:450px; margin:0 auto;"></div>
    <div style="text-align:center; margin-top:20px;">
      <button class="minigame-btn" id="check-order">Ellenőrzés ✓</button>
    </div>
    <div id="hint-area"></div>
  `;

  const listEl = container.querySelector('#timeline-items');
  const hintArea = container.querySelector('#hint-area');

  const hintSkip = createHintSkip(hintArea,
    ['A legrégebbi esemény kerüljön legfelülre', 'Gondolj bele — a születés vagy az iskola volt előbb?'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );

  function renderItems() {
    listEl.innerHTML = '';
    items.forEach((item, index) => {
      const isSelected = selected === index;
      const el = document.createElement('div');
      el.className = 'content-card';
      el.style.cssText = `
        cursor:pointer; display:flex; align-items:center; gap:12px;
        border-color:${isSelected ? room.color : 'rgba(255,255,255,0.1)'};
        background:${isSelected ? room.color + '11' : 'rgba(255,255,255,0.03)'};
        transition:all 0.25s ease; user-select:none;
      `;
      el.innerHTML = `
        <span style="font-size:1.5rem;">${item.icon}</span>
        <span style="flex:1;">${item.text}</span>
        ${isSelected ? `<span style="font-size:0.7rem; color:${room.color};">▲▼</span>` : ''}
      `;

      el.addEventListener('click', () => {
        if (selected === null) {
          selected = index;
        } else if (selected === index) {
          selected = null;
        } else {
          [items[selected], items[index]] = [items[index], items[selected]];
          selected = null;
        }
        renderItems();
      });

      el.addEventListener('mouseenter', () => {
        if (!isSelected) { el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.background = 'rgba(255,255,255,0.05)'; }
      });
      el.addEventListener('mouseleave', () => {
        if (!isSelected) { el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.background = 'rgba(255,255,255,0.03)'; }
      });

      listEl.appendChild(el);
    });
  }

  container.querySelector('#check-order').addEventListener('click', () => {
    const isCorrect = items.every((item, i) => i === 0 || item.year >= items[i - 1].year);
    if (isCorrect) {
      showSuccess(container, room, onSuccess, 'Tökéletes időrend!');
    } else {
      attempts++;
      hintSkip.recordAttempt();
      const cards = listEl.children;
      const sorted = [...EVENTS].sort((a, b) => a.year - b.year);
      for (let i = 0; i < items.length; i++) {
        if (items[i].year !== sorted[i].year) {
          cards[i].style.borderColor = '#fc8181';
          cards[i].style.background = 'rgba(252, 129, 129, 0.08)';
        } else {
          cards[i].style.borderColor = '#68d391';
          cards[i].style.background = 'rgba(104, 211, 145, 0.08)';
        }
      }
      setTimeout(() => { selected = null; renderItems(); }, 2000);
    }
  });

  renderItems();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">⏳ Időkapszula</h2>

    <a href="games/flappy/index.html" style="display:block; text-decoration:none; margin-bottom:14px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🎂</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Repülő Tortácska</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Navigáld a süteményt a csövek között! →</p>
      </div>
    </a>

    <a href="games/asteroid/index.html" style="display:block; text-decoration:none; margin-bottom:14px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🚀</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Csillagvadász</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Lődd szét a szülinapi aszteroidákat! →</p>
      </div>
    </a>
  `;
}
