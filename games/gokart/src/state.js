/* Központi játék állapot — minden modul ezt importálja */

export const G = {
  // Canvas
  canvas: null,
  ctx: null,

  // Track
  track: null,
  trackLen: 0,
  currentTrackId: 'koki',

  // Cars
  player: null,
  aiCars: [],
  allCars: [],

  // Race
  gameRunning: false,
  startTime: 0,
  lapTimes: [],
  TOTAL_LAPS: 5,
  positions: [],
  lastPosition: 4,

  // Mode
  nightMode: false,
  difficulty: 'easy',
  reverseMode: false,

  // Nitro
  turboStartWindow: false,
  turboStartUsed: false,

  // Power-ups
  powerups: [],
  oilSlicks: [],
  playerPowerup: null,

  // Visuals
  particles: [],
  skidMarks: [],

  // Ghost
  ghostData: [],
  ghostPlayback: [],
  ghostFrame: 0,

  // Camera
  camera: { x: 0, y: 0, zoom: 2.2, targetZoom: 2.2, smoothing: 0.08, rotation: 0 },

  // Achievements
  achievements: {},

  // Garage
  garageState: {
    bodyColor: '#e94560',
    stripeColor: '#ff8a9e',
    size: 'medium',
    name: 'Apu Racer',
  },

  // Best time
  bestTime: null,
};

// Load persisted data
try { const s = JSON.parse(localStorage.getItem('apu-gokart-car')); if (s) Object.assign(G.garageState, s); } catch {}
try { G.achievements = JSON.parse(localStorage.getItem('apu-gokart-achievements') || '{}'); } catch {}
G.bestTime = localStorage.getItem('apu-gokart-best') || null;
