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

  // Weather
  weather: 'clear', // 'clear' | 'rain'
  raindrops: [],

  // Commentary
  commentQueue: [],
  commentTimer: 0,

  // Championship
  championship: null, // { races: [], currentRace: 0, points: {} }

  // Victory
  donutMode: false,
  donutTimer: 0,

  // Per-track records
  trackRecords: {},

  // Camera flyover
  flyoverActive: false,
  flyoverIdx: 0,
};

// Load persisted data
try { const s = JSON.parse(localStorage.getItem('apu-gokart-car')); if (s) Object.assign(G.garageState, s); } catch {}
try { G.achievements = JSON.parse(localStorage.getItem('apu-gokart-achievements') || '{}'); } catch {}
try { G.trackRecords = JSON.parse(localStorage.getItem('apu-gokart-records') || '{}'); } catch {}
G.bestTime = localStorage.getItem('apu-gokart-best') || null;
