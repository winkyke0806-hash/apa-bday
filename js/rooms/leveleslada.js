import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const PUZZLE_IMAGE = 'assets/photos/puzzle.jpg';
const GRID_SIZE = 3;

const MESSAGES = [
  { from: 'Dávid', text: 'Boldog szülinapot Apu! Nagyon szeretlek és hálás vagyok mindenért amit értem teszel, és szeretném ha tudnád, hogy nálad jobb apukát nem is kívánhattam volna. ❤️' },
  { from: 'Teri nagyi', text: 'Boldogságos Szülinapot Bogyókám! Minden Jót kívánok, teljesüljön minden kívánságod! Szeretlek, Mami' },
  { from: 'Gyuri Nagyapa', text: 'Drága Zsoltikám! Te vagy a 3 generációnk közepe, az origó, Tőled tanul(t)unk sok mindent, hogy eligazodjunk a világban. Középkorú vagy, de ez felelősséget is jelent öregekért és az utánad jövőkért is. Köszönönöm, hogy büszkék lehetünk Rád, szerethetünk és általad szeretve is vagyunk. Mindig számíthatunk Rád. Érezd jól magad, maradj egészséges és elégedett, sikeres és boldog! Szeretünk és minden jót kívánunk Neked drága Bogyónk, Ági nevében is Apa' },
  { from: 'Zoli', text: 'Tesó! Nem gondoltam volna, hogy 43 éves koromra lesz egy igazi testvérem, mivel egyke vagyok, és fateromat sem igazán ismerem. Aztán lett egy szomszédom… vagy lehet, hogy én lettem az övé 🤪 De egy biztos: lett valaki az életemben, akire mindenben számíthatok. Még akkor is, ha épp „hullát kell elásni” 🤪🤪🤪 Kemény év van mögöttünk, de az elmúlt fél év valami egészen fantasztikus volt. A félelem és az aggódás helyét átvette a büszkeség, és a nyugalom, a tudat, hogy van kire számítanom ha netán a csaladomra kell vigyázni, vagy a kórházba kell vinni. Köszönöm. (Most én köszöngetek, mint egy buzi 😂) Tudom, néha paraszt vagyok, és túl egyenes. De ez csak azért van, mert őszintén törődöm veled. A magam kicsit „autista”, érzelmeket nehezen kimondó módján csak annyit mondok: itt vagyok. Bármi kell, bármikor, számíthatsz rám. Testvérem. Boldog születésnapot kívánok neked, és legyen még sok ilyen évünk együtt!' },
];

