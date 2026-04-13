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

  COUPONS.slice(0, targetScratches).forEach(coupon => {
    const card = document.createElement('div');
    card.style.cssText = 'position:relative; aspect-ratio:3/4; border-radius:12px; overflow:hidden;';

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

    function scratch(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      const imageData = ctx.getImageData(0, 0, 200, 260);
      let transparent = 0;
      for (let j = 3; j < imageData.data.length; j += 4) {
        if (imageData.data[j] === 0) transparent++;
      }

      if (transparent / (200 * 260) > 0.5 && !card.dataset.done) {
        card.dataset.done = 'true';
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 0.5s';
        scratched++;
        if (scratched >= targetScratches) {
          setTimeout(() => showSuccess(container, room, onSuccess, 'Minden kupont lekapartál!'), 600);
        }
      }
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: (touch.clientX - rect.left) / rect.width * 200, y: (touch.clientY - rect.top) / rect.height * 260 };
    }

    canvas.addEventListener('mousedown', e => { isScratching = true; scratch(...Object.values(getPos(e))); });
    canvas.addEventListener('mousemove', e => { if (isScratching) scratch(...Object.values(getPos(e))); });
    canvas.addEventListener('mouseup', () => isScratching = false);
    canvas.addEventListener('mouseleave', () => isScratching = false);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); isScratching = true; scratch(...Object.values(getPos(e))); });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (isScratching) scratch(...Object.values(getPos(e))); });
    canvas.addEventListener('touchend', () => isScratching = false);

    card.appendChild(content);
    card.appendChild(canvas);
    cardsEl.appendChild(card);
  });

  createHintSkip(container, ['Húzd az egered a szürke felületen'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );
}

export function renderContent(container, room) {
  container.innerHTML = `
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
