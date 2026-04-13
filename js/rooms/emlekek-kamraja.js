import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

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
  const cards = shuffle([...PHOTOS, ...PHOTOS].map((p, i) => ({ ...p, uid: i })));
  let flipped = [];
  let matched = 0;
  let locked = false;

  container.innerHTML = `
    <h2 class="minigame-title">📸 Emlékek Kamrája</h2>
    <p class="minigame-instructions">Találd meg a párokat! Fordíts fel két kártyát egyszerre.</p>
    <div id="memory-grid" style="
      display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
      max-width:500px; margin:0 auto;
    "></div>
  `;

  const gridEl = container.querySelector('#memory-grid');

  cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.dataset.index = index;
    el.style.cssText = `
      aspect-ratio:1; border-radius:8px; cursor:pointer;
      background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15);
      display:flex; align-items:center; justify-content:center;
      font-size:2rem; transition:all 0.3s;
    `;
    el.textContent = '?';

    el.addEventListener('click', () => {
      if (locked || flipped.includes(index) || el.dataset.matched) return;

      el.style.background = `url(${card.src}) center/cover, rgba(255,255,255,0.15)`;
      el.textContent = '';
      el.style.borderColor = room.color;
      flipped.push(index);

      if (flipped.length === 2) {
        locked = true;
        const [i1, i2] = flipped;

        if (cards[i1].id === cards[i2].id) {
          matched++;
          gridEl.children[i1].dataset.matched = true;
          gridEl.children[i2].dataset.matched = true;
          flipped = [];
          locked = false;
          if (matched === PHOTOS.length) {
            setTimeout(() => showSuccess(container, room, onSuccess, 'Minden párt megtaláltál!'), 500);
          }
        } else {
          hintSkip.recordAttempt();
          setTimeout(() => {
            [i1, i2].forEach(i => {
              gridEl.children[i].style.background = 'rgba(255,255,255,0.08)';
              gridEl.children[i].style.borderColor = 'rgba(255,255,255,0.15)';
              gridEl.children[i].textContent = '?';
            });
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
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">📸 Emlékek Kamrája</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">A legszebb közös emlékeink</p>
    <div class="content-gallery">
      ${GALLERY_PHOTOS.map(p => `
        <div style="text-align:center;">
          <img src="${p.src}" alt="${p.caption}"
            style="width:100%; border-radius:8px; border:2px solid rgba(255,255,255,0.1);"
            onerror="this.style.background='rgba(255,255,255,0.05)'; this.style.minHeight='150px';">
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:6px;">${p.caption}</p>
        </div>
      `).join('')}
    </div>
  `;
}
