/* Power-up rendszer */

import { G } from './state.js';
import { sfxPowerup, sfxBoost } from './audio.js';
import { spawnSparks } from './particles.js';

export const POWERUP_TYPES = [
  { id: 'boost', icon: '⚡', color: '#fbbf24', name: 'BOOST' },
  { id: 'shield', icon: '🛡️', color: '#3b82f6', name: 'PAJZS' },
  { id: 'oil', icon: '🛢️', color: '#6b7280', name: 'OLAJ' },
];

export function spawnPowerups() {
  G.powerups = [];
  const spacing = Math.floor(G.track.center.length / 6);
  for (let i = 0; i < 6; i++) {
    const idx = (spacing * i + Math.floor(spacing / 2)) % G.track.center.length;
    const p = G.track.center[idx];
    G.powerups.push({
      x: p.x, y: p.y,
      type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
      alive: true, respawnTimer: 0
    });
  }
}

export function updatePowerups() {
  G.powerups.forEach(pu => {
    if (!pu.alive) {
      pu.respawnTimer--;
      if (pu.respawnTimer <= 0) {
        pu.alive = true;
        pu.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      }
      return;
    }
    if (Math.hypot(G.player.x - pu.x, G.player.y - pu.y) < 20 && !G.playerPowerup) {
      G.playerPowerup = pu.type;
      pu.alive = false;
      pu.respawnTimer = 300;
      sfxPowerup();
      showPowerupHUD();
    }
  });

  G.oilSlicks.forEach(oil => {
    oil.life--;
    G.allCars.forEach(car => {
      if (Math.hypot(car.x - oil.x, car.y - oil.y) < 15) {
        car.angle += (Math.random() - 0.5) * 0.5;
        car.speed *= 0.7;
      }
    });
  });
  G.oilSlicks = G.oilSlicks.filter(o => o.life > 0);
}

export function usePowerup() {
  if (!G.playerPowerup) return;
  const pu = G.playerPowerup;
  G.playerPowerup = null;
  hidePowerupHUD();

  if (pu.id === 'boost') {
    G.player.speed = Math.min(G.player.speed + 3, G.player.maxSpeed * 1.5);
    sfxBoost();
    for (let i = 0; i < 10; i++) spawnSparks(G.player.x, G.player.y);
  } else if (pu.id === 'shield') {
    G.player.shieldTimer = 180;
  } else if (pu.id === 'oil') {
    G.oilSlicks.push({ x: G.player.x, y: G.player.y, life: 600 });
  }
}

export function showPowerupHUD() {
  const el = document.getElementById('powerup-indicator');
  el.style.display = 'flex';
  document.getElementById('powerup-icon').textContent = G.playerPowerup.icon;
  document.getElementById('powerup-name').textContent = G.playerPowerup.name;
}

export function hidePowerupHUD() {
  document.getElementById('powerup-indicator').style.display = 'none';
}
