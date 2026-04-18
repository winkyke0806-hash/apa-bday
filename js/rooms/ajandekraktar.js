import { showSuccess, createHintSkip } from '../minigame-base.js';

const COUPONS = [
  { title: 'Mosogatás', description: 'Egy teljes nap mosogatást vállalok!', emoji: '🍽️' },
  { title: 'Főzés', description: 'Főzök amit csak kérsz!', emoji: '👨‍🍳' },
  { title: 'Gokart', description: 'Menjünk el 3 körre a Flashcartba - én állom', emoji: '🏎️' },
  { title: 'Filmnap', description: 'Te választod a filmet, én hozom a popcornt!', emoji: '🍿' },
  { title: 'Autómosás', description: 'Megmosom az autót kívül-belül', emoji: '🚗' },
  { title: 'Szabadnap', description: 'Egy nap amikor mindent én intézek', emoji: '😴' },
];

export function renderMinigame(container, room, onSuccess) {
  let revealed = 0;
  const targetReveals = COUPONS.length;

  container.innerHTML = `
    <h2 class="minigame-title">🎁 Ajándékraktár</h2>
    <p class="minigame-instructions">Kapard le a sorsjegyeket! Húzd az egered a szürke felületen.</p>
    <div id="scratch-cards" style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; max-width:500px; margin:0 auto;"></div>
  `;

  const cardsEl = container.querySelector('#scratch-cards');

  COUPONS.forEach(coupon => {
    const card = document.createElement('div');
    card.style.cssText = 'position:relative; aspect-ratio:3/4; border-radius:12px; overflow:hidden;';

    // Kupon tartalom alatta
    const content = document.createElement('div');
    content.style.cssText = `
      position:absolute; inset:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center; padding:12px; text-align:center;
      background:rgba(255,255,255,0.05); border:2px solid ${room.color}; border-radius:12px;
    `;
    content.innerHTML = `
      <div style="font-size:2.5rem;">${coupon.emoji}</div>
      <div style="font-size:0.85rem; font-weight:bold; color:${room.color}; margin-top:8px;">${coupon.title}</div>
      <div style="font-size:0.7rem; color:rgba(255,255,255,0.5); margin-top:4px;">${coupon.description}</div>
    `;

    // Scratch overlay (div-based, nem canvas)
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute; inset:0; background:#4a5568; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      cursor:crosshair; transition:opacity 0.5s;
      font-size:0.8rem; color:rgba(255,255,255,0.3); font-family:var(--font-mono);
      user-select:none;
    `;
    overlay.textContent = 'Kapard le!';

    // Scratch cells grid felette
    const scratchGrid = document.createElement('div');
    scratchGrid.style.cssText = `
      position:absolute; inset:0; display:grid;
      grid-template-columns:repeat(5,1fr); grid-template-rows:repeat(6,1fr);
      border-radius:12px; overflow:hidden; cursor:crosshair;
    `;

    const totalCells = 30;
    let clearedCells = 0;
    const threshold = Math.floor(totalCells * 0.4); // 40% elég

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        background:#4a5568; transition:opacity 0.3s;
        border:0.5px solid rgba(255,255,255,0.03);
      `;
      cell.dataset.cleared = 'false';

      const clearCell = () => {
        if (cell.dataset.cleared === 'true') return;
        cell.dataset.cleared = 'true';
        cell.style.opacity = '0';
        clearedCells++;

        if (clearedCells >= threshold && !card.dataset.done) {
          card.dataset.done = 'true';
          // Eltüntetjük az egész scratch réteget
          scratchGrid.style.opacity = '0';
          scratchGrid.style.pointerEvents = 'none';
          overlay.style.opacity = '0';
          revealed++;

          if (revealed >= targetReveals) {
            setTimeout(() => showSuccess(container, room, onSuccess, 'Minden kupont lekapartál!'), 600);
          }
        }
      };

      cell.addEventListener('mouseenter', (e) => { if (e.buttons > 0) clearCell(); });
      cell.addEventListener('mousedown', clearCell);
      cell.addEventListener('touchstart', (e) => { e.preventDefault(); clearCell(); });
      cell.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.dataset.cleared === 'false' && el.parentElement === scratchGrid) {
          el.dataset.cleared = 'true';
          el.style.opacity = '0';
          clearedCells++;
          if (clearedCells >= threshold && !card.dataset.done) {
            card.dataset.done = 'true';
            scratchGrid.style.opacity = '0';
            scratchGrid.style.pointerEvents = 'none';
            overlay.style.opacity = '0';
            revealed++;
            if (revealed >= targetReveals) {
              setTimeout(() => showSuccess(container, room, onSuccess, 'Minden kupont lekapartál!'), 600);
            }
          }
        }
      });

      scratchGrid.appendChild(cell);
    }

    card.appendChild(content);
    card.appendChild(overlay);
    card.appendChild(scratchGrid);
    cardsEl.appendChild(card);
  });

  createHintSkip(container, ['Húzd az egered a szürke felületen — lenyomva tartva kaparj!'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <a href="games/slots/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🔨</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Kopogtató Káosz</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Csapj le a meglepetésekre mielőtt elbújnak! →</p>
      </div>
    </a>
    <h2 class="content-title" style="color:${room.color}">🎁 Ajándékraktár</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Kuponok — bármikor beválthatóak!</p>
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
