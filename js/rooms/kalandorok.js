import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const CHALLENGES = [
  {
    description: 'Kis autók, nagy sebesség, éles kanyarok és a gumik sikítása. Versenyzés apróban, de teljes gázzal!',
    answer: 'Gokart pálya',
    options: ['Gokart pálya', 'Autóverseny', 'Bowling'],
    hint: 'Kormány a kézben, sisak a fejen 🏎️',
  },
  {
    description: 'Hullámvasút, körhinta, cukorvatta és nevetés. Napnyugtáig bírtuk — még a legijesztőbb játékra is felültünk.',
    answer: 'Vidámpark',
    options: ['Vidámpark', 'Strand', 'Játszótér'],
    hint: 'Forog, pörög, sikít 🎢',
  },
  {
    description: 'Olaj, csavarhúzó, egy makacs csavar és sok türelem. Amit mások kidobtak volna, mi rendbe hoztuk együtt.',
    answer: 'Szerelés',
    options: ['Szerelés', 'Barkácsolás', 'Festés'],
    hint: 'Csavarkulcs a kézben, olajos ujjak 🔧',
  },
];

export function renderMinigame(container, room, onSuccess) {
  const challenges = shuffle([...CHALLENGES]);
  let current = 0;
  let score = 0;

  function renderChallenge() {
    if (current >= challenges.length) {
      showSuccess(container, room, onSuccess, `${score}/${challenges.length} — Szoba feloldva!`);
      return;
    }

    const c = challenges[current];
    const options = shuffle(c.options);

    container.innerHTML = `
      <h2 class="minigame-title">🏎️ Kalandorok Klubja</h2>
      <p class="minigame-instructions">${current + 1}/${challenges.length} — Hol voltunk? Találd ki a leírás alapján!</p>
      <div style="
        max-width:420px; margin:0 auto 20px;
        background:rgba(255,255,255,0.04); border:1px solid ${room.color}44;
        border-radius:14px; padding:22px 20px; text-align:center;
        font-family:'Playfair Display',Georgia,serif; font-size:1.05rem; line-height:1.6;
        color:rgba(255,255,255,0.85);
      ">
        <div style="font-size:2.2rem; margin-bottom:10px;">🗺️</div>
        ${c.description}
      </div>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:350px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === c.answer) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { current++; renderChallenge(); }, 1200);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container, [c.hint],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderChallenge();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🏎️ Kalandorok Klubja</h2>

    <!-- Gokart game link (nagy kártya) -->
    <a href="games/gokart/index.html" style="display:block; text-decoration:none; max-width:560px; margin:20px auto;">
      <div class="content-card" style="
        border:2px solid ${room.color};
        background:linear-gradient(135deg, ${room.color}18, ${room.color}08);
        text-align:center; cursor:pointer; transition:all 0.3s;
        padding:40px 30px; border-radius:20px;
        box-shadow:0 8px 32px ${room.color}22;
      "
      onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px ${room.color}44';"
      onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 8px 32px ${room.color}22';">
        <div style="font-size:5.5rem; margin-bottom:16px; filter:drop-shadow(0 4px 16px ${room.color}66);">🏎️</div>
        <h3 style="color:${room.color}; font-family:var(--font-display); font-size:1.8rem; margin:0 0 10px;">Villám Verseny GP</h3>
        <p style="color:rgba(255,255,255,0.7); font-size:1rem; margin:0 0 16px; line-height:1.5;">
          Száguldj végig a versenypályán, előzd le az ellenfeleket és dönts körrekordot!
        </p>
        <div style="
          display:inline-block; background:${room.color}; color:#000;
          padding:12px 32px; border-radius:30px; font-weight:bold;
          font-size:0.95rem; letter-spacing:1px;
        ">INDULÁS →</div>
      </div>
    </a>
  `;
}
