import { showSuccess, createHintSkip } from '../minigame-base.js';

const STEPS = [
  { instruction: 'Törd fel a tojásokat!', emoji: '🥚', target: 3, verb: 'Koppants' },
  { instruction: 'Szórd bele a lisztet!', emoji: '🌾', target: 5, verb: 'Szórj' },
  { instruction: 'Öntsd hozzá a tejet!', emoji: '🥛', target: 3, verb: 'Önts' },
  { instruction: 'Keverd össze alaposan!', emoji: '🥄', target: 8, verb: 'Keverj' },
  { instruction: 'Tedd a sütőbe!', emoji: '🔥', target: 1, verb: 'Nyomj' },
  { instruction: 'Díszítsd a tortát!', emoji: '🎂', target: 6, verb: 'Díszíts' },
];

const VIDEOS = [
  { title: 'Videó üzenet 1', src: 'assets/video/video1.mp4', poster: 'assets/photos/video-poster1.jpg' },
  { title: 'Videó üzenet 2', src: 'assets/video/video2.mp4', poster: 'assets/photos/video-poster2.jpg' },
];

export function renderMinigame(container, room, onSuccess) {
  let currentStep = 0;
  let clicks = 0;
  let combo = 0;
  let lastClickTime = 0;

  function renderStep() {
    if (currentStep >= STEPS.length) {
      showSuccess(container, room, onSuccess, 'A torta kész! 🎂');
      return;
    }

    const step = STEPS[currentStep];
    clicks = 0;
    combo = 0;

    container.innerHTML = `
      <h2 class="minigame-title">🎬 Moziterem — Tortakészítés</h2>
      <p class="minigame-instructions">${currentStep + 1}/${STEPS.length} — ${step.instruction}</p>

      <!-- Torta építési vizualizáció -->
      <div id="cake-layers" style="display:flex; flex-direction:column-reverse; align-items:center; gap:2px; margin-bottom:16px; min-height:60px;">
        ${buildCakeLayers(currentStep)}
      </div>

      <div style="text-align:center; position:relative;">
        <!-- Combo kijelző -->
        <div id="combo-display" style="
          font-size:0.7rem; color:${room.color}; margin-bottom:8px;
          min-height:20px; transition:all 0.2s; letter-spacing:2px;
        "></div>

        <!-- Nagy kattintható emoji -->
        <div id="cake-area" style="
          font-size:5rem; cursor:pointer; user-select:none;
          transition:transform 0.1s; display:inline-block;
          filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        ">${step.emoji}</div>

        <!-- Floating szám animáció konténer -->
        <div id="float-nums" style="position:relative; height:0; overflow:visible;"></div>

        <p style="color:rgba(255,255,255,0.3); margin-top:16px; font-size:0.8rem;">
          ${step.verb}: <span id="click-count" style="color:${room.color}; font-weight:bold;">0</span> / ${step.target}
        </p>

        <!-- Progress bar -->
        <div style="background:rgba(255,255,255,0.06); border-radius:10px; height:6px; max-width:280px; margin:10px auto; overflow:hidden;">
          <div id="step-bar" style="
            height:100%; background:linear-gradient(90deg, ${room.color}, ${room.color}cc);
            width:0%; transition:width 0.2s cubic-bezier(0.4,0,0.2,1); border-radius:10px;
            position:relative;
          ">
            <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:shimmer 2s ease-in-out infinite;"></div>
          </div>
        </div>
      </div>
    `;

    const cakeArea = container.querySelector('#cake-area');
    const countEl = container.querySelector('#click-count');
    const barEl = container.querySelector('#step-bar');
    const comboEl = container.querySelector('#combo-display');
    const floatNums = container.querySelector('#float-nums');

    cakeArea.addEventListener('click', (e) => {
      clicks++;
      const now = Date.now();

      // Combo rendszer
      if (now - lastClickTime < 400) {
        combo++;
      } else {
        combo = 1;
      }
      lastClickTime = now;

      // Combo kijelzés
      if (combo > 2) {
        comboEl.textContent = `🔥 ${combo}x COMBO!`;
        comboEl.style.transform = `scale(${1 + combo * 0.05})`;
      } else {
        comboEl.textContent = '';
        comboEl.style.transform = 'scale(1)';
      }

      // Frissítések
      countEl.textContent = clicks;
      barEl.style.width = Math.min(100, (clicks / step.target * 100)) + '%';

      // Emoji animáció — combo-tól függő erősség
      const scaleAmount = 1.15 + Math.min(combo * 0.03, 0.2);
      cakeArea.style.transform = `scale(${scaleAmount}) rotate(${(Math.random() - 0.5) * 8}deg)`;
      setTimeout(() => cakeArea.style.transform = 'scale(1) rotate(0deg)', 100);

      // Lebegő +1 szám
      const floatEl = document.createElement('div');
      floatEl.textContent = combo > 2 ? `+${combo}` : '+1';
      floatEl.style.cssText = `
        position:absolute; left:${40 + Math.random() * 20}%; top:0;
        color:${room.color}; font-size:${0.8 + Math.min(combo * 0.1, 0.5)}rem; font-weight:bold;
        pointer-events:none; opacity:1; transition:all 0.6s ease-out;
      `;
      floatNums.appendChild(floatEl);
      requestAnimationFrame(() => {
        floatEl.style.transform = `translateY(-${30 + Math.random() * 20}px)`;
        floatEl.style.opacity = '0';
      });
      setTimeout(() => floatEl.remove(), 600);

      // Lépés kész?
      if (clicks >= step.target) {
        cakeArea.style.pointerEvents = 'none';
        cakeArea.style.transform = 'scale(1.3)';
        currentStep++;
        setTimeout(renderStep, 500);
      }
    });

    createHintSkip(container, [`Kattintgass az ${step.emoji} emojira!`],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderStep();
}

function buildCakeLayers(step) {
  const layers = [];
  const layerStyles = [
    { w: 100, h: 14, bg: '#f5e6c8', label: 'tészta' },  // step 0-2: alap
    { w: 90, h: 10, bg: '#e8d5a3', label: 'kevert' },    // step 3: keverés
    { w: 85, h: 12, bg: '#d4a574', label: 'sült' },       // step 4: sütés
    { w: 95, h: 8, bg: '#f687b3', label: 'díszített' },   // step 5: díszítés
  ];

  if (step >= 3) layers.push(layerStyles[0]);
  if (step >= 4) layers.push(layerStyles[1]);
  if (step >= 5) layers.push(layerStyles[2]);

  return layers.map(l => `
    <div style="width:${l.w}px; height:${l.h}px; background:${l.bg}; border-radius:4px; opacity:0.6;"></div>
  `).join('');
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
