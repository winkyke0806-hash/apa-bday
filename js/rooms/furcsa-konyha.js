import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const INGREDIENTS = ['Csoki', 'Paprika', 'Sajt', 'Banán', 'Mogyoró', 'Méz', 'Citrom', 'Avokádó', 'Kókusz', 'Fahéj'];
const ADJECTIVES = ['Ropogós', 'Krémes', 'Tüzes', 'Csípős', 'Selymes', 'Habos', 'Szaftos', 'Füstölt'];
const DISH_TYPES = ['Torta', 'Leves', 'Szendvics', 'Ragu', 'Smoothie', 'Muffin', 'Pite', 'Tekercs'];

const RECIPES = [
  { name: 'Csokis-Chilis Lávasütemény', ingredients: ['Étcsoki', 'Chili pehely', 'Vaj', 'Cukor', 'Tojás'], description: 'Furcsán hangzik, de a csoki és a chili tökéletes páros! A láva sütemény belseje folyós marad.' },
  { name: 'Sajtos-Körtés Melegszendvics', ingredients: ['Kéksajt', 'Körte', 'Dió', 'Méz', 'Kenyér'], description: 'Az édes körte és a sós sajt mennyei kombináció. A dió adja a ropogósat!' },
  { name: 'Avokádós Csoki Mousse', ingredients: ['Avokádó', 'Kakaó', 'Méz', 'Kókusztej', 'Vanília'], description: 'Az avokádó krémes állagot ad és nem érzed az ízét. Csak csoki és boldogság!' },
  { name: 'Sütőtökös-Fahéjas Latte', ingredients: ['Sütőtök püré', 'Fahéj', 'Tej', 'Kávé', 'Juharszirup'], description: 'Őszi klasszikus ami furcsán hangzik de világhódító lett.' },
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

    container.innerHTML = `
      <h2 class="minigame-title">🍳 A Furcsa Konyha</h2>
      <p class="minigame-instructions">${mixCount + 1}/${targetMixes} — Keverd össze a hozzávalókat!</p>
      <div style="text-align:center;">
        <div style="display:flex; justify-content:center; gap:16px; align-items:center; margin:20px 0;">
          <div style="font-size:1.4rem; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px;">${ing1}</div>
          <div style="font-size:2rem;">+</div>
          <div style="font-size:1.4rem; padding:16px; background:rgba(255,255,255,0.05); border-radius:12px;">${ing2}</div>
        </div>
        <button class="minigame-btn" id="mix-btn" style="font-size:1.2rem;">🥄 Összekeverem!</button>
        <div id="result" style="margin-top:20px; display:none;">
          <div style="font-size:1.2rem; color:${room.color}; font-weight:bold;">✨ ${adj} ${ing1}-${ing2} ${dish} ✨</div>
          <p style="color:rgba(255,255,255,0.4); margin-top:8px; font-size:0.85rem;">Hangzik furcsán? Biztos finom!</p>
          <button class="minigame-btn" id="next-mix" style="margin-top:12px;">Következő keverés →</button>
        </div>
      </div>
    `;

    container.querySelector('#mix-btn').addEventListener('click', () => {
      container.querySelector('#mix-btn').style.display = 'none';
      const result = container.querySelector('#result');
      result.style.display = 'block';
      result.classList.add('fade-in');
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

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🍳 A Furcsa Konyha</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Furcsán hangzó, de isteni receptek</p>
    ${RECIPES.map(r => `
      <div class="content-card">
        <h3 style="color:${room.color}; margin-bottom:8px;">${r.name}</h3>
        <div style="font-size:0.8rem; color:rgba(255,255,255,0.4); margin-bottom:8px;">Hozzávalók: ${r.ingredients.join(', ')}</div>
        <p style="line-height:1.6;">${r.description}</p>
      </div>
    `).join('')}
  `;
}
