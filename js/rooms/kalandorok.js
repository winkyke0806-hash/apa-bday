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
    description: 'Csend, víz, egy bot és a türelem. A legnagyobb fogás az emlék maradt.',
    answer: 'Horgászás',
    options: ['Horgászás', 'Kirándulás', 'Kempingezés'],
    hint: 'Úszó a vízen, halak a mélyben 🎣',
  },
];

const ADVENTURES = [
  { title: 'Gokartozás', story: 'Emlékszel amikor először ültünk gokartba együtt? Te olyan gyorsan mentél! Azóta is minden körben jobbak leszünk.' },
  { title: 'Vidámpark', story: 'Egész napos vidámparki kaland — még a legijesztőbb hullámvasútra is felültünk. Másnap a lábam még remegett, a tiéd nem.' },
  { title: 'Horgászás', story: 'Csendes reggel a víz partján, bot a kézben, egy kis beszélgetés. Nem a hal volt a lényeg — hanem hogy együtt voltunk.' },
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
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">A legjobb közös kalandjaink</p>

    <!-- Gokart game link -->
    <a href="games/gokart/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer; transition:all 0.3s;">
        <div style="font-size:3rem; margin-bottom:8px;">🏎️</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Villám Verseny GP</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Száguldj végig a versenypályán! Kattints a játékhoz →</p>
      </div>
    </a>

    ${ADVENTURES.map(a => `
      <div class="content-card">
        <h3 style="color:${room.color};">${a.title}</h3>
        <p style="color:rgba(255,255,255,0.6); margin-top:8px; line-height:1.6;">${a.story}</p>
      </div>
    `).join('')}
  `;
}
