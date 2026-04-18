import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const QUESTIONS = [
  { q: 'Mi Dávid kedvenc étele?', options: ['Pörkölt', 'Pizza', 'Rántott hús', 'Tikka Massala'], correct: 'Pizza', hint: 'Olasz konyhai klasszikus' },
  { q: 'Mi Teri nagyi kedvenc sorozata?', options: ['Xo Kitty', 'Gentlemans', 'Blacklist', 'Ozark'], correct: 'Blacklist', hint: 'A lista' },
  { q: 'Melyik zenekar Zoli kedvence?', options: ['Imagine Dragons', 'AC/DC', 'Beatles', 'Queen'], correct: 'Imagine Dragons', hint: 'Láttük őket élőben a szigeten - Its where my demons hide' },
  { q: 'Hol született Gyuri nagyapa?', options: ['Budapest', 'Debrecen', 'Szeged', 'Balatonalmádi'], correct: 'Balatonalmádi', hint: 'Ebben nem segítek, ezt tudnod KELL' },
];

export function renderMinigame(container, room, onSuccess) {
  const questions = shuffle(QUESTIONS).slice(0, 4);
  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      const rating = score === questions.length ? 'Tökéletes!' :
                     score >= 2 ? 'Szép eredmény!' : 'Hát... van még mit gyakorolni!';
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

// Placeholder — a user cseréli saját családi rekordokra
const FAMILY_RECORDS = [
  { emoji: '🍽️', category: 'Leggyorsabb evő', winner: 'Apa - Rekord idő alatt pusztítja magába a kaját ha éhes.' },
  { emoji: '😴', category: 'Legtöbbet alvó', winner: 'Apu - ÉBRESZTŐ??? Mi az neki?' },
  { emoji: '📺', category: 'Legtöbb sorozatot néző', winner: 'Teri nagyi - Hihetetlen mennyiségű sorozatot nézett meg, szerintem a streaming szolgáltatások nem tudnak olyat kihozni, amit ő már nem látott volna.' },
  { emoji: '🎮', category: 'Legjobb játékos', winner: 'Dávid - Túl sokat játszik, és ha odafigyel, szinte verhetetlen.' },
  { emoji: '🗣️', category: 'Leghangosabb', winner: 'Teri nagyi - Bocsánat nagyi!' },
  { emoji: '🧁', category: 'Legjobb szakács', winner: 'Apu - Nem ő fél a receptektől, a receptek félnek tőle, hogy túl jóra sikerül a kaja amit csinál.' },
  { emoji: '💪', category: 'Legerősebb', winner: 'Apa - Claudiának köszönhetően bika szintű ereje van.' },
];

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🧠 Agytornaterem</h2>

    <a href="games/breakout/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🧱</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Torta Romboló</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Zúzd porrá az ünnepi falat labdával! Kattints a játékhoz →</p>
      </div>
    </a>

    <h3 style="color:${room.color}; text-align:center; margin:28px 0 16px; font-family:var(--font-display);">🏅 Családi Rekordok</h3>
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">
      ${FAMILY_RECORDS.map(r => `
        <div class="content-card" style="text-align:center; padding:14px;">
          <div style="font-size:1.8rem; margin-bottom:6px;">${r.emoji}</div>
          <div style="font-size:0.75rem; color:${room.color}; font-weight:bold; margin-bottom:4px;">${r.category}</div>
          <div style="font-size:0.9rem;">${r.winner}</div>
        </div>
      `).join('')}
    </div>
  `;
}
