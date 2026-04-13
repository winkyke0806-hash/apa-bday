import { showSuccess, createHintSkip } from '../minigame-base.js';

const STEPS = [
  { instruction: 'Törd fel a tojásokat! 🥚', emoji: '🥚', target: 3 },
  { instruction: 'Szórd bele a lisztet! 🌾', emoji: '🌾', target: 5 },
  { instruction: 'Öntsd hozzá a tejet! 🥛', emoji: '🥛', target: 3 },
  { instruction: 'Keverd össze! 🥄', emoji: '🥄', target: 10 },
  { instruction: 'Tedd a sütőbe! 🔥', emoji: '🔥', target: 1 },
  { instruction: 'Díszítsd a tortát! 🎂', emoji: '🎂', target: 5 },
];

const VIDEOS = [
  { title: 'Videó üzenet 1', src: 'assets/video/video1.mp4', poster: 'assets/photos/video-poster1.jpg' },
  { title: 'Videó üzenet 2', src: 'assets/video/video2.mp4', poster: 'assets/photos/video-poster2.jpg' },
];

export function renderMinigame(container, room, onSuccess) {
  let currentStep = 0;
  let clicks = 0;

  function renderStep() {
    if (currentStep >= STEPS.length) {
      showSuccess(container, room, onSuccess, 'A torta kész! 🎂');
      return;
    }

    const step = STEPS[currentStep];
    clicks = 0;

    container.innerHTML = `
      <h2 class="minigame-title">🎬 Moziterem</h2>
      <p class="minigame-instructions">${currentStep + 1}/${STEPS.length} — ${step.instruction}</p>
      <div style="text-align:center;">
        <div id="cake-area" style="font-size:5rem; cursor:pointer; user-select:none; transition:transform 0.1s;">${step.emoji}</div>
        <p style="color:rgba(255,255,255,0.4); margin-top:12px; font-size:0.85rem;">
          Kattints! — <span id="click-count">0</span>/${step.target}
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
      barEl.style.width = (clicks / step.target * 100) + '%';
      cakeArea.style.transform = 'scale(1.2)';
      setTimeout(() => cakeArea.style.transform = 'scale(1)', 100);

      if (clicks >= step.target) {
        currentStep++;
        setTimeout(renderStep, 400);
      }
    });

    createHintSkip(container, ['Csak kattintgass!'],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderStep();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🎬 Moziterem</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Videó üzenetek neked, Apu!</p>
    ${VIDEOS.map(v => `
      <div class="content-card" style="text-align:center;">
        <h3 style="color:${room.color}; margin-bottom:12px;">${v.title}</h3>
        <video controls style="width:100%; border-radius:8px; max-height:400px;" poster="${v.poster}" preload="none">
          <source src="${v.src}" type="video/mp4">
          A böngésző nem támogatja a videó lejátszást.
        </video>
      </div>
    `).join('')}
  `;
}
