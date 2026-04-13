import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const QUESTIONS = [
  { q: 'Mi Apu kedvenc étele?', options: ['Pörkölt', 'Gulyás', 'Rántott hús', 'Pizza'], correct: 'Pörkölt', hint: 'Magyar konyha klasszikus' },
  { q: 'Hány éves korában tanult meg biciklizni?', options: ['4', '5', '6', '7'], correct: '5', hint: 'Óvodás volt még' },
  { q: 'Mi Apu kedvenc filmje?', options: ['Terminator', 'Die Hard', 'Star Wars', 'Indiana Jones'], correct: 'Die Hard', hint: 'Bruce Willis a főszereplő' },
  { q: 'Melyik zenekar a kedvence?', options: ['Queen', 'AC/DC', 'Metallica', 'Beatles'], correct: 'Queen', hint: 'Freddie Mercury' },
  { q: 'Hol született Apu?', options: ['Budapest', 'Debrecen', 'Szeged', 'Győr'], correct: 'Budapest', hint: 'A fővárosban' },
];

const FUN_FACTS = [
  'Apu 3 éves korában már LEGO-zott!',
  'A legtöbb nyaralásunkon Apu volt a sofőr — összesen kb. 50,000 km-t vezetett miattunk.',
  'Apu kedvenc napszaka a reggel, mert akkor a legcsendesebb.',
];

export function renderMinigame(container, room, onSuccess) {
  const questions = shuffle(QUESTIONS).slice(0, 4);
  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      const rating = score === questions.length ? 'Tökéletes! Te aztán ismered Aput!' :
                     score >= 2 ? 'Szép eredmény!' : 'Hát... gyakorolj még! 😄';
      showSuccess(container, room, onSuccess, `${score}/${questions.length} — ${rating}`);
      return;
    }

    const q = questions[currentQ];
    const options = shuffle(q.options);

    container.innerHTML = `
      <h2 class="minigame-title">🧠 Agytornaterem</h2>
      <p class="minigame-instructions">${currentQ + 1}/${questions.length} — ${q.q}</p>
      <div id="options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === q.correct) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          const correctBtn = [...optionsEl.children].find(b => b.textContent === q.correct);
          if (correctBtn) correctBtn.style.background = 'rgba(104, 211, 145, 0.2)';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { currentQ++; renderQuestion(); }, 1000);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container, [q.hint],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderQuestion();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🧠 Agytornaterem</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Tudtad-e? — Fun Facts Apuról</p>
    ${FUN_FACTS.map(fact => `
      <div class="content-card"><p style="font-size:1rem;">💡 ${fact}</p></div>
    `).join('')}
  `;
}
