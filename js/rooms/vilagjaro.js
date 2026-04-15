import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

const TRIPS = [
  { year: 2019, place: 'Horvátország', lat: 43.5, lng: 16.4, photo: 'assets/photos/trip1.jpg', story: 'A legjobb nyaralásunk!' },
  { year: 2020, place: 'Balaton',      lat: 46.8, lng: 17.7, photo: 'assets/photos/trip2.jpg', story: 'Egész nyáron itt voltunk.' },
  { year: 2021, place: 'Bécs',         lat: 48.2, lng: 16.4, photo: 'assets/photos/trip3.jpg', story: 'A Prater óriáskereke!' },
  { year: 2022, place: 'Olaszország',  lat: 41.9, lng: 12.5, photo: 'assets/photos/trip4.jpg', story: 'Pizza és gelato mindenhol.' },
  { year: 2023, place: 'Prága',        lat: 50.1, lng: 14.4, photo: 'assets/photos/trip5.jpg', story: 'Gyönyörű város volt.' },
];

export function renderMinigame(container, room, onSuccess) {
  const questions = shuffle(TRIPS).slice(0, 3);
  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      showSuccess(container, room, onSuccess, `${score}/${questions.length} helyes — Szoba feloldva!`);
      return;
    }

    const q = questions[currentQ];
    const options = shuffle([q.place, ...getDecoys(q.place)]);

    container.innerHTML = `
      <h2 class="minigame-title">🗺️ A Nagy Világjáró</h2>
      <p class="minigame-instructions">${currentQ + 1}/${questions.length} — Hol voltunk ${q.year}-ben?</p>
      <div id="options" style="display:flex; flex-direction:column; gap:10px; max-width:400px; margin:0 auto;"></div>
    `;

    const optionsEl = container.querySelector('#options');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'minigame-btn minigame-btn--secondary';
      btn.style.width = '100%';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (opt === q.place) {
          score++;
          btn.style.background = 'rgba(104, 211, 145, 0.3)';
          btn.style.borderColor = '#68d391';
        } else {
          btn.style.background = 'rgba(252, 129, 129, 0.3)';
          btn.style.borderColor = '#fc8181';
          hintSkip.recordAttempt();
        }
        setTimeout(() => { currentQ++; renderQuestion(); }, 800);
      });
      optionsEl.appendChild(btn);
    });

    const hintSkip = createHintSkip(container,
      [`${q.year}-ben valahol ${q.place.charAt(0)}...-ban voltunk`],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderQuestion();
}

function getDecoys(correct) {
  return shuffle(TRIPS.map(t => t.place).filter(p => p !== correct)).slice(0, 2);
}

export function renderContent(container, room) {
  container.innerHTML = `
    <a href="games/geoguesser/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🗺️</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Utazó Nyomozó</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Felismered a közös kalandjaink helyszíneit? →</p>
      </div>
    </a>
    <h2 class="content-title" style="color:${room.color}">🗺️ A Nagy Világjáró</h2>
    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:24px;">Közös utazásaink térképe</p>
    <div id="travel-map" style="height:400px; border-radius:12px; border:2px solid rgba(255,255,255,0.1); margin-bottom:24px;"></div>
    <div id="trip-list"></div>
  `;

  setTimeout(() => {
    const map = L.map('travel-map').setView([47, 15], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    TRIPS.forEach(trip => {
      L.marker([trip.lat, trip.lng]).addTo(map)
        .bindPopup(`<strong>${trip.place} (${trip.year})</strong><br><em>${trip.story}</em>`);
    });
  }, 100);

  const listEl = container.querySelector('#trip-list');
  [...TRIPS].sort((a, b) => a.year - b.year).forEach(trip => {
    listEl.innerHTML += `
      <div class="content-card" style="display:flex; gap:16px; align-items:center;">
        <div style="font-size:1.4rem; font-weight:bold; color:${room.color};">${trip.year}</div>
        <div>
          <strong>${trip.place}</strong>
          <p style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:4px;">${trip.story}</p>
        </div>
      </div>
    `;
  });
}
