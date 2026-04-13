import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

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
  let items = shuffle([...EVENTS]);
  let selected = null;

  function render() {
    container.innerHTML = `
      <h2 class="minigame-title">⏳ Időkapszula</h2>
      <p class="minigame-instructions">Rakd időrendbe az eseményeket! Kattints két kártyára a cseréhez.</p>
      <div id="timeline-items" style="max-width:450px; margin:0 auto;"></div>
      <div style="text-align:center; margin-top:20px;">
        <button class="minigame-btn" id="check-order">Ellenőrzés ✓</button>
      </div>
    `;

    const listEl = container.querySelector('#timeline-items');
    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'content-card';
      el.style.cssText = `
        cursor:pointer; display:flex; align-items:center; gap:12px;
        border-color:${selected === index ? room.color : 'rgba(255,255,255,0.1)'};
        transition:border-color 0.2s;
      `;
      el.innerHTML = `<span style="font-size:1.5rem;">${item.icon}</span><span>${item.text}</span>`;
      el.addEventListener('click', () => {
        if (selected === null) {
          selected = index;
        } else {
          [items[selected], items[index]] = [items[index], items[selected]];
          selected = null;
        }
        render();
      });
      listEl.appendChild(el);
    });

    container.querySelector('#check-order').addEventListener('click', () => {
      const isCorrect = items.every((item, i) => i === 0 || item.year >= items[i - 1].year);
      if (isCorrect) {
        showSuccess(container, room, onSuccess, 'Tökéletes időrend!');
      } else {
        hintSkip.recordAttempt();
        const cards = listEl.children;
        for (let i = 1; i < items.length; i++) {
          if (items[i].year < items[i - 1].year) {
            cards[i].style.borderColor = '#fc8181';
            cards[i - 1].style.borderColor = '#fc8181';
          }
        }
        setTimeout(() => render(), 1500);
      }
    });

    hintSkip = createHintSkip(container,
      ['A legrégebbi esemény kerüljön legfelülre', 'Gondolj bele — a születés vagy az iskola volt előbb?'],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  let hintSkip;
  render();
}

export function renderContent(container, room) {
  const sorted = [...EVENTS].sort((a, b) => a.year - b.year);
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">⏳ Időkapszula</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Apu életének mérföldkövei</p>
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
