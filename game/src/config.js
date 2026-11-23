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
// play. FOCUS pulls those rails away and re-budgets the bare 1280x720 the court is left
// with: the hearth row and the life numerals take the space, the two hands give some back,
// and every row is separated by a gutter nothing may cross -- so the court reads from
// across the room and survives being shrunk to a thumbnail. TAB swaps between them in
// play; the table still is taken in FOCUS.
// Only presentation moves: the deck, the rules and the rival all behave identically.

export const DRESS = { mode: 'rails', rails: true, lifeNumeral: 80, verdict: 1, tell: 1, handArc: 2.6 };

const DRESSINGS = {
  rails: {
    rails: true,
    lifeNumeral: 80,
    verdict: 1,
    tell: 1,
    handArc: 2.6,
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
  // FOCUS is budgeted as four bands down the 720: her hand, her side of the hearths, your
  // side of the hearths, your hand. Nothing is allowed to touch its neighbour or the frame
  // edge, because the court has to survive being shrunk to a thumbnail -- a card clipped by
  // the top edge or a hand card resting on a hearth card turns the whole table to mush.
  // The hearth row is the biggest thing on the table; the two hands read a size below it.
  focus: {
    rails: false,
    lifeNumeral: 132,
    verdict: 1,
    tell: 1.45,
    // a flatter fan: a steep arc is charm at full size and overflow at the frame edge
    handArc: 0.9,
    scale: { playerHand: 0.74, rivalHand: 0.66, hearth: 0.84 },
    zone: {
      // her hand  16 .. 153
      rivalHandY: 16,
      rivalHandStep: 116,
      // her hearth row 170 .. 345, then a 25px seam, then your hearth row 370 .. 545.
      // That seam is the load-bearing gap: it is wide enough for the verdict badge to
      // sit between the two cards instead of across them, so no chip ever touches a rank.
      hearthRivalY: 170,
      hearthSeamY: 357,
      hearthPlayerY: 370,
      // your hand 556 .. 713
      playerHandY: 556,
      playerHandStep: 136,
      hearthCentersX: [310, 640, 970],
      hearthPlateW: 252,
      // the two life blocks take the corners the hearth row cannot reach
      rivalLife: { x: 966, y: 8, w: 302, h: 156 },
      playerLife: { x: 12, y: 552, w: 296, h: 158 },
      turnBanner: { x: 16, y: 14, w: 216, h: 52 },
      // the stock and the ash take the left flank the hearth row cannot reach, where they
      // weigh against the banner above them instead of crowding your hand
      deckStack: { cx: 92, cy: 266 },
      discardStack: { cx: 92, cy: 408 },
      // a banked card has to come to rest clear of the piles and the opened-up hands
      rivalBank: { cx: 1192, cy: 300 },
      playerBank: { cx: 1192, cy: 462 },
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
  DRESS.handArc = preset.handArc;
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
