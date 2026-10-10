// orc-troll-lair.mjs — a troll lair: a mound of rough black boulders with a cave mouth big enough for a
// 2.5 m troll (3.6 m wide, 3.4 m high; a dark hollow with embers inside) framed by two slab jambs and
// a heavy lintel under a giant tusked skull, giant curved tusks flanking it, skulls on the jambs,
// spiked clubs leaning on the stones, a fire pit, braziers, heaps of gnawed bones, a ring of sharpened
// stakes, two tall poles with pennants in the team colours.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the mound, the cave mouth faces +Z.
import { DEG, PALETTE, bonePile, box, brazier, firePit, pennant, rnd, rock, rotY, rotZ, skull, spike } from './orc-kit.mjs';

const MOUTH = { w: 3.6, h: 3.4, z: 2.2 };         // opening width, height, front plane of the jambs
const stone = ['stone', 'stoneDark', 'stoneLight'];

// A giant tusk standing at x: up and out, then curving back in over the entrance.
const tusk = (x, z, s) => {
  const base = [x, 0.05, z], d1 = [-s * 0.18, 1, 0.05], l1 = 3.0;
  const tip = base.map((v, k) => v + d1[k] / Math.hypot(...d1) * l1 * 0.96);
  return [spike(base, d1, l1, 0.23, 'bone'), spike(tip, [-s * 0.7, 0.8, 0.05], 1.9, 0.14, 'bone')];
};

// A spiked club leaning on a stone.
const club = (x, z, lean) => {
  const q = rotZ(lean * DEG), pivot = [x, 0.04, z];
  return [
    { c: [x, 1.04, z], h: 2.0, r: [0.1, 0.28], n: 5, q, pivot, color: 'woodDark' },
    ...[0, 1, 2].map(i => ({ c: [x + (i - 1) * 0.22, 1.75, z + 0.22 * (i % 2 ? 1 : 0.6)], h: 0.3, r: [0.07, 0.015], n: 4, color: 'bone', q: rotZ(lean * DEG + (i - 1) * 40 * DEG), pivot })),
  ];
};

const PARTS = [
  { c: [0, 0.04, 0.8], h: 0.08, r: [5.9, 5.9], n: 10, color: 'earth' },

  // The mound: a broad stack of boulders behind the mouth, side boulders blending it into the jambs.
  { c: [0, 1.5, -2.7], h: 3.0, r: [3.6, 2.9], n: 8, color: 'stone' },
  { c: [0.1, 4.0, -3.0], h: 2.2, r: [2.9, 1.7], n: 7, color: 'stoneDark' },
  { c: [-0.1, 5.5, -3.0], h: 1.4, r: [1.7, 0.7], n: 6, color: 'stoneLight' },
  rock(-3.6, -1.2, 1.4, 2.7, 'stoneDark', { turn: 10 }), rock(3.6, -1.0, 1.5, 2.9, 'stone', { turn: 40 }),
  rock(-3.2, -3.6, 1.6, 2.4, 'stone', { turn: 25 }), rock(3.1, -3.7, 1.5, 2.5, 'stoneDark', { turn: 5 }),
  rock(-1.6, -5.6, 1.5, 2.3, 'stoneDark', { turn: 50 }), rock(1.8, -5.6, 1.6, 2.6, 'stone', { turn: 15 }),
  rock(0, -1.0, 1.8, 1.0, 'stoneDark', { y0: 3.9, turn: 30 }),
  rock(-2.0, -2.0, 1.1, 1.0, 'stoneLight', { y0: 3.0, turn: 20 }), rock(2.1, -1.8, 1.0, 0.9, 'stoneLight', { y0: 3.1, turn: 70 }),

  // Cave mouth: two slab jambs, a lintel, the dark hollow with embers.
  box([-(MOUTH.w / 2 + 0.65), 2.0, 1.2], [1.3, 4.0, 2.0], 'stoneDark', { q: rotY(5 * DEG) }),
  box([MOUTH.w / 2 + 0.65, 2.0, 1.2], [1.3, 4.0, 2.0], 'stone', { q: rotY(-5 * DEG) }),
  box([0, MOUTH.h + 0.55, 1.2], [MOUTH.w + 2.2, 1.1, 2.0], 'stone', { q: rotZ(1.5 * DEG) }),
  box([0, MOUTH.h / 2, 0.9], [MOUTH.w, MOUTH.h, 0.3], 'slit'),
  box([0, 0.05, 1.4], [MOUTH.w, 0.1, 1.6], 'char'),
  { c: [0.2, 0.3, 1.45], h: 0.6, r: [0.35, 0.02], n: 4, color: 'fire' },
  box([-0.9, 0.12, 1.2], [0.7, 0.07, 0.4], 'red'),
  ...skull('z', 1, MOUTH.z, 0, MOUTH.h + 0.65, 3.0, true),
  ...[-1, 1].flatMap(s => skull('z', 1, MOUTH.z, s * (MOUTH.w / 2 + 0.7), 2.5, 1.3, true)),

  // Tusks, poles with pennants, braziers, clubs.
  ...tusk(-4.3, 1.6, 1), ...tusk(4.3, 1.6, -1),
  ...pennant(-5.0, 0, 3.2, 4.6), ...pennant(5.0, 0, 3.2, 4.6),
  ...brazier(-2.7, 0.7, 3.5), ...brazier(2.7, 0.7, 3.5),
  ...club(-3.7, 2.7, -8), ...club(3.6, 2.9, 8),

  // The yard in front: a fire, bones, stakes, scattered rocks.
  ...firePit(0, 4.3, 0.85),
  ...bonePile(-2.3, 5.2, 1.7),
  ...bonePile(2.6, 4.9, 1.3),
  ...[-4.6, -3.6, -2.4, 2.4, 3.6, 4.6].map((x, i) => spike([x, 0.05, 6.2 - Math.abs(x) * 0.25], [x * 0.03, 1, 0.3], 1.5 + 0.5 * rnd(i, 2), 0.13, 'woodDark')),
  rock(-4.9, 4.4, 0.45, 0.5, 'stone', { turn: 30 }), rock(4.9, 5.0, 0.4, 0.4, 'stoneDark', { turn: 65 }),
];

export default {
  name: 'orc-troll-lair', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 360, previewZoom: 1.8, withAt: [0, 7.4],
};
