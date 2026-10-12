// orc-hut.mjs — an orc hut on a hexagonal plan: a low six-sided cabin of crooked dark logs with the
// ends left sticking out at the corners, a six-sided roof of stitched hide with bone hip ridges and a
// horn on every corner, a smoke hole with a glow and a pennant on top, a plank door under a skull, a
// shuttered window on two faces, spikes and a banner in the walls, a fire pit, skull stakes and a heap
// of firewood outside. The orc twin of the peasant house: 4.2 m across the flats, 4.85 m across the
// corners (the house is 4.2 x 3.2 m).
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the hexagon, the door faces +Z. A wall face
// is built once on the +Z side and turned by `spin` to the others (face k looks -60 * k degrees round).
import { DEG, PALETTE, banner, beam, box, door, firePit, hexLogs, horn, pennant, rock, skull, skullStake, spike, spin } from './orc-kit.mjs';

const A = 2.1;                                        // apothem: centre to the outer face of a wall
const PLINTH = 0.22, ROWS = 6, LOG_R = 0.22;
const SQ3 = Math.sqrt(3);
const walls = hexLogs({ A, y0: PLINTH, rows: ROWS, r: LOG_R, seed: 3 });
const TOP = walls.top;
const faceAngle = k => -60 * k * DEG;

// Roof: a six-sided pyramid, dark courses, bone hip ridges, a horn on every corner.
const EAVE = TOP + 0.1, ROOF_H = 2.0, RB = (A + 0.45) * 2 / SQ3, RT = 0.5;
const roofR = t => RB + (RT - RB) * t;
const corner = (r, y, a) => [r * Math.cos(a), y, r * Math.sin(a)];
const roof = [
  { c: [0, EAVE + ROOF_H / 2, 0], h: ROOF_H, r: [RB, RT], n: 6, color: 'hide' },
  { c: [0, EAVE - 0.05, 0], h: 0.2, r: [RB + 0.1, RB + 0.05], n: 6, color: 'woodDark' },
  ...[0.35, 0.7].map(t => ({ c: [0, EAVE + ROOF_H * t, 0], h: 0.1, r: [roofR(t) + 0.05, roofR(t) + 0.04], n: 6, color: 'woodDark' })),
  ...Array.from({ length: 6 }, (_, i) => beam(corner(RB, EAVE + 0.02, i * Math.PI / 3), corner(RT, EAVE + ROOF_H, i * Math.PI / 3), 0.16, 'bone')),
  ...Array.from({ length: 6 }, (_, i) => horn(corner(RB + 0.1, EAVE + 0.08, i * Math.PI / 3), [Math.cos(i * Math.PI / 3), 0.9, Math.sin(i * Math.PI / 3)], 0.9)).flat(),
];
const APEX = EAVE + ROOF_H;
const smoke = [
  { c: [0, APEX + 0.3, 0], h: 0.6, r: [0.5, 0.45], n: 6, color: 'stoneDark' },
  { c: [0, APEX + 0.65, 0], h: 0.1, r: [0.62, 0.62], n: 6, color: 'stone' },
  { c: [0, APEX + 0.9, 0], h: 0.5, r: [0.3, 0.02], n: 4, color: 'fire' },
  ...pennant(0, APEX + 0.5, -0.4, 1.0),
];

// A window on the +Z face: a frame, the opening, team hide flaps, a bone sill.
const windowAt = (u, y) => [
  box([u, y, A + 0.03], [0.7, 0.6, 0.06], 'woodDark'),
  box([u, y, A + 0.065], [0.46, 0.4, 0.04], 'slit'),
  ...[1, -1].map(s => box([u + s * 0.43, y, A + 0.08], [0.22, 0.58, 0.05], 'team')),
  box([u, y + 0.42, A + 0.14], [0.8, 0.1, 0.1], 'bone'),
];

const front = [
  ...door({ x: 0, face: A, y0: PLINTH, w: 0.95, h: 1.9, skullAt: false }),
  ...skull('z', 1, A + 0.12, 0, PLINTH + 2.3, 0.7, true),
  ...[-1.4, 1.4].map((x, i) => spike([x, 0.7 + 0.15 * i, A + 0.1], [0, 0.15, 1], 0.6, 0.06, 'bone')),
];
const windowFace = windowAt(0, 1.45);
const bannerFace = [...banner('z', 1, A + 0.1, 0, 2.0, 0.7, 1.2), ...[-0.9, 0.9].map((x, i) => spike([x, 0.8 + 0.2 * i, A + 0.1], [0, 0.15, 1], 0.7, 0.06, 'bone'))];

const PARTS = [
  { c: [0, PLINTH / 2, 0], h: PLINTH, r: [(A + 0.25) * 2 / SQ3, (A + 0.25) * 2 / SQ3], n: 6, color: 'stoneDark' },
  ...walls.parts,
  { c: [0, TOP + 0.03, 0], h: 0.14, r: [(A + 0.05) * 2 / SQ3, (A + 0.05) * 2 / SQ3], n: 6, color: 'woodDark' },
  ...roof,
  ...smoke,
  ...front,
  ...[1, 5].flatMap(k => spin(windowFace, faceAngle(k))),
  ...spin(bannerFace, faceAngle(3)),
  ...[2, 4].flatMap(k => spin([...skull('z', 1, A + 0.12, 0, 1.6, 0.6), spike([-0.9, 0.8, A + 0.1], [0, 0.15, 1], 0.7, 0.06, 'bone'), spike([0.9, 1.0, A + 0.1], [0, 0.15, 1], 0.7, 0.06, 'bone')], faceAngle(k))),
  // Out front: fire pit and skull stakes; a heap of firewood and rocks behind.
  ...firePit(-1.5, A + 1.2, 0.5),
  ...skullStake(1.9, A + 0.8, 1.4, 0.9),
  ...skullStake(0.3, A + 1.7, 1.0, 0.8),
  ...[0, 1, 2].map(i => ({ c: [-1.3 + i * 0.36, 0.14, -A - 0.7], h: 1.0, r: [0.14, 0.12], n: 5, q: [0, 0, Math.SQRT1_2, Math.SQRT1_2], color: ['wood', 'woodLight', 'woodDark'][i] })),
  ...[0, 1].map(i => ({ c: [-1.12 + i * 0.36, 0.38, -A - 0.7], h: 1.0, r: [0.14, 0.12], n: 5, q: [0, 0, Math.SQRT1_2, Math.SQRT1_2], color: ['woodDark', 'wood'][i] })),
  rock(1.0, -A - 0.8, 0.4, 0.45, 'stone', { turn: 20 }),
  rock(1.6, -A - 0.65, 0.28, 0.3, 'stoneDark', { turn: 50 }),
];

export default {
  name: 'orc-hut', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 170, previewZoom: 1.6, withAt: [-1.2, A + 2.8],
};