export function renderMinigame(container, room, onSuccess) {
  // Sliding puzzle: one empty slot, slide tiles into the gap
  const total = GRID_SIZE * GRID_SIZE;
  const emptyIndex = total - 1;
  // Generate solved state [0,1,2,...,8] then shuffle (keeping solvable)
  let tiles = Array.from({ length: total }, (_, i) => i);
  tiles = solvableShuffle(tiles, GRID_SIZE);

  container.innerHTML = `
    <h2 class="minigame-title">💌 Titkos Levelesláda</h2>
    <p class="minigame-instructions">Csúsztasd a darabokat a helyükre! Kattints egy szomszédos darabra az üres mező mellé.</p>
    <div id="puzzle-grid" style="
      display:grid; grid-template-columns:repeat(${GRID_SIZE}, 1fr); gap:3px;
      max-width:320px; margin:0 auto; aspect-ratio:1;
      background:rgba(255,255,255,0.03); border-radius:8px; padding:3px;
    "></div>
    <p id="move-count" style="text-align:center; color:rgba(255,255,255,0.3); font-size:0.75rem; margin-top:12px;">0 lépés</p>
  `;

  const gridEl = container.querySelector('#puzzle-grid');
  const moveCountEl = container.querySelector('#move-count');
  let moves = 0;

  function renderPuzzle() {
    gridEl.innerHTML = '';
    tiles.forEach((tileVal, pos) => {
      const el = document.createElement('div');
      const isEmpty = tileVal === emptyIndex;

      if (isEmpty) {
        el.style.cssText = `
          aspect-ratio:1; border-radius:6px;
          background:rgba(255,255,255,0.02);
        `;
      } else {
        const row = Math.floor(tileVal / GRID_SIZE);
        const col = tileVal % GRID_SIZE;
        const isCorrect = tileVal === pos;

        el.style.cssText = `
          aspect-ratio:1; border-radius:6px; cursor:pointer;
          background: url(${PUZZLE_IMAGE}) ${col * 50}% ${row * 50}% / 300%, rgba(255,255,255,0.06);
          border: 2px solid ${isCorrect ? room.color + '88' : 'rgba(255,255,255,0.1)'};
          display:flex; align-items:center; justify-content:center;
          transition: transform 0.15s ease, border-color 0.3s;
          position:relative;
        `;
        el.innerHTML = `<span style="
          font-size:0.9rem; font-weight:bold;
          color:${isCorrect ? room.color : 'rgba(255,255,255,0.25)'};
          text-shadow:0 1px 3px rgba(0,0,0,0.8);
          pointer-events:none;
        ">${tileVal + 1}</span>`;

        el.addEventListener('click', () => {
          if (canSlide(pos, tiles.indexOf(emptyIndex), GRID_SIZE)) {
            const emptyPos = tiles.indexOf(emptyIndex);
            [tiles[pos], tiles[emptyPos]] = [tiles[emptyPos], tiles[pos]];
            moves++;
            moveCountEl.textContent = `${moves} lépés`;
            renderPuzzle();

            if (tiles.every((t, i) => t === i)) {
              setTimeout(() => showSuccess(container, room, onSuccess, `Kiraktad ${moves} lépésből!`), 400);
            }
          } else {
            el.style.transform = 'scale(0.95)';
            setTimeout(() => el.style.transform = '', 150);
          }
        });

        el.addEventListener('mouseenter', () => {
          if (canSlide(pos, tiles.indexOf(emptyIndex), GRID_SIZE)) {
            el.style.borderColor = room.color;
            el.style.transform = 'scale(1.03)';
          }
        });
        el.addEventListener('mouseleave', () => {
          el.style.borderColor = isCorrect ? room.color + '88' : 'rgba(255,255,255,0.1)';
          el.style.transform = '';
        });
      }

      gridEl.appendChild(el);
    });
  }

  renderPuzzle();
  createHintSkip(container,
    ['A számoknak sorrendben kell állniuk (1-8), az üres hely jobbra lent', 'Először a felső sort rakd ki'],
    () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
  );
}

function canSlide(pos, emptyPos, size) {
  const rowP = Math.floor(pos / size), colP = pos % size;
  const rowE = Math.floor(emptyPos / size), colE = emptyPos % size;
  return (Math.abs(rowP - rowE) + Math.abs(colP - colE)) === 1;
}

function solvableShuffle(tiles, size) {
  // Fisher-Yates then check solvability
  let arr = [...tiles];
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr, size) || arr.every((t, i) => t === i)); // ensure shuffled AND solvable
  return arr;
}

function isSolvable(tiles, size) {
  let inversions = 0;
  const flat = tiles.filter(t => t !== size * size - 1);
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inversions++;
    }
  }
  if (size % 2 === 1) return inversions % 2 === 0;
  const emptyRow = Math.floor(tiles.indexOf(size * size - 1) / size);
  return (inversions + emptyRow) % 2 === 1;
}

export function renderContent(container, room) {
  container.innerHTML = `
    <a href="games/wordsearch/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🔤</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Betűvadász</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Bújócskázó szavak a rácsban — leld meg mind! →</p>
      </div>
    </a>
    <h2 class="content-title" style="color:${room.color}">💌 Titkos Levelesláda</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Üzenetek a családtól</p>
    ${MESSAGES.map(m => `
      <div class="content-card">
        <div style="font-size:0.75rem; color:${room.color}; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">${m.from}</div>
        <p style="font-size:1rem; line-height:1.6;">${m.text}</p>
      </div>
    `).join('')}
  `;
}
