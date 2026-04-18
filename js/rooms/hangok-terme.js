import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// Dalszöveg kiegészítés — a user cseréli saját dalokra
const LYRICS_QUIZ = [
  { lyric: '"Be vagyok zárva ____"', answer: 'Magyarországra', options: ['Magyarországra', 'Angliába', 'Már a szobámba', 'Amerikába'], song: 'Queen — We Will Rock You', hint: 'Stadion himnusz' },
  { lyric: '"Írok rá valami ____"', answer: 'szívbemarkolót', options: ['nagyon jót', 'szívbemarkolót', 'kedveset', 'hasonlót'], song: 'Queen — Bohemian Rhapsody', hint: 'Freddie Mercury 6 perces remekműve' },
  { lyric: '"Imagine all the people, living life in ___"', answer: 'peace', options: ['peace', 'love', 'harmony', 'joy'], song: 'John Lennon — Imagine', hint: 'Képzeld el...' },
  { lyric: '"Yesterday, all my ___ seemed so far away"', answer: 'troubles', options: ['troubles', 'dreams', 'friends', 'worries'], song: 'The Beatles — Yesterday', hint: 'Tegnap még minden más volt' },
  { lyric: '"I will always ___ you"', answer: 'love', options: ['love', 'miss', 'need', 'want'], song: 'Whitney Houston — I Will Always Love You', hint: 'Whitney Houston klasszikusa' },
  { lyric: '"Don\'t stop me now, I\'m having such a good ___"', answer: 'time', options: ['time', 'day', 'life', 'ride'], song: 'Queen — Don\'t Stop Me Now', hint: 'Freddie nem áll meg' },
];


export function renderMinigame(container, room, onSuccess) {
  let currentRound = 0;
  let score = 0;
  const rounds = shuffle(LYRICS_QUIZ).slice(0, 4);

  function renderRound() {
    if (currentRound >= rounds.length) {
      showSuccess(container, room, onSuccess, `${score}/${rounds.length} helyes — Szoba feloldva!`);
      return;
    }

    const q = rounds[currentRound];
    const options = shuffle(q.options);
    const lyricParts = q.lyric.split('___');

    container.innerHTML = `
      <h2 class="minigame-title">🎵 Hangok Terme</h2>
      <p class="minigame-instructions">${currentRound + 1}/${rounds.length} — Egészítsd ki a dalszöveget!</p>
      <div style="text-align:center; margin-bottom:20px;">
        <div style="
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
          border-radius:12px; padding:24px; max-width:420px; margin:0 auto;
          font-style:italic; font-size:1.15rem; color:rgba(255,255,255,0.8); line-height:1.8;
        ">
          ${lyricParts[0]}<span style="
            display:inline-block; min-width:60px; border-bottom:3px solid ${room.color};
            color:${room.color}; font-weight:bold; margin:0 4px; padding:0 8px;
          " id="blank-word">???</span>${lyricParts[1] || ''}
        </div>
        <p style="font-size:0.65rem; color:rgba(255,255,255,0.25); margin-top:8px;">Mi a hiányzó szó?</p>
      </div>
      <div id="options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:350px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    const blankEl = container.querySelector('#blank-word');

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        blankEl.textContent = opt;
        if (opt === q.answer) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
          blankEl.style.color = '#68d391';
          blankEl.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          blankEl.style.color = '#fc8181';
          blankEl.style.borderColor = '#fc8181';
          // Show correct
          [...optionsEl.children].find(b => b.textContent === q.answer).style.background = 'rgba(104, 211, 145, 0.2)';
          hintSkip.recordAttempt();
        }
        // Show song name
        setTimeout(() => {
          blankEl.textContent = q.answer;
          blankEl.style.color = room.color;
          blankEl.style.borderColor = room.color;
        }, 400);
        setTimeout(() => { currentRound++; renderRound(); }, 1200);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container,
      ['Gondolkodj... melyik szó illik oda?'],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderRound();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <a href="games/rhythm/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🎵</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Ritmus Mester</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Kapd el a ritmust — üsd a billentyűt időben! →</p>
      </div>
    </a>
    <h2 class="content-title" style="color:${room.color}">🎵 Hangok Terme</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:16px;">Hallgasd meg a közös kedvenc dalainkat!</p>
    <div style="border-radius:12px; overflow:hidden; max-width:500px; margin:0 auto;">
      <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/3fOLDZYzFl7p6X4OMCWHFL?utm_source=generator&theme=0" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    </div>
  `;
}
