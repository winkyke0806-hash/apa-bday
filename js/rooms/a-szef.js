export function renderMinigame() {
  // A Széf nem rendelkezik minijátékkal — automatikusan nyílik
}

export function renderContent(container, room) {
  // Phase 1: Dramatic dark opening
  container.innerHTML = `<div id="szef-stage" style="text-align:center; min-height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>`;
  const stage = container.querySelector('#szef-stage');

  runFinale(stage, container, room);
}

async function runFinale(stage, container, room) {
  // === ACT 1: Vault opening ===
  stage.innerHTML = `
    <div style="font-size:6rem; animation:pulse 1.5s ease-in-out infinite;" id="vault-icon">🔐</div>
    <p style="color:rgba(255,255,255,0.4); font-size:0.8rem; margin-top:16px; letter-spacing:3px;">A SZÉF NYÍLIK...</p>
  `;

  await wait(2000);

  // Vault "opens" — icon transition
  const vaultIcon = stage.querySelector('#vault-icon');
  vaultIcon.style.transition = 'all 0.8s cubic-bezier(0.4,0,0.2,1)';
  vaultIcon.style.transform = 'scale(1.5) rotate(10deg)';
  vaultIcon.style.filter = 'brightness(2)';

  await wait(800);
  vaultIcon.textContent = '🔓';
  vaultIcon.style.transform = 'scale(2) rotate(-5deg)';

  await wait(600);
  vaultIcon.style.transform = 'scale(1)';
  vaultIcon.style.filter = 'brightness(1)';

  await wait(1000);

  // Flash transition
  stage.style.transition = 'opacity 0.5s';
  stage.style.opacity = '0';
  await wait(500);

  // === ACT 2: Confetti burst + main message ===
  launchBigConfetti();

  stage.style.opacity = '1';
  stage.innerHTML = `
    <div style="padding:20px; max-width:560px;">

      <!-- Birthday cake animation -->
      <div style="font-size:5rem; margin-bottom:8px; animation:gentleBounce 2s ease-in-out infinite;">🎂</div>

      <!-- Title — typewriter style -->
      <h1 id="szef-title" style="
        font-family:'Playfair Display',Georgia,serif; font-weight:700;
        font-size:clamp(2rem,7vw,3.5rem); color:#f6ad55;
        text-shadow:0 0 40px rgba(246,173,85,0.3), 0 0 80px rgba(246,173,85,0.1);
        margin-bottom:24px; min-height:1.2em;
      "></h1>

      <!-- Personal letter -->
      <div id="szef-letter" style="
        background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
        border-radius:16px; padding:28px 24px; margin-bottom:28px;
        text-align:left; opacity:0; transition:opacity 0.8s;
      ">
        <p style="color:rgba(255,255,255,0.8); font-size:1rem; line-height:2; font-family:'Playfair Display',Georgia,serif;">
          Kedves Apu,<br><br>
          Ez a ház neked készült, minden szobájával, minden meglepetésével.<br><br>
          Köszönöm, hogy mindig mellettem állsz. Hogy megtanítottál türelmesnek lenni,
          hogy együtt építettünk LEGO-ból, gokartoztunk, szabadulószobáztunk,
          és annyi helyre elvittél minket.<br><br>
          Te vagy a legjobb Apu a világon. ❤️<br><br>
          <span style="color:rgba(255,255,255,0.5); font-style:italic;">Nagyon szeretlek!</span>
        </p>
      </div>

      <!-- Stats card -->
      <div id="szef-stats" style="
        background:rgba(246,173,85,0.06); border:2px solid rgba(246,173,85,0.2);
        border-radius:16px; padding:24px; margin-bottom:24px;
        opacity:0; transition:opacity 0.8s 0.3s;
      ">
        <h3 style="color:#f6ad55; margin-bottom:16px; font-family:'Playfair Display',serif; text-align:center;">
          📊 Kaland Összesítő
        </h3>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px; text-align:center;">
          <div>
            <div style="font-size:2rem;" id="stat-rooms">0</div>
            <div style="font-size:0.65rem; color:rgba(255,255,255,0.4); margin-top:4px; letter-spacing:1px;">SZOBA</div>
          </div>
          <div>
            <div style="font-size:2rem;" id="stat-games">0</div>
            <div style="font-size:0.65rem; color:rgba(255,255,255,0.4); margin-top:4px; letter-spacing:1px;">MINIJÁTÉK</div>
          </div>
          <div>
            <div style="font-size:2rem;">🏆</div>
            <div style="font-size:0.65rem; color:rgba(255,255,255,0.4); margin-top:4px; letter-spacing:1px;">MESTER</div>
          </div>
        </div>
      </div>

      <!-- Room badges -->
      <div id="szef-badges" style="
        display:flex; flex-wrap:wrap; justify-content:center; gap:8px;
        margin-bottom:28px; opacity:0; transition:opacity 0.8s 0.5s;
      ">
      </div>

      <!-- Footer -->
      <p id="szef-footer" style="
        color:rgba(255,255,255,0.25); font-size:0.75rem;
        letter-spacing:2px; opacity:0; transition:opacity 0.8s 0.7s;
      ">
        SZERETETTEL KÉSZÍTETTEM NEKED 💛
      </p>
    </div>
  `;

  // Typewriter title
  await wait(300);
  await typewriter(stage.querySelector('#szef-title'), 'Boldog Szülinapot, Apu!', 80);

  // Show letter
  await wait(500);
  stage.querySelector('#szef-letter').style.opacity = '1';

  // Show stats with counting animation
  await wait(800);
  stage.querySelector('#szef-stats').style.opacity = '1';
  countUp(stage.querySelector('#stat-rooms'), 11, '🚪', 1500);
  countUp(stage.querySelector('#stat-games'), 11, '🎮', 1500);

  // Show room badges
  await wait(500);
  const badgesEl = stage.querySelector('#szef-badges');
  const rooms = [
    { icon: '🎵', name: 'Hangok', color: '#f6ad55' },
    { icon: '📸', name: 'Emlékek', color: '#68d391' },
    { icon: '🗺️', name: 'Világjáró', color: '#fc8181' },
    { icon: '🧠', name: 'Agytorna', color: '#63b3ed' },
    { icon: '💌', name: 'Levelek', color: '#b794f4' },
    { icon: '🎬', name: 'Mozi', color: '#f687b3' },
    { icon: '⏳', name: 'Idő', color: '#4fd1c5' },
    { icon: '🏎️', name: 'Kaland', color: '#ed8936' },
    { icon: '🎁', name: 'Ajándék', color: '#ecc94b' },
    { icon: '🍳', name: 'Konyha', color: '#48bb78' },
    { icon: '🧱', name: 'Kocka', color: '#f56565' },
  ];

  badgesEl.style.opacity = '1';
  rooms.forEach((r, i) => {
    setTimeout(() => {
      const badge = document.createElement('div');
      badge.style.cssText = `
        display:flex; align-items:center; gap:4px;
        padding:6px 12px; border-radius:20px; font-size:0.7rem;
        background:${r.color}15; border:1px solid ${r.color}44;
        color:${r.color}; animation:fadeIn 0.4s ease forwards;
        opacity:0;
      `;
      badge.innerHTML = `${r.icon} ${r.name}`;
      badgesEl.appendChild(badge);
    }, i * 120);
  });

  // Footer
  await wait(1800);
  stage.querySelector('#szef-footer').style.opacity = '1';

  // Second wave of confetti
  await wait(2000);
  launchBigConfetti();
}

