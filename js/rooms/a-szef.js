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
  const colors = ['#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#f687b3', '#ecc94b', '#4fd1c5'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 10) + 'px';
    piece.style.height = (6 + Math.random() * 10) + 'px';
    piece.style.setProperty('--fall-duration', (3 + Math.random() * 4) + 's');
    piece.style.setProperty('--fall-delay', Math.random() * 2 + 's');
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 8000);
  }
}
