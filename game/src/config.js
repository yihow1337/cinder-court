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
  controlHint: { x: 1048, y: 524, w: 224, h: 74 },
};

// --- court dressing --------------------------------------------------------
// The same table can be set two ways. RAILS is the full court, with the cycle wheel, the
// deck and ash piles, the court's law, the log and the control hints laid around the
// play. FOCUS pulls those rails away and reflows what is left -- hands, hearths, verdict
// badges and life numerals all grow into the freed width -- so the court reads from
// across the room. TAB swaps between them in play; the table still is taken in FOCUS.
// Only presentation moves: the deck, the rules and the rival all behave identically.

export const DRESS = { mode: 'rails', rails: true, lifeNumeral: 80, verdict: 1, tell: 1 };

const DRESSINGS = {
  rails: {
    rails: true,
    lifeNumeral: 80,
    verdict: 1,
    tell: 1,
    scale: { playerHand: 0.92, rivalHand: 0.76, hearth: 0.7 },
    zone: {
      rivalHandY: 8,
      rivalHandStep: 104,
      playerHandY: 516,
      playerHandStep: 130,
      hearthCentersX: [340, 640, 940],
      hearthRivalY: 172,
      hearthPlayerY: 360,
      hearthSeamY: 339,
      hearthPlateW: 212,
      rivalLife: { x: 992, y: 10, w: 278, h: 140 },
      playerLife: { x: 10, y: 548, w: 278, h: 164 },
      turnBanner: { x: 1048, y: 168, w: 224, h: 62 },
      deckStack: { cx: 62, cy: 366 },
      discardStack: { cx: 170, cy: 366 },
      rivalBank: { cx: 86, cy: 86 },
      playerBank: { cx: 1196, cy: 650 },
    },
  },
  focus: {
    rails: false,
    lifeNumeral: 132,
    verdict: 1.4,
    tell: 1.45,
    scale: { playerHand: 0.94, rivalHand: 0.8, hearth: 0.8 },
    zone: {
      rivalHandY: 14,
      rivalHandStep: 126,
      playerHandY: 524,
      playerHandStep: 150,
      hearthCentersX: [300, 640, 980],
      hearthRivalY: 164,
      hearthPlayerY: 344,
      hearthSeamY: 336,
      hearthPlateW: 248,
      rivalLife: { x: 998, y: 8, w: 272, h: 170 },
      playerLife: { x: 10, y: 528, w: 272, h: 184 },
      turnBanner: { x: 16, y: 12, w: 216, h: 52 },
      deckStack: { cx: 1104, cy: 638 },
      discardStack: { cx: 1210, cy: 638 },
      // a banked card has to come to rest clear of the piles and the opened-up hands
      rivalBank: { cx: 78, cy: 242 },
      playerBank: { cx: 1198, cy: 470 },
    },
  },
};

/** Re-dress the court in place, so every module holding ZONE or SCALE follows along. */
export function setDressing(mode) {
  const preset = DRESSINGS[mode] ?? DRESSINGS.rails;
  DRESS.mode = DRESSINGS[mode] ? mode : 'rails';
  DRESS.rails = preset.rails;
  DRESS.lifeNumeral = preset.lifeNumeral;
  DRESS.verdict = preset.verdict;
  DRESS.tell = preset.tell;
  Object.assign(SCALE, preset.scale);
  Object.assign(ZONE, preset.zone);
  return DRESS.mode;
}

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
