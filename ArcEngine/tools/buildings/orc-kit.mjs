// orc-kit.mjs — helpers shared by the orc buildings (orc-hut, orc-barracks, orc-fortress, orc-smithy,
// orc-sawmill, orc-troll-lair). The palette and the orcish details (spikes, skulls, hide banners,
// horns, braziers) come from the orc fortifications in tools/defense/orc-common.mjs, so a building
// and a wall look like one people's work. Model space as everywhere: meters, feet at y = 0, the
// front (door) faces +Z, a roof ridge runs along X.
import { DEG, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { PALETTE, banner, beam, box, brazier, faceSpike, horn, onFace, pointed, rnd, skull, slit, spike, spikeRows } from '../defense/orc-common.mjs';

export { PALETTE, banner, beam, box, brazier, faceSpike, horn, onFace, pointed, rnd, skull, slit, spike, spikeRows };

const BODY = ['wood', 'woodDark', 'woodLight'];
export const logColor = i => BODY[((i % 3) + 3) % 3];

// A crooked log (hexagon, a vertex up, a little thinner at one end) along X / along Z.
export const logX = (x0, x1, y, z, r, color) => ({ c: [(x0 + x1) / 2, y, z], h: x1 - x0, r: [r, r * 0.9], n: 6, q: rotZ(90 * DEG), color });
export const logZ = (z0, z1, y, x, r, color) => ({ c: [x, y, (z0 + z1) / 2], h: z1 - z0, r: [r, r * 0.9], n: 6, q: qmul(rotX(90 * DEG), rotY(30 * DEG)), color });

// Log-cabin walls on a footprint 2hx x 2hz from y0: `rows` courses, ends stick out at the corners.
// The outer face of the wall is at hx / hz. Returns { parts, top } (top: height of the last log).
export function logWalls({ hx, hz, y0, rows, r, seed = 0, over = 0.22, core = 'char' }) {
  const flat = r * Math.sqrt(3) / 2, pitch = 1.8 * r, parts = [];
  const top = y0 + 2 * r + (rows - 1) * pitch;
  parts.push(box([0, (y0 + top) / 2, 0], [2 * (hx - flat), top - y0, 2 * (hz - flat)], core));
  for (let k = 0; k < rows; k++) {
    const y = y0 + r + k * pitch;
    for (const s of [1, -1]) {
      const e = over * (0.6 + 0.8 * rnd(seed + k, s + 3)), c = logColor(k + seed + (s > 0 ? 0 : 1));
      if (k % 2 === 0) parts.push(logX(-hx - e, hx + e, y, s * (hz - flat), r, c));
      else parts.push(logZ(-hz - e, hz + e, y, s * (hx - flat), r, c));
    }
  }
  return { parts, top };
}

// The orc door in the front wall (z = face): a heavy frame, a hide flap with an iron strap and a
// red hand, a lintel, and a tusked skull over it. Opening w x h, floor at y0.
export function door({ x, face, y0 = 0, w, h, skullAt = true, double = false }) {
  const parts = [
    box([x, y0 + h + 0.15, face + 0.08], [w + 0.7, 0.3, 0.2], 'woodDark'),
    ...[1, -1].map(s => box([x + s * (w / 2 + 0.17), y0 + h / 2 + 0.05, face + 0.08], [0.34, h + 0.1, 0.2], 'woodDark')),
    box([x, y0 + h / 2, face + 0.04], [w, h, 0.08], 'slit'),
  ];
  if (double) {
    for (const s of [1, -1]) {
      parts.push(box([x + s * w / 4, y0 + h / 2, face + 0.1], [w / 2 - 0.04, h - 0.08, 0.08], s > 0 ? 'wood' : 'woodLight'));
      for (const y of [0.3, 0.55, 0.8]) parts.push(box([x + s * w / 4, y0 + h * y, face + 0.16], [w / 2 - 0.06, 0.12, 0.04], 'iron'));
    }
    parts.push(box([x, y0 + h * 0.5, face + 0.19], [0.1, h - 0.1, 0.05], 'iron'));
  } else {
    parts.push(
      box([x, y0 + h / 2 - 0.05, face + 0.1], [w - 0.06, h - 0.14, 0.08], 'hide'),
      box([x, y0 + h * 0.75, face + 0.16], [w - 0.06, 0.12, 0.04], 'iron'),
      box([x, y0 + h * 0.3, face + 0.16], [w - 0.06, 0.12, 0.04], 'iron'),
    );
  }
  parts.push(box([x - w * 0.2, y0 + h * 0.52, face + 0.2], [0.26, 0.3, 0.03], 'red'));
  if (skullAt) parts.push(...skull('z', 1, face + 0.12, x, y0 + h + 0.55, 1.1, true));
  return parts;
}

// Two crossed bone horns on a gable apex at (x, y), pointing outwards (side = +1 / -1).
export const gableHorns = (x, y, side) => horn([x, y, 0], [side, 0.9, 0], 1.3);

// A pole with a ragged team pennant.
export const pennant = (x, y0, z, h = 1.6) => [
  box([x, y0 + h / 2, z], [0.08, h, 0.08], 'woodDark'),
  box([x, y0 + h - 0.3, z + 0.45], [0.04, 0.5, 0.82], 'team'),
  box([x, y0 + h - 0.38, z + 0.95], [0.04, 0.3, 0.3], 'teamDark'),
  box([x, y0 + h - 0.62, z + 0.38], [0.04, 0.22, 0.4], 'team'),
];

// A skull on a stake at (x, z).
export const skullStake = (x, z, h = 1.5, s = 1) => [
  box([x, h / 2, z], [0.1, h, 0.1], 'woodDark'),
  ...skull('z', 1, z - 0.12 * s, x, h + 0.12 * s, s, true),
];

// A boulder: a squashed five-sided frustum, turned about Y; sits on the ground at y0.
export const rock = (x, z, r, h, color = 'stone', { y0 = 0, turn = 0, top = 0.7, sq = 0.8 } = {}) =>
  ({ c: [x, y0 + h / 2, z], h, r: [r, r * top], n: 5, sq, q: rotY(turn * DEG), color });

// An axe on a rack: handle and a broad iron head.
export const axe = (x, y, z, { len = 1.1, tilt = 0, color = 'iron' } = {}) => {
  const q = rotZ(tilt * DEG), pivot = [x, y, z];
  return [
    box([x, y, z], [0.07, len, 0.07], 'woodDark', { q, pivot }),
    box([x + 0.16, y + len / 2 - 0.12, z], [0.34, 0.3, 0.05], color, { q, pivot }),
    box([x + 0.34, y + len / 2 - 0.12, z], [0.06, 0.4, 0.05], color, { q, pivot }),
  ];
};

// A war drum: a hide-topped barrel with bone pegs round the rim and two sticks.
export const drum = (x, z, r = 0.55, h = 0.8) => [
  { c: [x, h / 2, z], h, r: [r * 0.85, r], n: 8, color: 'wood' },
  { c: [x, h + 0.04, z], h: 0.08, r: [r * 1.02, r * 1.02], n: 8, color: 'hide' },
  { c: [x, h * 0.25, z], h: 0.08, r: [r * 0.93, r * 0.93], n: 8, color: 'iron' },
  { c: [x, h * 0.8, z], h: 0.08, r: [r * 1.03, r * 1.03], n: 8, color: 'iron' },
  ...[0, 2, 4, 6].map(i => spike([x + Math.cos(i * Math.PI / 4) * r * 0.95, h * 0.55, z + Math.sin(i * Math.PI / 4) * r * 0.95], [Math.cos(i * Math.PI / 4), 0.2, Math.sin(i * Math.PI / 4)], 0.3, 0.05, 'bone')),
];

// A pile of bones and skulls on the ground at (x, z).
export const bonePile = (x, z, s = 1) => [
  ...[[0, 0, 0.5], [0.35, 0.2, 0.3], [-0.3, -0.25, 0.4], [0.1, -0.35, 0.25]].map(([dx, dz, l], i) =>
    box([x + dx * s, 0.07 * s + 0.05 * i, z + dz * s], [0.12 * s, 0.12 * s, l * s], 'bone', { q: rotY((i * 55 + 20) * DEG), pivot: [x + dx * s, 0.07 * s, z + dz * s] })),
  box([x, 0.18 * s, z + 0.05 * s], [0.34 * s, 0.26 * s, 0.3 * s], 'bone'),
  box([x - 0.07 * s, 0.22 * s, z + 0.21 * s], [0.08 * s, 0.08 * s, 0.03], 'slit'),
  box([x + 0.07 * s, 0.22 * s, z + 0.21 * s], [0.08 * s, 0.08 * s, 0.03], 'slit'),
];

// A fire pit: a ring of stones with embers and a flame.
export const firePit = (x, z, r = 0.5) => [
  { c: [x, 0.06, z], h: 0.12, r: [r, r * 0.9], n: 6, color: 'stoneDark' },
  { c: [x, 0.14, z], h: 0.08, r: [r * 0.72, r * 0.72], n: 6, color: 'char' },
  { c: [x, 0.38, z], h: 0.5, r: [r * 0.45, 0.02], n: 4, color: 'fire' },
  ...[0, 1, 2, 3, 4].map(i => rock(x + Math.cos(i * 1.26) * r * 0.95, z + Math.sin(i * 1.26) * r * 0.95, 0.15, 0.2, 'stone', { turn: i * 40 })),
];

export { DEG, qmul, rotX, rotY, rotZ };
