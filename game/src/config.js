// MOSS & MORTAR configuration: view, palette, the ten cycles, and tunables.
// One clear job: hold every tunable number and the campaign data.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const PROFILE_ROWS = 16;
export const MAX_HEARTS = 3;
export const PASS_MOLD = 0.6;
export const PASS_WARDEN = 0.7;

export const PALETTE = {
  skyDay: '#f6eeda',
  skyDayTop: '#e9d9b0',
  skyNight: '#2c3550',
  skyNightTop: '#1d2440',
  ground: '#b98d5f',
  groundDark: '#96703f',
  stone: '#a8a49a',
  stoneLight: '#cfccc2',
  stoneDark: '#7d7a72',
  slate: '#5b6b7a',
  slateDark: '#42505e',
  clay: '#c98a5a',
  clayDark: '#a96f42',
  sage: '#9db38a',
  sageDark: '#7d9570',
  moss: '#5d8a4a',
  mossLight: '#8fbf7a',
  amber: '#d9a441',
  amberLight: '#f2c96b',
  moon: '#dfe8f0',
  moonGlow: 'rgba(223, 232, 240, 0.25)',
  ink: '#2e2a24',
  inkSoft: '#6b5a44',
  cream: '#fff6e3',
  panel: 'rgba(46, 42, 36, 0.88)',
  panelLight: 'rgba(246, 238, 218, 0.92)',
  red: '#b3362a',
  gold: '#d9a441',
  dry: '#8a6b45',
  wet: '#5d8a4a',
};

// A piece's target silhouette is base + belly bump + rim taper.
// profile(t) = rim + (base - rim) * (1 - t)^1.5 + belly * exp(-((t - at) / 0.18)^2),
// clamped to [0.15, 1]. t = 0 is the foot, t = 1 is the rim.
export const PIECES = [
  { name: 'Garden Path', shape: { base: 0.55, belly: 0.3, at: 0.5, rim: 0.75 }, moldTime: 45, blurb: 'A flat stone walk for bare feet and beetles.' },
  { name: 'Dew Basin', shape: { base: 0.42, belly: 0.55, at: 0.45, rim: 0.55 }, moldTime: 42, blurb: 'A shallow bowl to catch the morning dew.' },
  { name: 'Ripple Slab', shape: { base: 0.6, belly: 0.25, at: 0.6, rim: 0.85 }, moldTime: 40, blurb: 'A wide slab where rain draws slow circles.' },
  { name: 'Caskstone', shape: { base: 0.48, belly: 0.5, at: 0.5, rim: 0.5 }, moldTime: 38, blurb: 'A round keeper for seeds, sand and stories.' },
  { name: 'Moss Arch', shape: { base: 0.35, belly: 0.62, at: 0.4, rim: 0.42 }, moldTime: 36, blurb: 'A doorway for moths, bent from living stone.' },
];

// Whisper nights: guide the firefly over dry plots. Grid is 6 cols x 4 rows.
// dry: [row, col] plots that must be watered. stones: blocked plots.
// start: [row, col] where the firefly begins. whispers: hop budget.
export const NIGHTS = [
  { name: 'Night 1 — First Dew', dry: [[0, 2], [1, 4], [2, 1], [3, 3]], stones: [[1, 1]], start: [3, 0], whispers: 15 },
  { name: 'Night 2 — Moth Hour', dry: [[0, 0], [0, 4], [1, 2], [2, 5], [3, 1]], stones: [[1, 4], [2, 2]], start: [3, 0], whispers: 18 },
  { name: 'Night 3 — Moon Rain', dry: [[0, 3], [1, 0], [1, 5], [2, 2], [2, 4], [3, 3]], stones: [[0, 1], [2, 0], [3, 5]], start: [0, 5], whispers: 18 },
  { name: 'Night 4 — Deep Roots', dry: [[0, 1], [0, 5], [1, 3], [2, 0], [2, 5], [3, 2], [3, 4]], stones: [[1, 1], [1, 4], [2, 3]], start: [3, 0], whispers: 20 },
];

// THE GRANITE WARDEN, Night 5: three heart-stones, molded in flickering moonlight.
export const WARDEN_PHASES = [
  { name: "The Warden's Heart", shape: { base: 0.5, belly: 0.6, at: 0.5, rim: 0.6 }, moldTime: 25 },
  { name: "The Warden's Brow", shape: { base: 0.4, belly: 0.5, at: 0.35, rim: 0.5 }, moldTime: 25 },
  { name: "The Warden's Core", shape: { base: 0.55, belly: 0.65, at: 0.55, rim: 0.7 }, moldTime: 25 },
];

export const GRID_COLS = 6;
export const GRID_ROWS = 4;
export const TOTAL_STARS = 30;
