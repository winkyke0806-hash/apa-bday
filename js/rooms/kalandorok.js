import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const CHALLENGES = [
  { image: 'assets/photos/adventure1.jpg', answer: 'Gokart pálya', options: ['Gokart pálya', 'Autóverseny', 'Bowling'], hint: 'Kicsi autók, nagy sebesség', blur: 15 },
  { image: 'assets/photos/adventure2.jpg', answer: 'Szabadulószoba', options: ['Szabadulószoba', 'Múzeum', 'Mozi'], hint: 'Rejtvények és zárak', blur: 15 },
  { image: 'assets/photos/adventure3.jpg', answer: 'Vidámpark', options: ['Vidámpark', 'Strand', 'Játszótér'], hint: 'Hullámvasút!', blur: 15 },
];

const ADVENTURES = [
  { title: 'Gokartozás', photo: 'assets/photos/adventure1.jpg', story: 'Emlékszel amikor először ültünk gokartba együtt? Te olyan gyorsan mentél!' },
  { title: 'Szabadulószoba', photo: 'assets/photos/adventure2.jpg', story: 'Az a szabadulószoba ahonnan majdnem nem jutottunk ki időben! Igazi csapatmunka volt.' },
  { title: 'Vidámpark', photo: 'assets/photos/adventure3.jpg', story: 'Egész napos vidámparki kaland — még a legijesztőbb hullámvasútra is felültünk!' },
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
    let blur = c.blur;

    container.innerHTML = `
      <h2 class="minigame-title">🏎️ Kalandorok Klubja</h2>
      <p class="minigame-instructions">${current + 1}/${challenges.length} — Hol voltunk? A kép lassan kitisztul...</p>
      <div style="text-align:center; margin-bottom:20px;">
        <div id="blur-image" style="
          width:300px; height:200px; margin:0 auto; border-radius:12px; overflow:hidden;
          border:2px solid rgba(255,255,255,0.1);
          background:url(${c.image}) center/cover;
          filter:blur(${blur}px); transition:filter 0.4s;
        "></div>
      </div>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:350px; margin:0 auto;"></div>
    `;

    const imgEl = container.querySelector('#blur-image');
    const interval = setInterval(() => {
      blur = Math.max(0, blur - 1);
      imgEl.style.filter = `blur(${blur}px)`;
      if (blur <= 0) clearInterval(interval);
    }, 500);

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        clearInterval(interval);
        imgEl.style.filter = 'blur(0px)';
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
      () => { clearInterval(interval); showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
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
        <img src="${a.photo}" alt="${a.title}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:12px;" onerror="this.style.display='none'">
        <h3 style="color:${room.color};">${a.title}</h3>
        <p style="color:rgba(255,255,255,0.6); margin-top:8px; line-height:1.6;">${a.story}</p>
      </div>
    `).join('')}
  `;
}
