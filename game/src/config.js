// Numbers that describe CINDER COURT: canvas size, palette, card geometry and the
// fixed coordinates of every zone on the table. Nothing here draws or decides; it is
// the single place to retune the look and the balance.

export const VIEW = { w: 1280, h: 720 };

// --- match constants -------------------------------------------------------
export const RANKS = [1, 2, 3, 4, 5, 6];
export const HAND_SIZE = 5;
export const HEARTH_COUNT = 3;
export const LIFE_START = 12;
export const STOKE_BONUS = 2;
export const MIN_CLASH_DAMAGE = 1;

export const HEARTH_NAMES = ['LEFT HEARTH', 'CENTRE HEARTH', 'RIGHT HEARTH'];
export const HEARTH_NUMERALS = ['I', 'II', 'III'];

export const RIVAL_NAME = 'VESPER';
export const RIVAL_TITLE = 'THE ASH SUITOR';
export const PLAYER_NAME = 'YOU';
export const PLAYER_TITLE = 'SUITOR OF EMBERS';

// --- palette ---------------------------------------------------------------
export const INK = {
  night: '#0d0908',
  table: '#1b100c',
  umber: '#3a1e12',
  umberLit: '#5c2f18',
  lantern: '#ffb15c',
  ash: '#d9c7ad',
  ashDim: '#8e7b66',
  vellum: '#f4e8d0',
  vellumShade: '#dccbab',
  vellumInk: '#2a1d14',
  gold: '#f6c957',
  goldDeep: '#b8862a',
  cold: '#9db9d4',
  coldDeep: '#44627f',
  blood: '#e0533a',
};

// --- card geometry ---------------------------------------------------------
export const CARD = { w: 148, h: 208, radius: 14, border: 7 };

export const SCALE = {
  playerHand: 0.92,
  rivalHand: 0.76,
  hearth: 0.7,
  bank: 0.6,
  pile: 0.42,
};

// --- zones (card y values are the top edge of the card at that zone) ------
export const ZONE = {
  rivalHandY: 8,
  rivalHandCenterX: 640,
  rivalHandStep: 104,

  playerHandY: 516,
  playerHandCenterX: 640,
  playerHandStep: 130,

  hearthCentersX: [340, 640, 940],
  hearthRivalY: 172,
  hearthPlayerY: 360,
  hearthSeamY: 339,
  hearthPlateW: 212,

  rivalLife: { x: 992, y: 10, w: 278, h: 140 },
  playerLife: { x: 10, y: 548, w: 278, h: 164 },

  rivalBank: { cx: 86, cy: 86 },
  playerBank: { cx: 1196, cy: 650 },

  cycleWheel: { cx: 116, cy: 238, r: 62 },
  deckStack: { cx: 62, cy: 366 },
  discardStack: { cx: 170, cy: 366 },

  rulesHook: { x: 12, y: 436, w: 226, h: 96 },
  turnBanner: { x: 1048, y: 168, w: 224, h: 62 },
  logPanel: { x: 1048, y: 240, w: 224, h: 282 },
  controlHint: { x: 1048, y: 528, w: 224, h: 58 },
};

// --- pacing (seconds) ------------------------------------------------------
export const TIME = {
  dealStagger: 0.085,
  dealTravel: 0.42,
  rivalThink: 0.55,
  rivalTell: 0.8,
  afterPlay: 0.34,
  clashHold: 0.95,
  roundHold: 1.15,
  flourish: 2.6,
};
