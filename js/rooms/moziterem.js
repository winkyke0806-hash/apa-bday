import { showSuccess, createHintSkip } from '../minigame-base.js';

const STEPS = [
  { instruction: 'Törd fel a tojásokat!', emoji: '🥚', target: 3, verb: 'Koppants' },
  { instruction: 'Szórd bele a lisztet!', emoji: '🌾', target: 5, verb: 'Szórj' },
  { instruction: 'Öntsd hozzá a tejet!', emoji: '🥛', target: 3, verb: 'Önts' },
  { instruction: 'Keverd össze alaposan!', emoji: '🥄', target: 8, verb: 'Keverj' },
  { instruction: 'Tedd a sütőbe!', emoji: '🔥', target: 1, verb: 'Nyomj' },
  { instruction: 'Díszítsd a tortát!', emoji: '🎂', target: 6, verb: 'Díszíts' },
];

const MOVIES = [
  {
    title: 'A remény rabjai',
    original: 'The Shawshank Redemption',
    year: 1994,
    genre: 'Dráma',
    rating: '9.3',
    director: 'Frank Darabont',
    description: 'Andy Dufresne-t, egy fiatal bankárt ártatlanul életfogytiglanra ítélik felesége meggyilkolásáért. A börtönben barátságot köt a hosszútávú elítélt Reddel, és lassan saját szabadulását tervezi. A remény és a türelem filmje.',
    imdb: 'https://www.imdb.com/title/tt0111161/',
    emoji: '🎭',
  },
  {
    title: 'A keresztapa',
    original: 'The Godfather',
    year: 1972,
    genre: 'Bűnügyi dráma',
    rating: '9.2',
    director: 'Francis Ford Coppola',
    description: 'Don Vito Corleone, a befolyásos maffiafőnök hatalmát legkisebb fia, Michael veszi át. A Corleone család fel- és leszállásának legendás története — a műfaj egyik legnagyobb klasszikusa.',
    imdb: 'https://www.imdb.com/title/tt0068646/',
    emoji: '🎩',
  },
  {
    title: 'Forrest Gump',
    original: 'Forrest Gump',
    year: 1994,
    genre: 'Dráma / Romantikus',
    rating: '8.8',
    director: 'Robert Zemeckis',
    description: 'Egy egyszerű, jószívű férfi véletlenül részese lesz a 20. század legfontosabb amerikai eseményeinek. Közben egész életében egyetlen nőt szeret. Tom Hanks egyik legnagyobb alakítása.',
    imdb: 'https://www.imdb.com/title/tt0109830/',
    emoji: '🏃',
  },
  {
    title: 'Eredet',
    original: 'Inception',
    year: 2010,
    genre: 'Sci-fi / Thriller',
    rating: '8.8',
    director: 'Christopher Nolan',
    description: 'Dom Cobb ipari kém, aki mások álmaiból lop titkokat. Most egy lehetetlen küldetést kap: nem lopnia kell, hanem egy gondolatot ÜLTETNIE. Agytekerő film, ami minden nézéssel jobb lesz.',
    imdb: 'https://www.imdb.com/title/tt1375666/',
    emoji: '🌀',
  },
  {
    title: 'Csillagok között',
    original: 'Interstellar',
    year: 2014,
    genre: 'Sci-fi',
    rating: '8.7',
    director: 'Christopher Nolan',
    description: 'A Föld haldoklik. Egy csapat űrhajós a galaxis túloldalára utazik egy féregjáraton át, hogy új otthont találjon az emberiségnek. Látvány, érzelem és tudomány egyben.',
    imdb: 'https://www.imdb.com/title/tt0816692/',
    emoji: '🚀',
  },
  {
    title: 'A sötét lovag',
    original: 'The Dark Knight',
    year: 2008,
    genre: 'Akció / Thriller',
    rating: '9.0',
    director: 'Christopher Nolan',
    description: 'Batman szembekerül minden idők legkáoszosabb ellenfelével: a Jokerrel. Heath Ledger Oscar-díjas alakítása minden szupi­hősfilmet újradefiniált.',
    imdb: 'https://www.imdb.com/title/tt0468569/',
    emoji: '🦇',
  },
  {
    title: 'Gladiátor',
    original: 'Gladiator',
    year: 2000,
    genre: 'Történelmi / Akció',
    rating: '8.5',
    director: 'Ridley Scott',
    description: 'Maximus, a római hadvezér családját lemészárolják, őt pedig rabszolgának adják. Gladiátorként tér vissza, hogy bosszút álljon a császáron. "Amit most teszünk, a halálon túl is visszhangzik."',
    imdb: 'https://www.imdb.com/title/tt0172495/',
    emoji: '⚔️',
  },
  {
    title: 'Vissza a jövőbe',
    original: 'Back to the Future',
    year: 1985,
    genre: 'Sci-fi / Komédia',
    rating: '8.5',
    director: 'Robert Zemeckis',
    description: 'Marty McFly véletlenül visszautazik 1955-be egy őrült tudós időgépével, és nehogy összefusson saját szüleivel — mert ha igen, soha nem fog megszületni. Örök klasszikus.',
    imdb: 'https://www.imdb.com/title/tt0088763/',
    emoji: '🚗',
  },
  {
    title: 'Nagymenők',
    original: 'Goodfellas',
    year: 1990,
    genre: 'Bűnügyi dráma',
    rating: '8.7',
    director: 'Martin Scorsese',
    description: '"Amióta az eszemet tudom, maffiózó akartam lenni." Egy fiú története, aki a new york-i alvilág legmélyére kerül. Scorsese csúcsformában.',
    imdb: 'https://www.imdb.com/title/tt0099685/',
    emoji: '💼',
  },
  {
    title: 'A zöld mérföld',
    original: 'The Green Mile',
    year: 1999,
    genre: 'Dráma / Fantasy',
    rating: '8.6',
    director: 'Frank Darabont',
    description: 'Egy siralomházi börtönőr egy különös képességű, óriási termetű fekete rab életébe csöppen. Tom Hanks és Michael Clarke Duncan felejthetetlenek.',
    imdb: 'https://www.imdb.com/title/tt0120689/',
    emoji: '💚',
  },
  {
    title: 'Ryan közlegény megmentése',
    original: 'Saving Private Ryan',
    year: 1998,
    genre: 'Háborús / Dráma',
    rating: '8.6',
    director: 'Steven Spielberg',
    description: 'A normandiai partraszállás után egy katonai egységet küldenek a front mögé, hogy megtalálják az utolsó életben lévő Ryan testvért. Az első 20 perc a filmtörténet egyik legmegrázóbb jelenete.',
    imdb: 'https://www.imdb.com/title/tt0120815/',
    emoji: '🪖',
  },
  {
    title: 'Ponyvaregény',
    original: 'Pulp Fiction',
    year: 1994,
    genre: 'Bűnügyi / Fekete komédia',
    rating: '8.9',
    director: 'Quentin Tarantino',
    description: 'Két bérgyilkos, egy boxoló, egy maffiafőnök felesége és két bankrabló sorsa fonódik össze egy furcsa, időrendjében összekevert történetben. Tarantino stílusdefiniáló remeke.',
    imdb: 'https://www.imdb.com/title/tt0110912/',
    emoji: '🍔',
  },
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
    { w: 100, h: 14, bg: '#f5e6c8', label: 'tészta' },
    { w: 90, h: 10, bg: '#e8d5a3', label: 'kevert' },
    { w: 85, h: 12, bg: '#d4a574', label: 'sült' },
    { w: 95, h: 8, bg: '#f687b3', label: 'díszített' },
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
    <a href="games/catch/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🎁</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Ajándék Eső</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Csepereg az ég — fogd el a kincseket! →</p>
      </div>
    </a>

    <h2 class="content-title" style="color:${room.color}">🎬 Moziterem</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.55); margin-bottom:8px; font-size:1rem;">
      Filmek, ha kifogynánk az ötletekből 🍿
    </p>
    <p style="text-align:center; color:rgba(255,255,255,0.35); margin-bottom:24px; font-size:0.8rem; font-style:italic;">
      ${MOVIES.length} klasszikus — mindegyik kötelező darab
    </p>

    <div id="movie-list" style="display:flex; flex-direction:column; gap:14px; max-width:560px; margin:0 auto;">
      ${MOVIES.map((m, i) => `
        <div class="movie-card" style="
          background:linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border:1px solid rgba(255,255,255,0.08); border-left:3px solid ${room.color};
          border-radius:12px; padding:16px 18px; transition:all 0.3s;
        ">
          <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
            <div style="
              font-size:2rem; width:48px; height:48px; flex-shrink:0;
              background:${room.color}15; border:1px solid ${room.color}33;
              border-radius:10px; display:flex; align-items:center; justify-content:center;
            ">${m.emoji}</div>
            <div style="flex:1; min-width:0;">
              <h3 style="
                color:${room.color}; font-family:var(--font-display);
                font-size:1.15rem; margin:0; line-height:1.2;
              ">${m.title}</h3>
              <p style="
                color:rgba(255,255,255,0.4); font-size:0.75rem;
                margin:2px 0 0; font-style:italic;
              ">${m.original} (${m.year})</p>
            </div>
            <div style="
              flex-shrink:0; background:rgba(246,173,85,0.15); color:#f6ad55;
              padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold;
              border:1px solid rgba(246,173,85,0.3);
            ">⭐ ${m.rating}</div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
            <span style="
              font-size:0.65rem; padding:3px 8px; border-radius:10px;
              background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6);
              border:1px solid rgba(255,255,255,0.08); letter-spacing:0.5px;
            ">${m.genre}</span>
            <span style="
              font-size:0.65rem; padding:3px 8px; border-radius:10px;
              background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6);
              border:1px solid rgba(255,255,255,0.08); letter-spacing:0.5px;
            ">🎬 ${m.director}</span>
          </div>

          <p style="
            color:rgba(255,255,255,0.7); font-size:0.88rem; line-height:1.55;
            margin:0 0 12px;
          ">${m.description}</p>

          <a href="${m.imdb}" target="_blank" rel="noopener" style="
            display:inline-block; text-decoration:none; font-size:0.75rem;
            padding:6px 14px; border-radius:20px; font-weight:bold;
            background:#f5c518; color:#000; letter-spacing:0.5px;
            transition:all 0.2s;
          " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
            IMDb →
          </a>
        </div>
      `).join('')}
    </div>
  `;
}
