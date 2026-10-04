// palisade-tower.mjs — a 3 x 3 m watchtower for the palisade: a closed log base, a plank deck at
// 3.5 m that overhangs on braces, a sharpened log parapet with a gap at the ladder, four corner
// posts under a shingled roof, team shields and a pennant. Archers stand on the deck.
// Palisade segments (palisade-segment.mjs) end flush against any of its four faces: the tower is
// centred on the wall line, so a straight run, a corner and a T all use the same model.
// Model space: meters, feet at y = 0, origin at the centre of the footprint; the ladder is on -Z.
import { DEG, fromTo, rotY } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'wood', hex: '#7a5632' },
  { name: 'woodDark', hex: '#5e4125' },
  { name: 'woodLight', hex: '#a37a48' },
  { name: 'cut', hex: '#d2b078' },
  { name: 'rail', hex: '#4a331e' },
  { name: 'earth', hex: '#6b5a3f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'shingle', hex: '#8a4a32' },
];

const SIDE = 3.0, H = SIDE / 2;               // footprint
const R = 0.25, PITCH = 2 * R;                 // thicker logs than the wall's: the triangle budget
const DECK_Y = 3.4, DECK_T = 0.2, DECK_H = 1.8, FLOOR = DECK_Y + DECK_T;
const PARAPET = 1.35, TIP = 0.45;
const POST_TOP = FLOOR + 2.2, ROOF_Y = POST_TOP;
const BODY = ['wood', 'woodDark', 'woodLight'];

const box = (c, s, color, extra) => ({ c, s, color, ...extra });

// A beam along the line a -> b (model space), square section w.
function beam(a, b, w, color) {
  const d = b.map((v, k) => v - a[k]), len = Math.hypot(...d), c = a.map((v, k) => (v + b[k]) / 2);
  return box(c, [w, w, len], color, { q: fromTo([0, 0, 1], d), pivot: c });
}

// Positions along a side of length len, one log per pitch (centres), skipping those in `skip`.
const row = (len, skip = () => false) => {
  const n = Math.round(len / PITCH);
  return Array.from({ length: n }, (_, i) => -len / 2 + (i + 0.5) * len / n).filter(u => !skip(u));
};
// The four sides: [a, b] -> world (x, z) of a point u along the side at distance d from the centre.
const SIDES = [
  (u, d) => [u, d],        // +Z
  (u, d) => [u, -d],       // -Z (the ladder)
  (u, d) => [d, u],        // +X
  (u, d) => [-d, u],       // -X
];

// Closed log base up to the deck: the Z faces in full, the X faces between them.
const base = [
  ...[1, -1].flatMap(s => row(SIDE).map((u, i) => ({ c: [u, DECK_Y / 2, s * (H - R)], h: DECK_Y, r: [R, R], n: 6, color: BODY[i % 3] }))),
  ...[1, -1].flatMap(s => row(SIDE - 2 * PITCH).map((u, i) => ({ c: [s * (H - R), DECK_Y / 2, u], h: DECK_Y, r: [R, R], n: 6, color: BODY[(i + 1) % 3] }))),
];

// Parapet: sharpened logs of uneven height round the deck edge; three are left out at the ladder.
const PH = [PARAPET, PARAPET + 0.15, PARAPET - 0.1, PARAPET + 0.05];
const parapet = SIDES.flatMap((side, si) => {
  const us = row(2 * DECK_H - 2 * PITCH * (si < 2 ? 0 : 1), u => si === 1 && Math.abs(u) < 0.55);
  return us.flatMap((u, i) => {
    const [x, z] = side(u, DECK_H - R - 0.02), h = PH[(i + si) % 4];
    return [
      { c: [x, FLOOR + (h - TIP) / 2, z], h: h - TIP, r: [R, R], n: 6, color: BODY[(i + si) % 3] },
      { c: [x, FLOOR + h - TIP / 2, z], h: TIP, r: [R, 0.035], n: 6, color: 'cut' },
    ];
  });
});

