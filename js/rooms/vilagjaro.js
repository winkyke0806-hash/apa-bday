import { showSuccess } from '../minigame-base.js';

// Üres — apukád maga adja hozzá a közös utazásokat a térképen
const TRIPS = [];

export function renderMinigame(container, room, onSuccess) {
  // Egyszerű "fedezd fel" minigame — 5 random helyre kell kattintani
  let found = 0;
  const target = 5;
  const flags = ['🇭🇺','🇭🇷','🇦🇹','🇮🇹','🇨🇿','🇩🇪','🇬🇷','🇪🇸','🇫🇷','🇬🇧'];

  container.innerHTML = `
    <h2 class="minigame-title">🗺️ A Nagy Világjáró</h2>
    <p class="minigame-instructions">Találd meg az ${target} rejtett zászlót! Kattints rájuk!</p>
    <div id="flag-area" style="position:relative; width:100%; max-width:500px; height:350px; margin:0 auto; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:12px; overflow:hidden;"></div>
    <p style="text-align:center; margin-top:8px; color:rgba(255,255,255,0.4); font-size:0.75rem;"><span id="found-count">0</span> / ${target} megtalálva</p>
  `;

  const area = container.querySelector('#flag-area');

  for (let i = 0; i < target; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute; font-size:1.8rem; cursor:pointer; transition:all 0.3s; user-select:none;`;
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (10 + Math.random() * 75) + '%';
    el.textContent = flags[Math.floor(Math.random() * flags.length)];
    el.addEventListener('click', () => {
      if (el.dataset.found) return;
      el.dataset.found = 'true';
      el.style.transform = 'scale(1.5)';
      el.style.filter = 'brightness(1.5)';
      found++;
      container.querySelector('#found-count').textContent = found;
      if (found >= target) {
        setTimeout(() => showSuccess(container, room, onSuccess, 'Minden zászlót megtaláltál!'), 500);
      }
    });
    area.appendChild(el);
  }
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
