export function renderMinigame() {
  // A Széf nem rendelkezik minijátékkal — automatikusan nyílik
}

export function renderContent(container, room) {
  launchBigConfetti();

  container.innerHTML = `
    <div style="text-align:center; padding:40px 20px;" class="fade-in">
      <div style="font-size:5rem; margin-bottom:20px;">🎉🎂🎉</div>
      <h1 style="font-family:Georgia,serif; font-size:clamp(2rem,6vw,3.5rem); color:#f6ad55; margin-bottom:16px;">
        Boldog Szülinapot, Apu!
      </h1>
      <p style="font-size:1.1rem; color:rgba(255,255,255,0.7); line-height:1.8; max-width:500px; margin:0 auto 32px;">
        Végigmentél az összes szobán! Minden meglepetés a tiéd.<br>
        Köszönöm hogy a legjobb Apu vagy a világon. ❤️
      </p>

      <div style="
        background:rgba(255,255,255,0.05); border:2px solid #f6ad55;
        border-radius:16px; padding:24px; max-width:500px; margin:0 auto;
      ">
        <h3 style="color:#f6ad55; margin-bottom:16px;">📊 A Te statisztikáid:</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div style="text-align:center;">
            <div style="font-size:1.4rem; font-weight:bold; color:#f6ad55;">11 🚪</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:4px;">Felfedezett szobák</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.4rem; font-weight:bold; color:#f6ad55;">Mester Felfedező 🏆</div>
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:4px;">Státusz</div>
          </div>
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.3); margin-top:40px; font-size:0.8rem;">
        Szeretettel készítette a családod 💛
      </p>
    </div>
  `;
}

function launchBigConfetti() {
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3', '#ecc94b', '#4fd1c5', '#fff'];
  const shapes = ['confetti-piece--circle', 'confetti-piece--rect', 'confetti-piece--star', 'confetti-piece--heart'];

  // 3 waves of confetti
  for (let wave = 0; wave < 3; wave++) {
    setTimeout(() => {
      for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 14;
        const rot = Math.floor(Math.random() * 720);

        piece.className = `confetti-piece ${shape}`;
        piece.style.left = (5 + Math.random() * 90) + '%';
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.setProperty('--fall-duration', (3 + Math.random() * 4) + 's');
        piece.style.setProperty('--fall-delay', Math.random() * 0.8 + 's');
        piece.style.setProperty('--sway', (20 + Math.random() * 50) + 'px');
        piece.style.setProperty('--rot1', rot * 0.25 + 'deg');
        piece.style.setProperty('--rot2', rot * 0.5 + 'deg');
        piece.style.setProperty('--rot3', rot * 0.75 + 'deg');
        piece.style.setProperty('--rot4', rot * 0.9 + 'deg');
        piece.style.setProperty('--rot5', rot + 'deg');

        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 9000);
      }
    }, wave * 800);
  }
}
