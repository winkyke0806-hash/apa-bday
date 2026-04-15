/* Pálya adatbázis és track builder */

export const TRACK_HALF_W = 0.042;

export const TRACKS = {
  koki: {
    id: 'koki',
    name: 'Flashkart KÖKI',
    icon: '🏢',
    type: 'indoor',
    description: 'A legendás KÖKI pálya — szűk kanyarok, hosszú egyenes!',
    color: '#e94560',
    data: [
      [0.54,0.084],[0.489,0.081],[0.421,0.087],[0.384,0.123],[0.371,0.187],[0.374,0.244],
      [0.382,0.308],[0.38,0.377],[0.369,0.438],[0.355,0.472],[0.329,0.501],[0.30,0.514],
      [0.268,0.523],[0.239,0.53],[0.215,0.533],[0.201,0.514],[0.188,0.466],[0.182,0.416],
      [0.175,0.318],[0.153,0.28],[0.126,0.273],[0.095,0.3],[0.078,0.346],[0.073,0.391],
      [0.07,0.509],[0.068,0.539],[0.068,0.666],[0.072,0.734],[0.082,0.788],[0.091,0.823],
      [0.103,0.859],[0.122,0.876],[0.149,0.888],[0.785,0.889],[0.928,0.891],[0.95,0.834],
      [0.96,0.783],[0.955,0.73],[0.941,0.691],[0.914,0.658],[0.868,0.609],[0.807,0.584],
      [0.76,0.591],[0.721,0.61],[0.678,0.641],[0.638,0.66],[0.599,0.666],[0.564,0.616],
      [0.563,0.534],[0.591,0.508],[0.629,0.497],[0.658,0.502],[0.674,0.46],[0.684,0.408],
      [0.688,0.344],[0.695,0.306],[0.717,0.271],[0.741,0.244],[0.763,0.242],[0.778,0.256],
      [0.784,0.277],[0.811,0.383],[0.821,0.43],[0.832,0.469],[0.847,0.509],[0.87,0.522],
      [0.895,0.51],[0.917,0.458],[0.919,0.387],[0.918,0.313],[0.908,0.187],[0.891,0.144],
      [0.871,0.116],[0.841,0.108],[0.735,0.091],[0.646,0.093],
    ],
    decorations: [{"type":"tire","x":0.411,"y":0.047},{"type":"tire","x":0.395,"y":0.059},{"type":"tire","x":0.403,"y":0.05},{"type":"tire","x":0.387,"y":0.07},{"type":"tire","x":0.381,"y":0.075},{"type":"tire","x":0.374,"y":0.086},{"type":"tire","x":0.37,"y":0.096},{"type":"tire","x":0.364,"y":0.108},{"type":"tire","x":0.36,"y":0.126},{"type":"tire","x":0.355,"y":0.149},{"type":"tire","x":0.358,"y":0.137},{"type":"tire","x":0.353,"y":0.167},{"type":"tire","x":0.403,"y":0.397},{"type":"tire","x":0.399,"y":0.418},{"type":"tire","x":0.395,"y":0.436},{"type":"tire","x":0.389,"y":0.457},{"type":"tire","x":0.386,"y":0.472},{"type":"tire","x":0.38,"y":0.487},{"type":"tire","x":0.373,"y":0.501},{"type":"tire","x":0.364,"y":0.514},{"type":"tire","x":0.357,"y":0.528},{"type":"tire","x":0.35,"y":0.537},{"type":"tire","x":0.055,"y":0.354},{"type":"tire","x":0.059,"y":0.333},{"type":"tire","x":0.066,"y":0.317},{"type":"tire","x":0.071,"y":0.297},{"type":"tire","x":0.077,"y":0.288},{"type":"tire","x":0.083,"y":0.278},{"type":"tire","x":0.098,"y":0.371},{"type":"tire","x":0.106,"y":0.35},{"type":"tire","x":0.114,"y":0.333},{"type":"tire","x":0.122,"y":0.326},{"type":"tire","x":0.13,"y":0.324},{"type":"tire","x":0.138,"y":0.322},{"type":"tire","x":0.147,"y":0.326},{"type":"tire","x":0.153,"y":0.345},{"type":"tire","x":0.093,"y":0.743},{"type":"tire","x":0.101,"y":0.771},{"type":"tire","x":0.097,"y":0.755},{"type":"tire","x":0.108,"y":0.791},{"type":"tire","x":0.113,"y":0.807},{"type":"tire","x":0.119,"y":0.818},{"type":"tire","x":0.126,"y":0.83},{"type":"tire","x":0.134,"y":0.83},{"type":"tire","x":0.143,"y":0.836},{"type":"tire","x":0.151,"y":0.837},{"type":"tire","x":0.16,"y":0.838},{"type":"tire","x":0.058,"y":0.784},{"type":"tire","x":0.061,"y":0.807},{"type":"tire","x":0.066,"y":0.828},{"type":"tire","x":0.072,"y":0.853},{"type":"tire","x":0.078,"y":0.87},{"type":"tire","x":0.086,"y":0.888},{"type":"tire","x":0.092,"y":0.901},{"type":"tire","x":0.103,"y":0.907},{"type":"tire","x":0.111,"y":0.914},{"type":"tire","x":0.122,"y":0.922},{"type":"tire","x":0.132,"y":0.928},{"type":"tire","x":0.145,"y":0.933},{"type":"tire","x":0.137,"y":0.934},{"type":"garage","x":0.318,"y":0.264},{"type":"grandstand","x":0.489,"y":0.184},{"type":"grandstand","x":0.603,"y":0.197},{"type":"tire","x":0.939,"y":0.929},{"type":"tire","x":0.949,"y":0.913},{"type":"tire","x":0.955,"y":0.892},{"type":"tire","x":0.966,"y":0.872},{"type":"tire","x":0.972,"y":0.845},{"type":"tire","x":0.979,"y":0.817},{"type":"tire","x":0.982,"y":0.789},{"type":"tire","x":0.979,"y":0.75},{"type":"tire","x":0.846,"y":0.445},{"type":"tire","x":0.853,"y":0.459},{"type":"tire","x":0.861,"y":0.466},{"type":"tire","x":0.87,"y":0.47},{"type":"tire","x":0.883,"y":0.471},{"type":"tire","x":0.889,"y":0.454},{"type":"tire","x":0.895,"y":0.43},{"type":"tire","x":0.897,"y":0.403},{"type":"tire","x":0.814,"y":0.491},{"type":"tire","x":0.82,"y":0.511},{"type":"tire","x":0.827,"y":0.53},{"type":"tire","x":0.833,"y":0.537},{"type":"tire","x":0.842,"y":0.547},{"type":"tire","x":0.847,"y":0.55},{"type":"tire","x":0.861,"y":0.563},{"type":"tire","x":0.87,"y":0.564},{"type":"tire","x":0.887,"y":0.564},{"type":"tire","x":0.882,"y":0.564},{"type":"tire","x":0.854,"y":0.557},{"type":"tire","x":0.898,"y":0.555},{"type":"tire","x":0.906,"y":0.549},{"type":"tire","x":0.914,"y":0.533},{"type":"tire","x":0.923,"y":0.514},{"type":"tire","x":0.93,"y":0.501},{"type":"tire","x":0.939,"y":0.482},{"type":"tire","x":0.941,"y":0.461},{"type":"tire","x":0.86,"y":0.154},{"type":"tire","x":0.867,"y":0.167},{"type":"tire","x":0.874,"y":0.178},{"type":"tire","x":0.877,"y":0.186},{"type":"tire","x":0.883,"y":0.201},{"type":"tire","x":0.876,"y":0.07},{"type":"tire","x":0.887,"y":0.08},{"type":"tire","x":0.897,"y":0.095},{"type":"tire","x":0.907,"y":0.105},{"type":"tire","x":0.912,"y":0.117},{"type":"tire","x":0.918,"y":0.133},{"type":"tire","x":0.924,"y":0.149},{"type":"tire","x":0.934,"y":0.172},{"type":"tire","x":0.933,"y":0.188},{"type":"tire","x":0.766,"y":0.305},{"type":"tire","x":0.758,"y":0.289},{"type":"tire","x":0.746,"y":0.295},{"type":"tire","x":0.739,"y":0.311},{"type":"tire","x":0.728,"y":0.317},{"type":"tire","x":0.718,"y":0.334},{"type":"tire","x":0.713,"y":0.353},{"type":"tire","x":0.713,"y":0.375},{"type":"tire","x":0.657,"y":0.547},{"type":"tire","x":0.672,"y":0.55},{"type":"tire","x":0.681,"y":0.528},{"type":"tire","x":0.689,"y":0.501},{"type":"tire","x":0.695,"y":0.483},{"type":"tire","x":0.661,"y":0.403},{"type":"tire","x":0.657,"y":0.417},{"type":"tire","x":0.65,"y":0.434},{"type":"tire","x":0.641,"y":0.443},{"type":"tire","x":0.63,"y":0.443},{"type":"tire","x":0.616,"y":0.449},{"type":"tire","x":0.549,"y":0.5},{"type":"tire","x":0.542,"y":0.509},{"type":"tire","x":0.537,"y":0.538},{"type":"tire","x":0.537,"y":0.563},{"type":"tire","x":0.534,"y":0.589},{"type":"tire","x":0.535,"y":0.616},{"type":"tire","x":0.539,"y":0.636},{"type":"tire","x":0.545,"y":0.654},{"type":"tire","x":0.555,"y":0.668},{"type":"tire","x":0.572,"y":0.695},{"type":"tire","x":0.564,"y":0.683},{"type":"tire","x":0.584,"y":0.712},{"type":"tire","x":0.595,"y":0.714},{"type":"tire","x":0.605,"y":0.72},{"type":"tire","x":0.598,"y":0.555},{"type":"tire","x":0.59,"y":0.563},{"type":"tire","x":0.59,"y":0.583},{"type":"tire","x":0.599,"y":0.604},{"type":"tire","x":0.613,"y":0.614},{"type":"tire","x":0.884,"y":0.672},{"type":"tire","x":0.895,"y":0.687},{"type":"tire","x":0.905,"y":0.705},{"type":"tire","x":0.915,"y":0.722},{"type":"tire","x":0.926,"y":0.753},{"type":"tire","x":0.926,"y":0.775},{"type":"tire","x":0.921,"y":0.816},{"type":"tire","x":0.924,"y":0.796},{"type":"tire","x":0.915,"y":0.838},{"type":"tire","x":0.901,"y":0.843},{"type":"tire","x":0.932,"y":0.626},{"type":"tire","x":0.942,"y":0.638},{"type":"tire","x":0.95,"y":0.649},{"type":"tire","x":0.962,"y":0.662},{"type":"tire","x":0.97,"y":0.676},{"type":"tire","x":0.979,"y":0.704},{"type":"tire","x":0.681,"y":0.264},{"type":"tire","x":0.695,"y":0.254},{"type":"tire","x":0.705,"y":0.233},{"type":"tire","x":0.714,"y":0.217},{"type":"tire","x":0.724,"y":0.208},{"type":"tire","x":0.734,"y":0.207},{"type":"tire","x":0.747,"y":0.2},{"type":"tire","x":0.759,"y":0.199},{"type":"tire","x":0.775,"y":0.203},{"type":"tire","x":0.789,"y":0.213},{"type":"tire","x":0.797,"y":0.224},{"type":"tire","x":0.799,"y":0.246},{"type":"tire","x":0.805,"y":0.266},{"type":"tire","x":0.816,"y":0.297},{"type":"tire","x":0.814,"y":0.279},{"type":"tire","x":0.82,"y":0.326}],
  },

  outdoor: {
    id: 'outdoor',
    name: 'Duna Park GP',
    icon: '🌳',
    type: 'outdoor',
    description: 'Nyílt levegős ovális — széles kanyarok, nagy sebesség!',
    color: '#22c55e',
    data: [
      [0.50,0.08],[0.40,0.08],[0.30,0.09],[0.22,0.12],[0.16,0.18],[0.12,0.26],
      [0.10,0.36],[0.09,0.48],[0.10,0.58],[0.13,0.66],[0.18,0.73],[0.25,0.78],
      [0.34,0.82],[0.44,0.85],[0.54,0.87],[0.64,0.86],[0.73,0.82],[0.80,0.76],
      [0.85,0.68],[0.88,0.58],[0.89,0.47],[0.88,0.36],[0.84,0.27],[0.78,0.20],
      [0.72,0.16],[0.64,0.13],[0.56,0.10],
    ],
    decorations: [],
  },

  hungaroring: {
    id: 'hungaroring',
    name: 'Mini Hungaroring',
    icon: '🏁',
    type: 'outdoor',
    description: 'A Hungaroring ihlette pálya — technikai kanyarok, domborzat!',
    color: '#f6ad55',
    data: [
      [0.50,0.10],[0.42,0.09],[0.34,0.10],[0.28,0.14],[0.24,0.20],[0.20,0.28],
      [0.18,0.36],[0.20,0.44],[0.24,0.50],[0.22,0.56],[0.18,0.60],[0.14,0.66],
      [0.12,0.74],[0.14,0.80],[0.20,0.84],[0.28,0.86],[0.38,0.87],[0.48,0.88],
      [0.58,0.87],[0.66,0.84],[0.72,0.80],[0.76,0.74],[0.78,0.66],[0.82,0.58],
      [0.86,0.50],[0.88,0.42],[0.86,0.34],[0.82,0.28],[0.78,0.24],[0.74,0.22],
      [0.70,0.24],[0.66,0.28],[0.62,0.24],[0.58,0.18],[0.54,0.14],
    ],
    decorations: [],
  },

  street: {
    id: 'street',
    name: 'Budapesti Utcák',
    icon: '🌃',
    type: 'indoor',
    description: 'Szűk utcák, éles kanyarok — igazi street racing!',
    color: '#a855f7',
    data: [
      [0.15,0.15],[0.25,0.12],[0.40,0.12],[0.55,0.12],[0.65,0.14],[0.72,0.20],
      [0.75,0.30],[0.78,0.40],[0.82,0.48],[0.85,0.42],[0.88,0.35],[0.85,0.28],
      [0.80,0.22],[0.82,0.16],[0.88,0.12],[0.90,0.20],[0.88,0.32],[0.85,0.44],
      [0.82,0.55],[0.78,0.64],[0.72,0.70],[0.64,0.74],[0.54,0.76],[0.44,0.78],
      [0.34,0.82],[0.24,0.85],[0.16,0.82],[0.12,0.74],[0.10,0.64],[0.12,0.54],
      [0.15,0.44],[0.14,0.34],[0.12,0.24],
    ],
    decorations: [],
  },

  figure8: {
    id: 'figure8',
    name: 'Pretzel Pálya',
    icon: '🥨',
    type: 'indoor',
    description: 'Szűk pálya rengeteg kanyarral — a türelem nyer!',
    color: '#ec4899',
    data: [
      // Twisted pretzel shape (no self-intersection)
      [0.50,0.12],[0.40,0.12],[0.32,0.15],[0.26,0.22],[0.22,0.30],[0.20,0.40],
      [0.22,0.48],[0.28,0.52],[0.36,0.50],[0.42,0.44],[0.46,0.38],[0.48,0.32],
      [0.52,0.32],[0.54,0.38],[0.58,0.44],[0.64,0.50],[0.72,0.52],[0.78,0.48],
      [0.80,0.40],[0.78,0.30],[0.74,0.22],[0.68,0.15],[0.60,0.12],
      [0.58,0.18],[0.60,0.26],[0.64,0.34],[0.68,0.42],[0.72,0.52],
      [0.74,0.62],[0.72,0.72],[0.66,0.80],[0.58,0.85],[0.50,0.88],
      [0.42,0.85],[0.34,0.80],[0.28,0.72],[0.26,0.62],[0.28,0.52],
      [0.32,0.42],[0.36,0.34],[0.40,0.26],[0.42,0.18],
    ],
    decorations: [],
  },
};

