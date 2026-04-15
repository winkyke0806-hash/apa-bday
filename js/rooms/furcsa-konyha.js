import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const INGREDIENTS = ['Csoki', 'Paprika', 'Sajt', 'Banán', 'Mogyoró', 'Méz', 'Citrom', 'Avokádó', 'Kókusz', 'Fahéj', 'Bacon', 'Nutella', 'Uborka', 'Görögdinnye', 'Wasabi'];
const ADJECTIVES = ['Ropogós', 'Krémes', 'Tüzes', 'Selymes', 'Habos', 'Szaftos', 'Füstölt', 'Jeges', 'Robbanós', 'Titkos'];
const DISH_TYPES = ['Torta', 'Leves', 'Szendvics', 'Smoothie', 'Muffin', 'Pite', 'Tekercs', 'Parfé', 'Ragu', 'Bomba'];

const RECIPES = [
  {
    name: 'Csokis-Chilis Lávasütemény',
    ingredients: ['200g étcsoki (min. 70%)', '1 tk chipotle chili pehely', '120g vaj', '100g cukor', '2 tojás', '30g liszt'],
    steps: '1. Olvaszd fel a csokit a vajjal vízgőz felett. 2. Keverd hozzá a cukrot és a chilit. 3. Üsd bele a tojásokat egyenként. 4. Szitáld hozzá a lisztet, óvatosan keverd. 5. Öntsd vajazott szilikon formákba. 6. Süsd 200°C-on 10-12 percig — a közepe FOLYÓS maradjon!',
    funFact: 'Az aztékok találták ki a csoki+chili kombót, több ezer éve isszák!'
  },
  {
    name: 'Sajtos-Körtés Melegszendvics Mézzel',
    ingredients: ['2 szelet kovászos kenyér', '60g gorgonzola vagy rokfort', '1 érett körte (vékony szeletekre)', '1 marék dió', '1 ek méz', 'vaj a sütéshez'],
    steps: '1. Vajazd meg a kenyerek külső felét. 2. Belülre rakd a sajtot, körteszeleteket és diót. 3. Csurgatj rá egy kis mézet. 4. Süsd serpenyőben fedő alatt 3-4 perc/oldal, amíg a sajt megolvad. 5. Vágd félbe átlósan — húzós sajtszálak garantáltak!',
    funFact: 'Olaszországban a "pere e formaggio" (körte és sajt) klasszikus párosítás — közmondás is van róla!'
  },
  {
    name: 'Avokádós Csoki Mousse',
    ingredients: ['2 érett avokádó', '50g kakaópor', '80ml juharszirup vagy méz', '60ml kókusztej', '1 tk vanília kivonat', 'csipet só'],
    steps: '1. Turmixold simára az avokádót. 2. Add hozzá a kakaóport, édesítőt, kókusztejet, vaníliát és sót. 3. Turmixold teljesen krémesre (2-3 perc). 4. Hűtsd legalább 1 órát. 5. Tálald kakaóporral szórva és friss málnával.',
    funFact: 'Tényleg NEM érzed az avokádó ízét! Csak krémes csoki. Vegánoknál világszerte top desszert.'
  },
  {
    name: 'Bacon-Lekváros Szendvics',
    ingredients: ['4 szelet ropogós bacon', '2 szelet pirítós', '2 ek epres vagy málnás lekvár', '1 szelet cheddar sajt (opcionális)'],
    steps: '1. Süsd ropogósra a bacont. 2. Pirítsd meg a kenyeret. 3. Kend meg bőségesen lekvárral. 4. Rakd rá a ropogós bacont (és a sajtot ha kéred). 5. Csukd össze és harapj bele bátran!',
    funFact: 'Ez Elvis Presley kedvenc szendvicse volt (ő mogyoróvajjal is ette)! Az USA-ban "The Elvis" néven fut.'
  },
  {
    name: 'Görögdinnyés-Fetás Saláta Mentával',
    ingredients: ['500g görögdinnye kockákra vágva', '150g feta sajt', '1 marék friss menta', '2 ek extra szűz olívaolaj', 'frissen őrölt fekete bors'],
    steps: '1. Kockázd fel a dinnyét. 2. Morzsold rá a fetát. 3. Tépkedd rá a mentát. 4. Locsold meg az olívaolajjal. 5. Borsozd meg bőven. 6. Azonnal fogyaszd — hidegen a legjobb!',
    funFact: 'Görögországban és Törökországban ez hétköznapi nyári étel — az édes-sós kombó nyáron mennyei!'
  },
  {
    name: 'Wasabis Fehércsokis Trüffel',
    ingredients: ['200g fehér csoki', '80ml tejszín', '1-2 tk wasabi paszta (ízlés szerint)', 'kakaópor a forgatáshoz'],
    steps: '1. Forrald fel a tejszínt. 2. Öntsd az apróra tört fehér csokira, keverd simára. 3. Adj hozzá wasabit — óvatosan, kóstolgatva! 4. Hűtsd 3 órát. 5. Formázz kis golyókat, forgasd kakaóporban.',
    funFact: 'Japánban a wasabi csoki prémium ajándék — a KitKat wasabi ízű verziója az egyik legkelendőbb!'
  },
];

