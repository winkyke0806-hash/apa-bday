/* Particle rendszer */

import { G } from './state.js';

export function spawnParticle(x, y, vx, vy, color, life, size) {
  G.particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
}

export function spawnDriftSmoke(car) {
  const bx = car.x - Math.sin(car.angle) * car.h / 2;
  const by = car.y + Math.cos(car.angle) * car.h / 2;
  for (let i = 0; i < 2; i++) {
    spawnParticle(
      bx + (Math.random() - 0.5) * 6, by + (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5,
      'rgba(180,180,180,', 30 + Math.random() * 20, 4 + Math.random() * 4
    );
  }
}

export function spawnSparks(x, y) {
  for (let i = 0; i < 6; i++) {
    spawnParticle(x, y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4,
      'rgba(255,200,50,', 10 + Math.random() * 10, 2);
  }
}

export function spawnNitroFlame(car) {
  const bx = car.x - Math.sin(car.angle) * car.h / 2;
  const by = car.y + Math.cos(car.angle) * car.h / 2;
  for (let i = 0; i < 3; i++) {
    spawnParticle(
      bx + (Math.random() - 0.5) * 4, by + (Math.random() - 0.5) * 4,
      -Math.sin(car.angle) * (-2 + Math.random() * -2), Math.cos(car.angle) * (-2 + Math.random() * -2),
      i % 2 ? 'rgba(255,100,0,' : 'rgba(255,200,50,', 8 + Math.random() * 8, 3 + Math.random() * 3
    );
  }
}

export function updateParticles() {
  G.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life--; });
  G.particles = G.particles.filter(p => p.life > 0);
}

export function renderParticles(ctx) {
  G.particles.forEach(p => {
    const alpha = (p.life / p.maxLife) * 0.6;
    ctx.fillStyle = p.color + alpha + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
  });
}
