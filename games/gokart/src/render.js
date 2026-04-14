/* Renderelés — pálya, autók, dekorációk, HUD effektek */

import { G } from './state.js';
import { isGas, isBrake, isLeft, isRight } from './input.js';
import { renderParticles } from './particles.js';
import { TRACKS } from './tracks.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export function render() {
  const { ctx, canvas: cvs, track, player, allCars, nightMode, camera, skidMarks, oilSlicks, powerups, ghostPlayback, ghostFrame } = G;
  const w = cvs.width, h = cvs.height;
  const trackDef = TRACKS[G.currentTrackId];
  const isIndoor = trackDef?.type === 'indoor';

  // Camera follow + zoom
  camera.targetZoom = 2.2 - Math.abs(player.speed) * 0.08;
  camera.targetZoom = Math.max(1.6, Math.min(2.5, camera.targetZoom));
  camera.zoom += (camera.targetZoom - camera.zoom) * 0.05;
  camera.x += (player.x - camera.x) * camera.smoothing;
  camera.y += (player.y - camera.y) * camera.smoothing;

  // Camera lean into turns
  const turnInput = (isLeft() ? -1 : 0) + (isRight() ? 1 : 0);
  const camRotTarget = turnInput * -0.03 * Math.min(1, Math.abs(player.speed) / 3);
  camera.rotation += (camRotTarget - camera.rotation) * 0.06;

  // Clear
  ctx.fillStyle = nightMode ? '#080808' : (isIndoor ? '#1e1e1e' : '#1a4a16');
  ctx.fillRect(0, 0, w, h);

  // BEGIN CAMERA
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(camera.rotation);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Floor grid
  const floorSize = Math.max(w, h) * 2;
  const fx = camera.x - floorSize / 2, fy = camera.y - floorSize / 2;
  ctx.strokeStyle = nightMode ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 0.5;
  const gs = Math.floor(fx / 80) * 80;
  for (let x = gs; x < fx + floorSize; x += 80) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy + floorSize); ctx.stroke(); }
  const gsy = Math.floor(fy / 80) * 80;
  for (let y = gsy; y < fy + floorSize; y += 80) { ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + floorSize, y); ctx.stroke(); }

  // Track asphalt
  ctx.beginPath();
  track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = nightMode ? '#2a2a2a' : (isIndoor ? '#3d3d3d' : '#444');
  ctx.fill();

  // Inner cutout
  ctx.beginPath();
  track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = nightMode ? '#111' : (isIndoor ? '#1e1e1e' : '#1a4a16');
  ctx.fill();

  // Walls
  ctx.beginPath(); track.outer.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); track.inner.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.closePath();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#f6ad55'; ctx.lineWidth = 2; ctx.stroke();

  // Center dashes
  ctx.setLineDash([6, 10]); ctx.beginPath();
  track.center.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);

  // Neon wall lights
  ctx.globalAlpha = nightMode ? 0.3 : 0.15;
  for (let i = 0; i < track.outer.length; i += 2) {
    ctx.fillStyle = i % 20 < 10 ? '#00ffff' : '#ff00ff';
    ctx.beginPath(); ctx.arc(track.outer[i].x, track.outer[i].y, nightMode ? 3 : 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Start/finish checkerboard
  const s0 = track.outer[0], s1 = track.inner[0];
  const sfDx = s1.x - s0.x, sfDy = s1.y - s0.y, sfLen = Math.hypot(sfDx, sfDy), sfNx = sfDx / sfLen, sfNy = sfDy / sfLen;
  for (let row = 0; row < 2; row++) for (let col = 0; col < 8; col++) {
    const t = col / 8, bx = s0.x + sfNx * sfLen * t, by = s0.y + sfNy * sfLen * t, sz = sfLen / 8;
    ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#111';
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(sfDy, sfDx)); ctx.fillRect(0, -3 + row * 3, sz, 3); ctx.restore();
  }

  // Decorations
  renderDecorations(ctx, w, h, trackDef);

  // Oil slicks
  oilSlicks.forEach(oil => {
    ctx.fillStyle = `rgba(30,30,30,${Math.min(0.6, oil.life / 600)})`;
    ctx.beginPath(); ctx.ellipse(oil.x, oil.y, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Power-ups
  powerups.forEach(pu => {
    if (!pu.alive) return;
    const t = Date.now() * 0.003, bobY = Math.sin(t) * 3;
    ctx.fillStyle = pu.type.color + '33';
    ctx.beginPath(); ctx.arc(pu.x, pu.y + bobY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pu.type.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pu.x, pu.y + bobY, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pu.type.icon, pu.x, pu.y + bobY + 5);
  });

  // Skid marks
  skidMarks.forEach(m => {
    ctx.fillStyle = `rgba(20,20,20,${(1 - m.age / 150) * 0.3})`;
    ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, Math.PI * 2); ctx.fill();
  });

  // Particles
  renderParticles(ctx);

  // Ghost car
  if (ghostPlayback.length > 0 && G.ghostFrame < ghostPlayback.length) {
    const g = ghostPlayback[G.ghostFrame];
    ctx.save(); ctx.globalAlpha = 0.25;
    ctx.translate(g.x, g.y); ctx.rotate(g.angle);
    ctx.fillStyle = '#fff';
    roundRect(ctx, -7, -12, 14, 24, 3); ctx.fill();
    ctx.restore();
    G.ghostFrame++;
  }

  // Cars (depth sorted)
  [...allCars].sort((a, b) => a.y - b.y).forEach(car => renderCar(ctx, car));

  // Headlight (night, world space)
  if (nightMode) {
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
    const grad = ctx.createRadialGradient(0, -player.h, 0, 0, -player.h - 60, 40);
    grad.addColorStop(0, 'rgba(255,240,200,0.2)'); grad.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = grad; ctx.beginPath();
    ctx.moveTo(-12, -player.h / 2); ctx.lineTo(12, -player.h / 2);
    ctx.lineTo(30, -player.h / 2 - 60); ctx.lineTo(-30, -player.h / 2 - 60);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // END CAMERA
  ctx.restore();

  // SCREEN SPACE — night vignette
  if (nightMode) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.55);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  }

  // Speed lines
  if (Math.abs(player.speed) > 3.5) {
    const intensity = (Math.abs(player.speed) - 3.5) / 3;
    ctx.save(); ctx.globalAlpha = Math.min(0.15, intensity * 0.1);
    for (let i = 0; i < 8; i++) {
      const lx = Math.random() * w, ly = Math.random() * h, len = 20 + intensity * 40;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(lx, ly); ctx.lineTo(lx - Math.sin(player.angle) * len, ly + Math.cos(player.angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Camera shake
  if (player.speed > 4.5) {
    const s = (player.speed - 4.5) * 0.3;
    cvs.style.transform = `translate(${(Math.random() - 0.5) * s}px,${(Math.random() - 0.5) * s}px)`;
  } else cvs.style.transform = '';

  // Mini-map
  renderMiniMap(ctx, w, h);
}

function renderCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y); ctx.rotate(car.angle);

  if (car.shieldTimer > 0) {
    ctx.strokeStyle = `rgba(59,130,246,${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(car.w, car.h) * 0.8, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(ctx, -car.w / 2 + 2, -car.h / 2 + 2, car.w, car.h, 3); ctx.fill();
  ctx.fillStyle = car.color; roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 3); ctx.fill();
  ctx.fillStyle = car.stripe; ctx.fillRect(-1.5, -car.h / 2 + 1, 3, car.h - 2);
  ctx.fillStyle = 'rgba(120,200,255,0.7)'; roundRect(ctx, -car.w / 2 + 2, -car.h / 2 + 2, car.w - 4, 5, 1.5); ctx.fill();
  ctx.fillStyle = isBrake() && car.isPlayer ? '#ff0000' : '#cc3333';
  ctx.fillRect(-car.w / 2 + 1, car.h / 2 - 3, 3, 2); ctx.fillRect(car.w / 2 - 4, car.h / 2 - 3, 3, 2);

  if (car.speed > 1.5) {
    ctx.fillStyle = `rgba(255,${100 + Math.random() * 80},30,${0.2 + Math.random() * 0.3})`;
    ctx.beginPath(); ctx.arc(-2, car.h / 2 + 2 + Math.random() * 3, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, car.h / 2 + 2 + Math.random() * 3, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  if (!car.isPlayer) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '600 7px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(car.name, car.x, car.y - car.h / 2 - 8);
  }
}

function renderDecorations(ctx, w, h, trackDef) {
  const decos = trackDef?.decorations || [];
  decos.forEach(d => {
    const px = d.x * w, py = d.y * h;
    if (d.type === 'tire') {
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#282828'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(px - 2, py - 2, 3, 0, Math.PI * 2); ctx.fill();
    } else if (d.type === 'grandstand') {
      const gw = 70, gh = 40;
      ctx.fillStyle = '#444'; ctx.fillRect(px - gw / 2, py - gh / 2, gw, gh);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(px - gw / 2, py - gh / 2, gw, gh);
      const pc = ['#e94560', '#f6ad55', '#3b82f6', '#22c55e', '#a855f7', '#fff', '#ff6b9d', '#ffd93d'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
        ctx.fillStyle = pc[(r * 8 + c) % pc.length]; ctx.beginPath(); ctx.arc(px - gw / 2 + 6 + c * 8, py - gh / 2 + 6 + r * 9, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e94560'; ctx.fillRect(px - gw / 2, py + gh / 2 + 2, gw, 10);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px JetBrains Mono'; ctx.textAlign = 'center'; ctx.fillText('GOKART GP', px, py + gh / 2 + 10);
    } else if (d.type === 'garage') {
      const gw = 65, gh = 45;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - gw / 2 + 3, py - gh / 2 + 3, gw, gh);
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px - gw / 2, py - gh / 2, gw, gh);
      ctx.fillStyle = '#e94560'; ctx.fillRect(px - gw / 2, py - gh / 2, gw, 6);
      for (let i = 0; i < 3; i++) { const dx = px - gw / 2 + 5 + i * 20; ctx.fillStyle = '#555'; ctx.fillRect(dx, py - 2, 16, gh / 2 + 2); }
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.strokeRect(px - gw / 2, py - gh / 2, gw, gh);
      ctx.fillStyle = '#f6ad55'; ctx.font = 'bold 8px JetBrains Mono'; ctx.textAlign = 'center'; ctx.fillText('PIT STOP', px, py - gh / 2 - 5);
    }
  });
}

function renderMiniMap(ctx, w, h) {
  const { track, allCars } = G;
  const size = Math.min(120, w * 0.16), mx = w - size - 10, my = h - size - 10;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  track.center.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  const tw = maxX - minX, th = maxY - minY, sc = (size - 16) / Math.max(tw, th);
  ctx.save(); ctx.globalAlpha = 0.7;
  roundRect(ctx, mx - 2, my - 2, size + 4, size + 4, 8); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
  ctx.beginPath(); track.center.forEach((p, i) => { const px = mx + 8 + (p.x - minX) * sc, py = my + 8 + (p.y - minY) * sc; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  ctx.closePath(); ctx.strokeStyle = '#666'; ctx.lineWidth = 3; ctx.stroke();
  allCars.forEach(car => { ctx.fillStyle = car.color; ctx.beginPath(); ctx.arc(mx + 8 + (car.x - minX) * sc, my + 8 + (car.y - minY) * sc, car.isPlayer ? 4 : 3, 0, Math.PI * 2); ctx.fill(); if (car.isPlayer) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); } });
  ctx.restore();
}
