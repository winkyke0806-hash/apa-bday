/* Autó osztály */

export class Car {
  constructor(color, stripe, name, isPlayer = false) {
    this.x = 0; this.y = 0; this.angle = 0; this.speed = 0;
    this.color = color; this.stripe = stripe; this.name = name;
    this.isPlayer = isPlayer;
    this.maxSpeed = isPlayer ? 5.0 : 3.2 + Math.random() * 0.6;
    this.accel = isPlayer ? 0.14 : 0.07 + Math.random() * 0.03;
    this.friction = 0.975; this.offFriction = 0.88;
    this.turnSpeed = isPlayer ? 0.07 : 0.045;
    this.w = 14; this.h = 24;
    this.lap = 0; this.nextCP = 0; this.cpPassed = 0;
    this.finished = false; this.finishTime = 0;
    this.aiTarget = 0; this.aiOffset = (Math.random() - 0.5) * 0.5;
    this.nitro = 0; this.nitroActive = false;
    this.shieldTimer = 0;
    this.driftScore = 0;
    this.totalDrift = 0;
    this.collisions = 0;
  }
}

export const AI_DEFS = [
  { color: '#2563eb', stripe: '#60a5fa', name: 'Kék Villám' },
  { color: '#16a34a', stripe: '#4ade80', name: 'Zöld Szörny' },
  { color: '#9333ea', stripe: '#c084fc', name: 'Lila Rakéta' },
];

export const SIZE_DEFS = {
  small: { w: 10, h: 18, maxSpeed: 5.5, accel: 0.16, turnSpeed: 0.08, label: 'Gyors & agilis' },
  medium: { w: 14, h: 24, maxSpeed: 5.0, accel: 0.14, turnSpeed: 0.07, label: 'Kiegyensúlyozott' },
  large: { w: 18, h: 30, maxSpeed: 4.5, accel: 0.12, turnSpeed: 0.06, label: 'Erős & stabil' },
};
