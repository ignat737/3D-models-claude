// orc-palisade-tower.mjs — a 3 x 3 m orc watchtower for the orc palisade: a closed base of thick
// logs, a plank deck at 3.8 m on braces, a parapet of crooked charred-tip logs leaning out (one gap
// at the ladder), four poles under a crooked hide canopy, horns, a fire bowl, a tusked skull and a
// tattered team banner. Centred on the wall line like palisade-tower: an orc-palisade-segment or
// gate butts against any of its four faces. Static: one mesh, one palette material.
import { DEG, rotX, rotZ } from '../unit-glb.mjs';
import { PALETTE, banner, beam, box, brazier, horn, palisadeLog, rnd, skull, spike } from './orc-common.mjs';

const H = 1.5, R = 0.25, FLAT = R * Math.sqrt(3) / 2, DECK_Y = 3.6, FLOOR = DECK_Y + 0.2, DH = 1.8;
const BODY = ['wood', 'woodDark', 'woodLight'];
const col = (a, b) => BODY[(a + b) % 3];

const base = [
  ...[1, -1].flatMap(s => Array.from({ length: 6 }, (_, k) => ({ c: [-1.25 + 0.5 * k, DECK_Y / 2, s * (H - FLAT)], h: DECK_Y, r: [R, R], n: 6, color: col(k, s + 1) }))),
  ...[1, -1].flatMap(s => Array.from({ length: 4 }, (_, k) => ({ c: [s * (H - R), DECK_Y / 2, -0.75 + 0.5 * k], h: DECK_Y, r: [R, R], n: 6, color: col(k, s + 2) }))),
];

// Parapet: logs of uneven height round the deck edge, leaning outwards; a gap on -Z at the ladder.
const SIDES = [
  { n: 7, at: u => [u, DH - R], skip: () => false, rot: a => rotX(a) },
  { n: 5, at: u => [u, -(DH - R)], skip: u => Math.abs(u) < 0.55, rot: a => rotX(-a), us: 7 },
  { n: 5, at: u => [DH - R, u], skip: () => false, rot: a => rotZ(-a) },
  { n: 5, at: u => [-(DH - R), u], skip: () => false, rot: a => rotZ(a) },
];
const parapet = SIDES.flatMap((side, si) => {
  const count = side.us || side.n, span = si < 2 ? 3.0 : 2.0;
  return Array.from({ length: count }, (_, k) => -span / 2 + span * k / (count - 1)).filter(u => !side.skip(u)).flatMap((u, i) => {
    const [x, z] = side.at(u), h = 1.35 + 0.6 * rnd(si * 9 + i, 4), a = (6 + 6 * rnd(si, i)) * DEG, pivot = [x, FLOOR, z], q = side.rot(a);
    return [
      { c: [x, FLOOR + (h - 0.5) / 2, z], h: h - 0.5, r: [R, R], n: 6, q, pivot, color: col(i, si) },
      { c: [x, FLOOR + h - 0.25, z], h: 0.5, r: [R, 0.03], n: 6, q, pivot, color: 'char' },
    ];
  });
});

const braces = [[1, 0], [-1, 0], [0, 1], [0, -1]].flatMap(([dx, dz]) => [-0.9, 0.9].map(u => {
  const a = [dx ? dx * H : u, DECK_Y - 0.75, dz ? dz * H : u], b = [dx ? dx * (DH - 0.15) : u, DECK_Y - 0.02, dz ? dz * (DH - 0.15) : u];
  return beam(a, b, 0.16, 'woodDark');
}));

const LAD = { z0: -H - 1.1, z1: -DH - 0.05, y0: 0.04, y1: FLOOR + 0.9, w: 0.5 };
const ladder = [
  ...[-1, 1].map(s => beam([s * LAD.w, LAD.y0, LAD.z0], [s * LAD.w, LAD.y1, LAD.z1], 0.1, 'woodLight')),
  ...Array.from({ length: 8 }, (_, i) => {
    const t = (i + 0.7) / 8.6;
    return box([0, LAD.y0 + (LAD.y1 - LAD.y0) * t, LAD.z0 + (LAD.z1 - LAD.z0) * t], [LAD.w * 2, 0.06, 0.07], 'woodDark');
  }),
];

// Four poles hold a crooked canopy of hide; the horns and the fire sit on the corners.
const POLE = FLOOR + 2.3;
const PARTS = [
  box([0, 0.07, 0], [3.6, 0.14, 3.6], 'earth'),
  ...base,
  box([0, DECK_Y - 0.1, 0], [2 * DH - 0.3, 0.2, 0.22], 'woodDark'),
  box([0, DECK_Y - 0.1, 0], [0.22, 0.2, 2 * DH - 0.3], 'woodDark'),
  ...Array.from({ length: 6 }, (_, i) => box([0, DECK_Y + 0.1, -DH + (i + 0.5) * 2 * DH / 6], [2 * DH, 0.2, 2 * DH / 6 - 0.012], i % 2 ? 'woodLight' : 'wood')),
  ...braces, ...parapet, ...ladder,

  ...[1, -1].flatMap(sx => [1, -1].map(sz => ({ c: [sx * (DH - 0.35), (FLOOR + POLE) / 2, sz * (DH - 0.35)], h: POLE - FLOOR, r: [0.12, 0.1], n: 6, color: 'woodDark' }))),
  box([0, POLE + 0.1, 0], [3.5, 0.14, 3.5], 'hide', { q: rotZ(7 * DEG), pivot: [0, POLE + 0.1, 0] }),
  box([0.2, POLE + 0.34, 0], [1.4, 0.1, 1.4], 'hide', { q: rotZ(7 * DEG), pivot: [0.2, POLE + 0.34, 0] }),
  ...horn([DH - 0.3, POLE + 0.25, DH - 0.3], [1, 0.5, 1], 0.9),
  ...horn([-DH + 0.3, POLE + 0.4, DH - 0.3], [-1, 0.5, 1], 0.9),
  ...brazier(-DH + 0.5, FLOOR + 0.95, -DH + 0.5),

  // Trophies on the base and on the roof edge, a banner on the front.
  ...skull('z', 1, H, -1.15, 2.6, 1.2, true),
  ...skull('x', 1, H, 0, 2.6, 1.2, true),
  ...skull('z', 1, DH - 0.1, 0, FLOOR + 2.2, 1.0, true),
  ...banner('z', 1, H, 0.45, 3.3, 0.9, 1.6),
  ...[2, -2].flatMap(k => [spike([k * 0.55 - 0.1, 0.8, H], [0, 0.35, 1], 0.9, 0.08), spike([k * 0.55 + 0.1, 1.5, H], [0, 0.45, 1], 0.8, 0.08)]),
  box([DH - 0.3, FLOOR + 1.8, -DH + 0.3], [0.08, 3.6, 0.08], 'woodDark'),
  box([DH - 0.3 + 0.42, FLOOR + 3.2, -DH + 0.3], [0.7, 0.42, 0.04], 'team'),
  box([DH - 0.3 + 0.9, FLOOR + 3.15, -DH + 0.3], [0.3, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'orc-palisade-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.6,
};