export const TRACK_LIST = Object.keys(TRACKS);

export function buildTrackFromData(rawData, w, h, reverse = false) {
  const s = Math.min(w, h);
  const hw = TRACK_HALF_W * s;
  const raw = reverse ? [...rawData].reverse() : rawData;
  let center = raw.map(p => ({ x: p[0] * w, y: p[1] * h }));

  // Chaikin smooth 3x
  for (let iter = 0; iter < 3; iter++) {
    const next = [];
    for (let i = 0; i < center.length; i++) {
      const j = (i + 1) % center.length;
      next.push({ x: center[i].x * 0.75 + center[j].x * 0.25, y: center[i].y * 0.75 + center[j].y * 0.25 });
      next.push({ x: center[i].x * 0.25 + center[j].x * 0.75, y: center[i].y * 0.25 + center[j].y * 0.75 });
    }
    center = next;
  }

  const outer = [], inner = [];
  for (let i = 0; i < center.length; i++) {
    const prev = center[(i - 1 + center.length) % center.length];
    const nxt = center[(i + 1) % center.length];
    const dx = nxt.x - prev.x, dy = nxt.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    outer.push({ x: center[i].x + (-dy / len) * hw, y: center[i].y + (dx / len) * hw });
    inner.push({ x: center[i].x - (-dy / len) * hw, y: center[i].y - (dx / len) * hw });
  }

  const curvature = center.map((p, i) => {
    const prev = center[(i - 1 + center.length) % center.length];
    const nxt = center[(i + 1) % center.length];
    return ((p.x - prev.x) * (nxt.y - p.y) - (p.y - prev.y) * (nxt.x - p.x)) /
      ((Math.hypot(p.x - prev.x, p.y - prev.y) * Math.hypot(nxt.x - p.x, nxt.y - p.y)) || 1);
  });

  const cpIdx = [0, Math.floor(center.length * 0.25), Math.floor(center.length * 0.5), Math.floor(center.length * 0.75)];
  const checkpoints = cpIdx.map(i => ({ outer: outer[i], inner: inner[i], center: center[i] }));

  return { center, outer, inner, hw, curvature, checkpoints };
}

export function pip(px, py, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

export function isOnTrack(x, y, track) {
  return pip(x, y, track.outer) && !pip(x, y, track.inner);
}

export function findNearestIdx(x, y, track) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < track.center.length; i++) {
    const d = Math.hypot(track.center[i].x - x, track.center[i].y - y);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

export function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function getTrackAngle(idx, track) {
  const tc = track.center;
  const i = ((idx % tc.length) + tc.length) % tc.length;
  const n = tc[(i + 1) % tc.length], c = tc[i];
  return Math.atan2(n.x - c.x, -(n.y - c.y));
}
