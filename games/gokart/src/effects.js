/* Időjárás, kommentátor, flyover, victory effektek */

import { G } from './state.js';

/* ═══════════════════════════
   WEATHER — Rain
   ═══════════════════════════ */

export function initRain(w, h) {
  G.raindrops = [];
  for (let i = 0; i < 150; i++) {
    G.raindrops.push({
      x: Math.random() * w * 2,
      y: Math.random() * h,
      speed: 8 + Math.random() * 6,
      len: 10 + Math.random() * 15,
      opacity: 0.1 + Math.random() * 0.2,
    });
  }
}

export function updateRain(w, h) {
  if (G.weather !== 'rain') return;
  G.raindrops.forEach(r => {
    r.x -= 2;
    r.y += r.speed;
    if (r.y > h) { r.y = -r.len; r.x = Math.random() * w * 2; }
    if (r.x < -50) r.x = w + 50;
  });
}

export function renderRain(ctx, w, h) {
  if (G.weather !== 'rain') return;
  ctx.save();
  G.raindrops.forEach(r => {
    ctx.strokeStyle = `rgba(150,180,255,${r.opacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x - 3, r.y + r.len);
    ctx.stroke();
  });
  // Wet overlay
  ctx.fillStyle = 'rgba(100,130,200,0.04)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/* ═══════════════════════════
   COMMENTARY — Dynamic text callouts
   ═══════════════════════════ */

const COMMENTS = {
  drift: ['🔥 BRUTAL DRIFT!', '💨 SZÁGULDÁS!', '🔥 DRIFTMESTER!', '💫 OLDALAZÁS!'],
  overtake: ['⬆️ ELŐZÉS!', '🏎️ MEGELŐZTE!', '⚡ ELŐ TÖRT!'],
  collision: ['💥 BUMM!', '🧱 FALLNAK MENT!', '💢 ÜTKÖZÉS!', '🫣 AÚ!'],
  boost: ['⚡ TURBO!', '🚀 RAKÉTAINDÍTÁS!', '💨 NITRO BEKAPCSOLVA!'],
  lead: ['👑 VEZET!', '🥇 AZ ÉLEN!', '🏆 ELSŐ HELYEN!'],
  lastLap: ['🏁 UTOLSÓ KÖR!', '🔥 MOST VAGY SOHA!'],
  closeCall: ['😱 HAJSZÁLON MÚLOTT!', '🫣 MAJDNEM!'],
};

export function addComment(type) {
  if (G.commentTimer > 0) return; // don't spam
  const list = COMMENTS[type];
  if (!list) return;
  const text = list[Math.floor(Math.random() * list.length)];
  G.commentQueue.push(text);
  G.commentTimer = 90; // cooldown frames
}

export function updateCommentary() {
  if (G.commentTimer > 0) G.commentTimer--;

  if (G.commentQueue.length > 0 && G.commentTimer <= 0) {
    const text = G.commentQueue.shift();
    showCommentPopup(text);
  }
}

function showCommentPopup(text) {
  const el = document.getElementById('commentary-popup');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('visible');
  void el.offsetWidth; // reflow
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 1800);
}

/* ═══════════════════════════
   CAMERA FLYOVER (pre-race)
   ═══════════════════════════ */

export function runFlyover() {
  return new Promise(resolve => {
    if (!G.track) { resolve(); return; }

    G.flyoverActive = true;
    G.flyoverIdx = 0;
    const tc = G.track.center;
    const speed = Math.max(1, Math.floor(tc.length / 300)); // complete in ~5 sec

    function tick() {
      G.flyoverIdx += speed;
      if (G.flyoverIdx >= tc.length) {
        G.flyoverActive = false;
        // Snap camera to player
        G.camera.x = G.player.x;
        G.camera.y = G.player.y;
        resolve();
        return;
      }

      const p = tc[G.flyoverIdx];
      G.camera.x = p.x;
      G.camera.y = p.y;
      G.camera.zoom = 1.8; // slightly zoomed out for overview

      render_frame();
      requestAnimationFrame(tick);
    }

    tick();
  });
}

// Lightweight render during flyover (no update, just draw)
function render_frame() {
  const { render: renderFn } = G._renderFn || {};
  if (renderFn) renderFn();
}

/* ═══════════════════════════
   VICTORY — Donut celebration
   ═══════════════════════════ */

export function startVictoryDonuts() {
  G.donutMode = true;
  G.donutTimer = 180; // 3 seconds of donuts
}

export function updateVictoryDonuts() {
  if (!G.donutMode) return;
  G.donutTimer--;

  // Spin the player car
  G.player.angle += 0.15;
  G.player.speed = 1.5;
  G.player.x += Math.sin(G.player.angle) * G.player.speed;
  G.player.y -= Math.cos(G.player.angle) * G.player.speed;

  // Spawn confetti
  if (G.donutTimer % 5 === 0) {
    const colors = ['#e94560', '#f6ad55', '#3b82f6', '#22c55e', '#a855f7'];
    for (let i = 0; i < 3; i++) {
      G.particles.push({
        x: G.player.x + (Math.random() - 0.5) * 20,
        y: G.player.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: colors[Math.floor(Math.random() * colors.length)] + ','.replace(',', '(') ? 'rgba(255,200,50,' : 'rgba(255,100,100,',
        life: 40,
        maxLife: 40,
        size: 3 + Math.random() * 4,
      });
    }
  }

  // Skid marks from spinning
  G.skidMarks.push({ x: G.player.x, y: G.player.y, age: 0 });

  if (G.donutTimer <= 0) {
    G.donutMode = false;
  }
}
