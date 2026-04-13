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

  const gridEl = container.querySelector('#lego-grid');
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        width:36px; height:36px; border-radius:4px; cursor:pointer;
        background:rgba(255,255,255,0.02); transition:background 0.15s;
        display:flex; align-items:center; justify-content:center;
      `;

      const cy = y, cx = x;
      cell.addEventListener('click', () => {
        if (!grid[cy][cx]) {
          grid[cy][cx] = selectedColor;
          cell.style.background = selectedColor;
          cell.innerHTML = '<div style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.2);"></div>';
          placedBricks++;
          container.querySelector('#brick-count').textContent = placedBricks;
          if (placedBricks >= TARGET_BRICKS) {
            setTimeout(() => showSuccess(container, room, onSuccess, 'Remek építmény!'), 500);
          }
        } else {
          grid[cy][cx] = null;
          cell.style.background = 'rgba(255,255,255,0.02)';
          cell.innerHTML = '';
          placedBricks = Math.max(0, placedBricks - 1);
          container.querySelector('#brick-count').textContent = placedBricks;
        }
      });

      cell.addEventListener('mouseenter', () => {
        if (!grid[cy][cx]) cell.style.background = selectedColor + '44';
      });
      cell.addEventListener('mouseleave', () => {
        if (!grid[cy][cx]) cell.style.background = 'rgba(255,255,255,0.02)';
      });

      gridEl.appendChild(cell);
    }
  }

  createHintSkip(container, ['Építs egy házat, autót, vagy bármit!'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
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
