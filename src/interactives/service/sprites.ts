export const PALETTE = {
  night: '#10132E', deep: '#0A0C1E', dusk: '#232A63', teal: '#1F6F74', amber: '#F2B138',
  sunset: '#E8622C', white: '#F1EFE6', grey: '#8B93A8', phosphor: '#5BD26B', danger: '#D8352A',
} as const

export interface Sprite {
  rows: string[]
  palette: Record<string, string>
}

const BASE: Record<string, string> = {
  k: PALETTE.night, g: PALETTE.grey, w: PALETTE.white, t: PALETTE.teal,
  a: PALETTE.amber, o: PALETTE.sunset, d: PALETTE.dusk, p: PALETTE.phosphor,
}

/** Drawn when a scenario has no sprite of its own. */
export const TOOLBOX: Sprite = {
  palette: BASE,
  rows: [
    '.....kkkkkk.....',
    '.....k....k.....',
    'kkkkkkkkkkkkkkkk',
    'kooooooooooooook',
    'kooooooooooooook',
    'kkkkkkkggkkkkkkk',
    'kooooooggooooook',
    'kooooooooooooook',
    'kooooooooooooook',
    'kkkkkkkkkkkkkkkk',
  ],
}

/** Keyed by scenario id. Drawn healthy: the picture never shows the fault. */
export const SPRITES: Record<string, Sprite> = {
  fan: {
    palette: BASE,
    rows: [
      '....kkkkkkkk....', '..kkggggggggkk..', '.kgg.g.gg.g.ggk.', '.kg.g.gkkg.g.gk.',
      'kgg..gkggkg..ggk', 'kg.ggkgwwgkgg.gk', 'kg.ggkgwwgkgg.gk', 'kgg..gkggkg..ggk',
      '.kg.g.gkkg.g.gk.', '.kgg.g.gg.g.ggk.', '..kkggggggggkk..', '....kkkkkkkk....',
      '.......kk.......', '.......kg.......', '.......kg.......', '.......kg.......',
      '.......kg.......', '.....kkkkkk.....', '...kggggggggk...', '...kkkkkkkkkk...',
    ],
  },
  // Electric flat iron: handle at the back, soleplate tapering to a point.
  'flat-iron': {
    palette: BASE,
    rows: [
      '......kkkk......',
      '......k..k......',
      '......k..k......',
      '.....kkkkkk.....',
      '..kggggwg.......',
      '..kggggggwgk....',
      '..kggggggggkk...',
      '..kggggggggggk..',
      '..kkkkkkkkkkkkk.',
    ],
  },
  // Rechargeable LED lamp: carry handle, wide lit panel, flat foot.
  lamp: {
    palette: BASE,
    rows: [
      '......kkkk......',
      '......k..k......',
      '.....kkkkkk.....',
      '...kggggggggk...',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '...kggggggggk...',
      '.....kkkkkk.....',
    ],
  },
  // CCTV camera: bullet body, lens ring at the front, on a wall bracket.
  cctv: {
    palette: BASE,
    rows: [
      '..kkkkkkkkkkk...',
      '..kgggggggggk...',
      '.kdgggggggggk...',
      '.kdgggggggggk...',
      '..kgggggggggk...',
      '..kkkkkkkkkkk...',
      '......kkkk......',
      '.......kk.......',
      '.....kkkkkk.....',
    ],
  },
  // Fire alarm zone: round bell on a panel, phosphor zone lamp below.
  'fas-zone': {
    palette: BASE,
    rows: [
      '...kkkkkkkkkk...',
      '...kddddddddk...',
      '...kdddgggddk...',
      '...kdddgggddk...',
      '...kddddddddk...',
      '...kkkkkkkkkk...',
      '......kkkk......',
      '...kkkkkkkkkk...',
      '...kppdddddkk...',
      '...kkkkkkkkkk...',
    ],
  },
  // Audio amplifier: box with two knobs and a phosphor power lamp.
  amp: {
    palette: BASE,
    rows: [
      '.kkkkkkkkkkkkkk.',
      '.kddddddddddddk.',
      '.kddgggdddgggdk.',
      '.kddgggdddgggdk.',
      '.kdddddddddddpk.',
      '.kkkkkkkkkkkkkk.',
    ],
  },
  // Flat screen television: thin panel on a stand, dusk screen.
  tv: {
    palette: BASE,
    rows: [
      '.kkkkkkkkkkkkkk.',
      '.kddddddddddddk.',
      '.kddddddddddddk.',
      '.kddddddddddddk.',
      '.kkkkkkkkkkkkkk.',
      '.......kk.......',
      '....kkkkkkkk....',
    ],
  },
  // Motor control board: teal board, a relay, a terminal strip.
  'motor-control': {
    palette: BASE,
    rows: [
      '.kkkkkkkkkkkkkk.',
      '.kttttttttttttk.',
      '.ktkkkktggtkkkk.',
      '.ktkkkktggtkkkk.',
      '.kttttttttttttk.',
      '.kkgkgkgkgkgkkk.',
      '.kkkkkkkkkkkkkk.',
    ],
  },
}

export function spriteFor(scenarioId: string): Sprite {
  return SPRITES[scenarioId] ?? TOOLBOX
}
