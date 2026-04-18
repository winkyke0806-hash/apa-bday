import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// Placeholder — a user cseréli saját dalokra
const SONGS = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', lyric: '"Is this the real life? Is this just fantasy..."', hint: 'Freddie Mercury klasszikusa' },
  { title: 'Hotel California', artist: 'Eagles', lyric: '"On a dark desert highway, cool wind in my hair..."', hint: 'Kaliforniai szálloda' },
  { title: 'Imagine', artist: 'John Lennon', lyric: '"Imagine there\'s no heaven, it\'s easy if you try..."', hint: 'Képzeld el...' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', lyric: '"Load up on guns, bring your friends..."', hint: '90-es évek grunge himnusza' },
  { title: 'Yesterday', artist: 'The Beatles', lyric: '"Yesterday, all my troubles seemed so far away..."', hint: 'Tegnap még minden más volt' },
];

const PLAYLIST = [
  { title: 'Kedvenc dal 1', artist: 'Előadó 1' },
  { title: 'Kedvenc dal 2', artist: 'Előadó 2' },
  { title: 'Kedvenc dal 3', artist: 'Előadó 3' },
  { title: 'Kedvenc dal 4', artist: 'Előadó 4' },
  { title: 'Kedvenc dal 5', artist: 'Előadó 5' },
];

export function renderMinigame(container, room, onSuccess) {
  let currentRound = 0;
  let score = 0;
  const rounds = shuffle(SONGS).slice(0, 3);

  function renderRound() {
    if (currentRound >= rounds.length) {
      showSuccess(container, room, onSuccess, `${score}/${rounds.length} helyes — Szoba feloldva!`);
      return;
    }

    const song = rounds[currentRound];
    const options = shuffle([song.title, ...getDecoys(song.title)]);

    container.innerHTML = `
      <h2 class="minigame-title">🎵 Hangok Terme</h2>
      <p class="minigame-instructions">${currentRound + 1}/${rounds.length} — Melyik dal ez?</p>
      <div style="text-align:center; margin-bottom:20px;">
        <div style="
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
          border-radius:12px; padding:20px; max-width:400px; margin:0 auto;
          font-style:italic; font-size:1.1rem; color:rgba(255,255,255,0.8); line-height:1.6;
        ">
          ${song.lyric}
        </div>
        <p style="font-size:0.7rem; color:rgba(255,255,255,0.3); margin-top:8px;">👆 Ismerd fel a dalszövegből!</p>
      </div>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === song.title) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { currentRound++; renderRound(); }, 800);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container,
      [song.hint, `Előadó: ${song.artist}`],
      () => { showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!'); }
    );
  }

  renderRound();
}

function getDecoys(correctTitle) {
  const all = SONGS.map(s => s.title).filter(t => t !== correctTitle);
  return shuffle(all).slice(0, 2);
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
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">A közös kedvenc dalaink gyűjteménye</p>
    <div class="playlist">
      ${PLAYLIST.map((s, i) => `
        <div class="content-card" style="display:flex; align-items:center; gap:16px;">
          <span style="font-size:1.5rem; color:${room.color};">${i + 1}</span>
          <div>
            <strong>${s.title}</strong>
            <div style="font-size:0.8rem; color:rgba(255,255,255,0.5);">${s.artist}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