export function renderMinigame(container, room, onSuccess) {
  let mixCount = 0;
  const targetMixes = 3;

  function renderMixer() {
    if (mixCount >= targetMixes) {
      showSuccess(container, room, onSuccess, 'Mesterkukta lettél!');
      return;
    }

    const ing1 = shuffle(INGREDIENTS)[0];
    const ing2 = shuffle(INGREDIENTS.filter(i => i !== ing1))[0];
    const adj = shuffle(ADJECTIVES)[0];
    const dish = shuffle(DISH_TYPES)[0];
    const dishName = `${adj} ${ing1}-${ing2} ${dish}`;

    container.innerHTML = `
      <h2 class="minigame-title">🍳 A Furcsa Konyha</h2>
      <p class="minigame-instructions">${mixCount + 1}/${targetMixes} — Keverd össze a hozzávalókat!</p>
      <div style="text-align:center;">
        <div style="display:flex; justify-content:center; gap:12px; align-items:center; margin:20px 0;">
          <div style="font-size:1.2rem; padding:14px 18px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; transition:all 0.3s;" id="ing1">${ing1}</div>
          <div style="font-size:1.8rem; color:${room.color}; animation:pulse 1.5s ease-in-out infinite;">+</div>
          <div style="font-size:1.2rem; padding:14px 18px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; transition:all 0.3s;" id="ing2">${ing2}</div>
        </div>
        <button class="minigame-btn" id="mix-btn" style="font-size:1.1rem; padding:14px 32px;">🥄 Összekeverem!</button>
        <div id="result" style="margin-top:24px; display:none;">
          <div style="font-size:1.3rem; color:${room.color}; font-weight:bold; font-family:var(--font-display);">
            ✨ ${dishName} ✨
          </div>
          <div style="margin-top:12px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px dashed rgba(255,255,255,0.1);">
            <span style="font-size:2rem;">${getRandomEmoji()}</span>
            <p style="color:rgba(255,255,255,0.5); font-size:0.8rem; margin-top:6px; font-style:italic;">"${getRandomReview()}"</p>
          </div>
          <button class="minigame-btn" id="next-mix" style="margin-top:16px;">Következő keverés →</button>
        </div>
      </div>
    `;

    const mixBtn = container.querySelector('#mix-btn');
    const ing1El = container.querySelector('#ing1');
    const ing2El = container.querySelector('#ing2');

    mixBtn.addEventListener('click', () => {
      // Összekeverés animáció
      mixBtn.style.display = 'none';
      ing1El.style.transform = 'translateX(30px) rotate(10deg)';
      ing2El.style.transform = 'translateX(-30px) rotate(-10deg)';
      ing1El.style.borderColor = room.color;
      ing2El.style.borderColor = room.color;

      setTimeout(() => {
        ing1El.style.transform = 'translateX(0) scale(0.8) rotate(5deg)';
        ing2El.style.transform = 'translateX(0) scale(0.8) rotate(-5deg)';
        ing1El.style.opacity = '0.5';
        ing2El.style.opacity = '0.5';
      }, 300);

      setTimeout(() => {
        const result = container.querySelector('#result');
        result.style.display = 'block';
        result.classList.add('fade-in');
      }, 600);
    });

    container.querySelector('#next-mix').addEventListener('click', () => {
      mixCount++;
      renderMixer();
    });

    createHintSkip(container, ['Csak kevergess!'],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderMixer();
}

function getRandomEmoji() {
  return shuffle(['👨‍🍳', '🤯', '😋', '🤤', '👀', '🫣', '😂'])[0];
}

function getRandomReview() {
  return shuffle([
    'Furcsa, de... kérek még!',
    'Nem gondoltam volna, de zseniális!',
    'A Michelin-csillag ide nézz!',
    'Apu biztos imádná!',
    'Ez vagy isteni, vagy katasztrófa. Csak egy mód van kideríteni!',
    'Gasztronómiai forradalom!',
  ])[0];
}

export function renderContent(container, room) {
  container.innerHTML = `
    <a href="games/cooking/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🍳</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Reakció Konyha</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Nyomj pont időben — reakcióidő teszt! →</p>
      </div>
    </a>
    <h2 class="content-title" style="color:${room.color}">🍳 A Furcsa Konyha</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">
      Furcsán hangzó, de tényleg létező és finom receptek!<br>
      <span style="font-size:0.75rem; opacity:0.6;">Próbáljátok ki közösen! 👨‍🍳</span>
    </p>
    ${RECIPES.map(r => `
      <div class="content-card" style="border-left:3px solid ${room.color};">
        <h3 style="color:${room.color}; margin-bottom:10px; font-family:var(--font-display);">${r.name}</h3>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.7rem; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Hozzávalók</div>
          <ul style="list-style:none; padding:0;">
            ${r.ingredients.map(i => `<li style="font-size:0.85rem; color:rgba(255,255,255,0.7); padding:2px 0;">• ${i}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.7rem; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Elkészítés</div>
          <p style="font-size:0.85rem; line-height:1.7; color:rgba(255,255,255,0.7);">${r.steps}</p>
        </div>
        <div style="background:rgba(${room.color === '#48bb78' ? '72,187,120' : '255,255,255'},0.06); border-radius:8px; padding:10px 14px; font-size:0.8rem;">
          <span style="color:${room.color};">💡 Tudtad?</span>
          <span style="color:rgba(255,255,255,0.6);"> ${r.funFact}</span>
        </div>
      </div>
    `).join('')}
  `;
}