// Helpers
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function typewriter(el, text, speed) {
  return new Promise(resolve => {
    let i = 0;
    el.textContent = '';
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

function countUp(el, target, suffix, duration) {
  const start = 0;
  const startTime = Date.now();
  function tick() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current + ' ' + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  tick();
}

function launchBigConfetti() {
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3', '#ecc94b', '#4fd1c5', '#fff'];
  const shapes = ['confetti-piece--circle', 'confetti-piece--rect', 'confetti-piece--star', 'confetti-piece--heart', 'confetti-piece--ribbon'];

  for (let wave = 0; wave < 3; wave++) {
    setTimeout(() => {
      for (let i = 0; i < 45; i++) {
        const piece = document.createElement('div');
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 14;
        const rot = Math.floor(Math.random() * 720);

        piece.className = `confetti-piece ${shape}`;
        piece.style.left = (5 + Math.random() * 90) + '%';
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.setProperty('--fall-duration', (3.5 + Math.random() * 4) + 's');
        piece.style.setProperty('--fall-delay', Math.random() * 0.8 + 's');
        piece.style.setProperty('--flip-duration', (1 + Math.random() * 2) + 's');
        piece.style.setProperty('--sway', (20 + Math.random() * 50) + 'px');
        piece.style.setProperty('--rot1', rot * 0.25 + 'deg');
        piece.style.setProperty('--rot2', rot * 0.5 + 'deg');
        piece.style.setProperty('--rot3', rot * 0.75 + 'deg');
        piece.style.setProperty('--rot4', rot * 0.9 + 'deg');
        piece.style.setProperty('--rot5', rot + 'deg');

        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 10000);
      }
    }, wave * 1000);
  }
}