// Overhang braces from the base wall up to the deck beams, two on each side.
const braces = SIDES.flatMap(side => [-0.9, 0.9].map(u => {
  const [x1, z1] = side(u, H), [x2, z2] = side(u, DECK_H - 0.15);
  return beam([x1, DECK_Y - 0.75, z1], [x2, DECK_Y - 0.02, z2], 0.14, 'rail');
}));

// Ladder on -Z: two rails and rungs, leaning against the base up to the gap in the parapet.
const LAD = { z0: -H - 1.0, z1: -DECK_H - 0.05, y0: 0.04, y1: FLOOR + 0.9, w: 0.5 };
const ladder = [
  ...[-1, 1].map(s => beam([s * LAD.w, LAD.y0, LAD.z0], [s * LAD.w, LAD.y1, LAD.z1], 0.1, 'woodLight')),
  ...Array.from({ length: 9 }, (_, i) => {
    const t = (i + 0.7) / 9.6;
    return box([0, LAD.y0 + (LAD.y1 - LAD.y0) * t, LAD.z0 + (LAD.z1 - LAD.z0) * t], [LAD.w * 2, 0.06, 0.07], 'rail');
  }),
];

const PARTS = [
  box([0, 0.06, 0], [SIDE + 0.5, 0.12, SIDE + 0.5], 'earth'),
  ...base,

  // Deck beams, planks and the edge board.
  box([0, DECK_Y - 0.1, 0], [2 * DECK_H - 0.3, 0.2, 0.22], 'rail'),
  box([0, DECK_Y - 0.1, 0], [0.22, 0.2, 2 * DECK_H - 0.3], 'rail'),
  ...Array.from({ length: 6 }, (_, i) => box([0, DECK_Y + DECK_T / 2, -DECK_H + (i + 0.5) * 2 * DECK_H / 6], [2 * DECK_H, DECK_T, 2 * DECK_H / 6 - 0.012], i % 2 ? 'woodLight' : 'cut')),
  ...braces,

  ...parapet,
  ...ladder,

  // Corner posts carry the roof.
  ...[1, -1].flatMap(sx => [1, -1].map(sz => ({ c: [sx * (DECK_H - 0.2), (FLOOR + POST_TOP) / 2, sz * (DECK_H - 0.2)], h: POST_TOP - FLOOR, r: [0.2, 0.2], n: 6, color: 'rail' }))),
  // Shingled roof: a four-sided pyramid with a ridge cap.
  { c: [0, ROOF_Y + 0.45, 0], h: 0.9, r: [2.85, 0.1], n: 4, q: rotY(45 * DEG), color: 'shingle' },
  { c: [0, ROOF_Y + 0.93, 0], h: 0.1, r: [0.16, 0.16], n: 6, color: 'woodDark' },

  // Team colour: shields on the parapet and a pennant on the roof.
  ...[0.75, -0.75].flatMap(u => [
    box([u, FLOOR + 0.62, DECK_H + 0.03], [0.55, 0.55, 0.05], 'team'),
    box([u, FLOOR + 0.62, DECK_H + 0.065], [0.2, 0.2, 0.04], 'teamDark'),
    box([u, FLOOR + 0.62, -DECK_H - 0.03], [0.55, 0.55, 0.05], 'team'),
    box([u, FLOOR + 0.62, -DECK_H - 0.065], [0.2, 0.2, 0.04], 'teamDark'),
    box([DECK_H + 0.03, FLOOR + 0.62, u], [0.05, 0.55, 0.55], 'team'),
    box([DECK_H + 0.065, FLOOR + 0.62, u], [0.04, 0.2, 0.2], 'teamDark'),
    box([-DECK_H - 0.03, FLOOR + 0.62, u], [0.05, 0.55, 0.55], 'team'),
    box([-DECK_H - 0.065, FLOOR + 0.62, u], [0.04, 0.2, 0.2], 'teamDark'),
  ]),
  box([0, ROOF_Y + 1.35, 0], [0.07, 0.9, 0.07], 'woodLight'),
  box([0.4, ROOF_Y + 1.6, 0], [0.7, 0.4, 0.04], 'team'),
  box([0.86, ROOF_Y + 1.6, 0], [0.24, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'palisade-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.4,
};
