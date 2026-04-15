import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const QUESTIONS = [
  { q: 'Mi Dávid kedvenc étele?', options: ['Pörkölt', 'Pizza', 'Rántott hús', 'Tikka Massala'], correct: 'Pizza', hint: 'Olasz konyha klasszikus' },
  { q: 'Hány éves korában tanult meg biciklizni?', options: ['4', '5', '6', '7'], correct: '5', hint: 'Óvodás volt még' },
  { q: 'Mi Teri nagyi kedvenc sorozata?', options: ['Xo Kitty', 'Gentlemans', 'Blacklist', 'Ozark'], correct: 'Blacklist', hint: 'A lista' },
  { q: 'Melyik zenekar Zoli kedvence?', options: ['Queen', 'AC/DC', 'Metallica', 'Beatles'], correct: 'Queen', hint: 'Freddie Mercury' },
  { q: 'Hol született Gyuri nagyapa?', options: ['Budapest', 'Debrecen', 'Szeged', 'Balatonalmádi'], correct: 'Balatonalmádi', hint: 'Ebben nem segítek, ezt tudnod KELL' },
];

const FUN_FACTS = [
  'A legjobb reggelek azok, amikor hétvégén hagysz aludni, és amikor fölkelek, akkor friss reggelit készítesz nekem.',
  'A nyaralásainkon Te voltál a sofőr — összesen szerintem több mint 50,000 km-t vezettél miattunk.',
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
  { emoji: '🍽️', category: 'Leggyorsabb evő', winner: 'Apu — 3 perc alatt eltűnik a pörkölt' },
  { emoji: '😴', category: 'Legtöbbet alvó', winner: 'Placeholder — írd át!' },
  { emoji: '📺', category: 'Legtöbb sorozatot néző', winner: 'Placeholder — írd át!' },
  { emoji: '🎮', category: 'Legjobb játékos', winner: 'Placeholder — írd át!' },
  { emoji: '🗣️', category: 'Leghangosabb', winner: 'Placeholder — írd át!' },
  { emoji: '🧁', category: 'Legjobb szakács', winner: 'Placeholder — írd át!' },
  { emoji: '😂', category: 'Legviccesebb', winner: 'Placeholder — írd át!' },
  { emoji: '💪', category: 'Legerősebb', winner: 'Placeholder — írd át!' },
];

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🧠 Agytornaterem</h2>

    <a href="games/breakout/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🧱</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Birthday Breakout</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Törd szét a szülinapi téglákat! Kattints a játékhoz →</p>
      </div>
    </a>

    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Tudtad-e? — Fun Facts Apuról</p>
    ${FUN_FACTS.map(fact => `
      <div class="content-card"><p style="font-size:1rem;">💡 ${fact}</p></div>
    `).join('')}

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
