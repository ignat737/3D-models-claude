// orc-troll-lair.mjs — a troll lair: a mound of rough black boulders with a cave mouth big enough for a
// 2.5 m troll (3.2 m wide, 3.1 m high; a dark hollow with embers inside) framed by two slab jambs and
// a heavy lintel under a giant tusked skull, giant curved tusks flanking it, skulls on the jambs,
// spiked clubs leaning on the stones, a fire pit, braziers, heaps of gnawed bones, a ring of sharpened
// stakes, two tall poles with pennants in the team colours.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the mound, the cave mouth faces +Z.
import { DEG, PALETTE, bonePile, box, brazier, firePit, pennant, rnd, rock, rotY, rotZ, skull, spike } from './orc-kit.mjs';

const MOUTH = { w: 3.2, h: 3.1, z: 2.0 };         // opening width, height (a 2.5 m troll walks in), front plane of the jambs
const MOUND_Z = -6.2;                             // centre of the mound; its front stands just behind the cave mouth

// A giant tusk standing at x: up and out, then curving back in over the entrance.
const tusk = (x, z, s) => {
  const base = [x, 0.1, z], d1 = [-s * 0.18, 1, 0.05], l1 = 4.4;
  const tip = base.map((v, k) => v + d1[k] / Math.hypot(...d1) * l1 * 0.96);
  return [spike(base, d1, l1, 0.3, 'bone'), spike(tip, [-s * 0.7, 0.8, 0.05], 2.6, 0.18, 'bone')];
};

// A spiked club leaning on a stone.
const club = (x, z, lean) => {
  const q = rotZ(lean * DEG), pivot = [x, 0.04, z];
  return [
    { c: [x, 1.34, z], h: 2.6, r: [0.12, 0.34], n: 5, q, pivot, color: 'woodDark' },
    ...[0, 1, 2].map(i => ({ c: [x + (i - 1) * 0.26, 2.3, z + 0.26 * (i % 2 ? 1 : 0.6)], h: 0.34, r: [0.08, 0.015], n: 4, color: 'bone', q: rotZ(lean * DEG + (i - 1) * 40 * DEG), pivot })),
  ];
};

// A boulder on the mound: turned, a little squashed, at height y0.
const boulder = (x, z, r, h, y0, color, turn) => rock(x, z, r, h, color, { y0, turn });

