import { showSuccess, createHintSkip, shuffle } from '../minigame-base.js';

// Placeholder — a user cseréli saját utazásokra
const TRIPS = [
  { year: 2019, place: 'Horvátország', lat: 43.5, lng: 16.4, story: 'A legjobb nyaralásunk!' },
  { year: 2020, place: 'Balaton',      lat: 46.8, lng: 17.7, story: 'Egész nyáron itt voltunk.' },
  { year: 2021, place: 'Bécs',         lat: 48.2, lng: 16.4, story: 'A Prater óriáskereke!' },
  { year: 2022, place: 'Olaszország',  lat: 41.9, lng: 12.5, story: 'Pizza és gelato mindenhol.' },
  { year: 2023, place: 'Prága',        lat: 50.1, lng: 14.4, story: 'Gyönyörű város volt.' },
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
    const options = shuffle([q.place, ...shuffle(TRIPS.map(t => t.place).filter(p => p !== q.place)).slice(0, 2)]);

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
      ['Gondolkodj... hol jártunk?'],
      () => showSuccess(container, room, onSuccess, 'Átugrottad — de a szoba a tiéd!')
    );
  }

  renderQuestion();
}

export function renderContent(container, room) {
  container.innerHTML = `
    <h2 class="content-title" style="color:${room.color}">🗺️ A Nagy Világjáró</h2>

    <a href="games/snake/index.html" style="display:block; text-decoration:none; margin-bottom:20px;">
      <div class="content-card" style="border-color:${room.color}; text-align:center; cursor:pointer;">
        <div style="font-size:3rem; margin-bottom:8px;">🐍</div>
        <h3 style="color:${room.color}; font-family:var(--font-display);">Szülinapi Kígyó</h3>
        <p style="color:rgba(255,255,255,0.5); font-size:0.85rem; margin-top:8px;">Gyűjtsd össze a szülinapi csemegéket! →</p>
      </div>
    </a>

    <p style="text-align:center; color:rgba(255,255,255,0.6); margin-bottom:16px;">Közös utazásaink térképe — kattints a térképre új hely hozzáadásához!</p>
    <div id="travel-map" style="height:400px; border-radius:12px; border:2px solid rgba(255,255,255,0.1); margin-bottom:16px;"></div>
    <div id="trip-list"></div>
  `;

  // Load saved trips
  const savedTrips = JSON.parse(localStorage.getItem('apu-bday-trips') || '[]');
  const allTrips = [...TRIPS, ...savedTrips];

  setTimeout(() => {
    const map = L.map('travel-map').setView([47, 15], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    function addMarker(trip) {
      L.marker([trip.lat, trip.lng]).addTo(map)
        .bindPopup('<strong>' + trip.place + '</strong><br><em>' + trip.story + '</em>');
    }

    allTrips.forEach(addMarker);

    // Click to add new trip
    map.on('click', (e) => {
      const place = prompt('Hely neve:');
      if (!place) return;
      const story = prompt('Rövid sztori / emlék:') || '';
      const newTrip = { place, lat: e.latlng.lat, lng: e.latlng.lng, story };
      savedTrips.push(newTrip);
      localStorage.setItem('apu-bday-trips', JSON.stringify(savedTrips));
      addMarker(newTrip);
      renderTripList();
    });

    function renderTripList() {
      const listEl = container.querySelector('#trip-list');
      const all = [...TRIPS, ...savedTrips];
      listEl.innerHTML = all.map(t => `
        <div class="content-card" style="display:flex; gap:12px; align-items:center;">
          <div style="font-size:1.2rem;">📍</div>
          <div>
            <strong>${t.place}</strong>
            ${t.story ? '<p style="font-size:0.8rem; color:rgba(255,255,255,0.5); margin-top:2px;">' + t.story + '</p>' : ''}
          </div>
        </div>
      `).join('');
    }

    renderTripList();
  }, 100);
}