const PARTS = [
  { c: [0, 0.04, 0.4], h: 0.08, r: [9.4, 9.4], n: 12, color: 'earth' },

  // The mound: four tiers of boulders, tall and wide behind the mouth, broken up by boulders on every tier.
  { c: [0, 2.2, MOUND_Z], h: 4.4, r: [7.6, 6.8], n: 9, sq: 0.9, color: 'stone' },
  { c: [0.2, 5.8, MOUND_Z - 0.4], h: 3.4, r: [6.2, 4.6], n: 8, sq: 0.9, color: 'stoneDark' },
  { c: [-0.2, 8.9, MOUND_Z - 0.6], h: 3.0, r: [4.6, 2.8], n: 7, color: 'stone' },
  { c: [0, 11.1, MOUND_Z - 0.6], h: 2.0, r: [2.8, 1.0], n: 6, color: 'stoneLight' },
  // Foot boulders round the base, bigger at the sides of the mouth.
  boulder(-6.0, -1.2, 2.2, 3.6, 0, 'stoneDark', 10), boulder(6.1, -1.0, 2.4, 3.9, 0, 'stone', 40),
  boulder(-6.8, -5.0, 2.5, 3.4, 0, 'stone', 25), boulder(6.9, -5.2, 2.4, 3.6, 0, 'stoneDark', 5),
  boulder(-5.0, -10.2, 2.6, 3.4, 0, 'stoneDark', 50), boulder(5.2, -10.4, 2.7, 3.8, 0, 'stone', 15),
  boulder(0, -13.4, 2.8, 3.4, 0, 'stone', 35),
  // Boulders on the slopes.
  boulder(-3.9, -2.6, 1.6, 1.8, 4.0, 'stoneLight', 20), boulder(4.1, -2.3, 1.5, 1.7, 4.2, 'stone', 70),
  boulder(-5.0, -6.8, 1.9, 2.2, 4.2, 'stone', 45), boulder(5.2, -7.0, 1.8, 2.0, 4.5, 'stoneLight', 12),
  boulder(-2.6, -9.0, 1.9, 2.0, 6.0, 'stoneDark', 33), boulder(2.8, -8.8, 1.8, 2.2, 6.2, 'stone', 58),
  boulder(0.2, -3.6, 2.2, 2.0, 7.4, 'stoneDark', 30), boulder(-1.4, -6.6, 1.4, 1.5, 9.4, 'stoneLight', 80),
  boulder(1.8, -7.4, 1.2, 1.3, 9.8, 'stone', 20),
  boulder(-3.0, -4.6, 1.2, 1.2, 7.2, 'stoneLight', 50), boulder(3.2, -5.0, 1.3, 1.2, 7.6, 'stone', 15),

  // Cave mouth: two slab jambs, a heavy lintel, the dark hollow with embers; a boulder cap above it.
  box([-(MOUTH.w / 2 + 0.8), 2.3, 1.0], [1.6, 4.6, 2.0], 'stoneDark', { q: rotY(5 * DEG) }),
  box([MOUTH.w / 2 + 0.8, 2.3, 1.0], [1.6, 4.6, 2.0], 'stone', { q: rotY(-5 * DEG) }),
  box([0, MOUTH.h + 0.6, 1.0], [MOUTH.w + 3.2, 1.2, 2.0], 'stone', { q: rotZ(1.5 * DEG) }),
  box([0, MOUTH.h / 2, 0.7], [MOUTH.w, MOUTH.h, 0.3], 'slit'),
  box([0, 0.05, 1.2], [MOUTH.w, 0.1, 1.6], 'char'),
  { c: [0.2, 0.3, 1.25], h: 0.6, r: [0.35, 0.02], n: 4, color: 'fire' },
  box([-0.9, 0.12, 1.0], [0.7, 0.07, 0.4], 'red'),
  boulder(0, 1.4, 2.4, 1.6, 4.2, 'stoneDark', 22),
  ...skull('z', 1, MOUTH.z, 0, MOUTH.h + 0.8, 3.0, true),
  ...[-1, 1].flatMap(s => skull('z', 1, MOUTH.z, s * (MOUTH.w / 2 + 0.8), 2.4, 1.2, true)),

  // Tusks, poles with pennants, braziers, clubs.
  ...tusk(-5.0, 1.8, 1), ...tusk(5.0, 1.8, -1),
  ...pennant(-6.2, 0, 4.0, 6.4), ...pennant(6.2, 0, 4.0, 6.4),
  ...brazier(-2.6, 0.7, 3.6), ...brazier(2.6, 0.7, 3.6),
  ...club(-3.7, 2.9, -8), ...club(3.6, 3.1, 8),

  // The yard in front: a fire, bones, stakes, scattered rocks.
  ...firePit(0, 5.0, 0.9),
  ...bonePile(-2.6, 5.9, 1.8),
  ...bonePile(2.9, 5.6, 1.4),
  ...[-5.6, -4.4, -3.2, 3.2, 4.4, 5.6].map((x, i) => spike([x, 0.05, 7.0 - Math.abs(x) * 0.25], [x * 0.03, 1, 0.3], 1.6 + 0.5 * rnd(i, 2), 0.14, 'woodDark')),
  rock(-5.6, 5.2, 0.5, 0.55, 'stone', { turn: 30 }), rock(5.6, 5.8, 0.45, 0.45, 'stoneDark', { turn: 65 }),
];

export default {
  name: 'orc-troll-lair', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 700, previewZoom: 2.0, withAt: [0, 3.6],
};
