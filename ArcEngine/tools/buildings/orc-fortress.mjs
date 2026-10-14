// orc-fortress.mjs — an orc fortress: a ring of rough black stone walls with fang-shaped merlons, four
// square corner towers with braziers, a gatehouse whose arch is a toothed maw under a big
// tusked skull between two hide banners in the team colours, and an all-stone keep of two stages with
// fang merlons, a fire bowl, slits, skulls and banners; bone spikes and skulls in the walls, braziers
// on the gatehouse, in the yard a fire pit, a rack of axes, skull stakes and rocks. The orc twin of
// the human castle: the same 12.4 x 10.4 m on the wall axes.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the yard, the gate faces +Z.
import { DEG, PALETTE, axe, box, brazier, faceSpike, firePit, pennant, rnd, rock, rotY, skull, skullStake, slit, spike } from './orc-kit.mjs';

const WX = 6.2, WZ = 5.2, T = 1.2, WH = 4.0;          // wall axes, thickness, height of the wall walk
const TW = 2.8, TH = 6.4;                             // corner tower: width, height
const KZ = -1.4;                                      // keep centre, z
const GATE = { w: 2.8, h: 3.4, x: 3.4, d: 2.6, top: 6.3 };

// A fang merlon: a square block with a pyramid on top.
const fang = (x, y, z, w = 0.8, h = 0.55, color = 'stone') => [
  box([x, y + h / 2, z], [w, h, w], color),
  { c: [x, y + h + 0.3, z], h: 0.6, r: [w * 0.72, 0.03], n: 4, q: rotY(45 * DEG), color },
];
const fangs = (xs, y, z) => xs.flatMap(x => fang(x, y, z));
const fangsZ = (zs, y, x) => zs.flatMap(z => fang(x, y, z));

// A small hide banner: cloth, trim and two ragged tails.
const cloth = (axis, sign, plane, u, yTop, w = 0.8, h = 1.6) => {
  const put = (du, y, d, su, sy, sd, color) => axis === 'z' ? box([u + du, y, sign * (plane + d)], [su, sy, sd], color) : box([sign * (plane + d), y, u + du], [sd, sy, su], color);
  return [
    put(0, yTop - h / 2, 0.05, w, h, 0.06, 'team'),
    put(0, yTop - 0.06, 0.09, w + 0.2, 0.12, 0.08, 'bone'),
    put(-w / 4, yTop - h - 0.2, 0.05, w / 2 - 0.04, 0.4, 0.05, 'teamDark'),
    put(w / 4, yTop - h - 0.05, 0.05, w / 2 - 0.04, 0.1, 0.05, 'teamDark'),
    put(0, yTop - h * 0.55, 0.1, 0.26, 0.26, 0.04, 'red'),
  ];
};

const tower = (sx, sz) => {
  const x = sx * WX, z = sz * WZ;
  return [
    box([x, 0.25, z], [TW + 0.4, 0.5, TW + 0.4], 'stoneDark'),
    box([x, TH / 2, z], [TW, TH, TW], 'stone'),
    box([x, TH + 0.15, z], [TW + 0.4, 0.3, TW + 0.4], 'stoneDark'),
    // Leave only the corner facing the courtyard (-sx, -sz) clear.
    ...[[sx, sz], [-sx, sz], [sx, -sz]].flatMap(([a, b]) => fang(x + a * (TW / 2 - 0.15), TH + 0.3, z + b * (TW / 2 - 0.15), 0.7, 0.45)),
    // A slit on the outer face.
    box([x, TH * 0.62, z + sz * (TW / 2 + 0.01)], [0.3, 1.0, 0.03], 'slit'),
    spike([x + sx * (TW / 2), 4.4, z], [sx, 0.35, 0], 0.8, 0.09, 'bone'),
  ];
};

const wall = (axis, sign) => {
  const len = axis === 'z' ? 2 * WX : 2 * WZ, c = sign * (axis === 'z' ? WZ : WX);
  const at = (u, y, d, su, sy, sd, color) => axis === 'z' ? box([u, y, c + d], [su, sy, sd], color) : box([c + d, y, u], [sd, sy, su], color);
  return [
    at(0, WH / 2, 0, len, WH, T, 'stoneDark'),
    at(0, WH + 0.04, -sign * 0.2, len, 0.08, T - 0.4, 'stone'),
    at(0, WH + 0.2, sign * (T / 2 - 0.2), len, 0.4, 0.4, 'stone'),
    ...(axis === 'z' ? [at(0, 1.7, sign * (T / 2 + 0.01), len, 0.07, 0.02, 'char'), at(0, 3.0, sign * (T / 2 + 0.01), len, 0.07, 0.02, 'char')] : []),
  ];
};

const PARTS = [
  box([0, 0.03, 0], [2 * WX, 0.06, 2 * WZ], 'earth'),
  ...[[-3.5, 1.5, 3, 2.2], [3.2, 2.4, 2.6, 1.8], [-2.8, -3.6, 2.4, 1.6]].map(([x, z, w, d], i) => box([x, 0.065, z], [w, 0.02, d], i % 2 ? 'stoneDark' : 'stone')),

  // Walls: back, the two sides, the front (broken by the gatehouse).
  ...wall('z', -1),
  ...wall('x', 1),
  ...wall('x', -1),
  ...wall('z', 1),
  ...fangs([-3.6, -1.2, 1.2, 3.6], WH + 0.4, -WZ - T / 2 + 0.4),
  ...fangsZ([-2.4, 0, 2.4], WH + 0.4, WX + T / 2 - 0.4),
  ...fangsZ([-2.4, 0, 2.4], WH + 0.4, -WX - T / 2 + 0.4),
  ...fangs([-4.1, 4.1], WH + 0.4, WZ + T / 2 - 0.4),
  ...tower(1, 1), ...tower(-1, 1), ...tower(1, -1), ...tower(-1, -1),
  // Bone spikes, skulls and banners in the outer faces of the walls.
  ...[-4.2, -1.4, 1.4, 4.2].map((u, i) => faceSpike('z', -1, WZ + T / 2, u, 1.4 + 0.5 * (i % 2), 0.9, 0.08, 0.3, 'bone')),
  ...[-2.0, 2.0].flatMap(u => [1, -1].map((side, i) => faceSpike('x', side, WX + T / 2, u + 0.4 * i, 1.0 + 0.6 * ((i + (u > 0 ? 1 : 0)) % 2), 0.9, 0.08, 0.3, 'bone'))),
  ...[4.1, -4.1].map((u, i) => faceSpike('z', 1, WZ + T / 2, u, 1.3 + 0.5 * i, 0.9, 0.08, 0.3, 'bone')),
  ...skull('z', -1, WZ + T / 2, 0, 2.6, 1.3),
  ...brazier(WX, TH + 1.0, -WZ),
  ...brazier(-WX, TH + 1.0, -WZ),
  ...brazier(WX, TH + 1.0, WZ),
  ...brazier(-WX, TH + 1.0, WZ),

  // Gatehouse: two blocks, a lintel with teeth hanging into the opening, a roof deck with fangs.
  ...[1, -1].map(s => box([s * (GATE.w / 2 + 1.0), GATE.top / 2, WZ], [2.0, GATE.top, GATE.d], 'stone')),
  box([0, (GATE.h + GATE.top) / 2, WZ], [GATE.w, GATE.top - GATE.h, GATE.d], 'stone'),
  box([0, GATE.top + 0.15, WZ], [2 * GATE.x + 0.4, 0.3, GATE.d + 0.4], 'stoneDark'),
  ...fangs([-2.5, 0, 2.5], GATE.top + 0.3, WZ + GATE.d / 2 - 0.2),
  ...Array.from({ length: 7 }, (_, i) => spike([-1.2 + i * 0.4, GATE.h + 0.05, WZ + 0.9], [0, -1, 0], 0.55 + 0.25 * (i % 2), 0.1, 'bone')),
  box([0, GATE.h / 2, WZ - 0.3], [GATE.w, GATE.h, 0.1], 'slit'),
  ...skull('z', 1, WZ + GATE.d / 2, 0, GATE.h + 1.6, 2.4, true),
  ...[1, -1].flatMap(s => cloth('z', 1, WZ + GATE.d / 2, s * 2.4, GATE.top - 0.5, 0.9, 2.0)),
  ...[-2.1, 2.1].flatMap(x => brazier(x, GATE.top + 1.0, WZ - 0.4)),
  box([-1.1, 0.35, WZ + GATE.d / 2 + 0.3], [0.5, 0.7, 0.5], 'stoneDark'),
  box([1.1, 0.35, WZ + GATE.d / 2 + 0.3], [0.5, 0.7, 0.5], 'stoneDark'),

  // Keep: two stone stages (no timber): a wide lower body with buttresses, a narrower upper stage with
  // slits, skulls and banners, a ledge with fang merlons, a fire bowl on a stone pedestal.
  box([0, 0.2, KZ], [5.8, 0.4, 5.8], 'stoneDark'),
  box([0, 3.1, KZ], [5.0, 5.4, 5.0], 'stone'),
  box([0, 6.1, KZ], [5.7, 0.4, 5.7], 'stoneDark'),
  box([0, 7.65, KZ], [4.0, 2.7, 4.0], 'stone'),
  box([0, 9.2, KZ], [4.7, 0.4, 4.7], 'stoneDark'),
  ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].flatMap(([a, b]) => [
    box([a * 2.5, 2.7, KZ + b * 2.5], [0.7, 4.6, 0.7], 'stoneDark'),
    box([a * 2.5, 5.2, KZ + b * 2.5], [0.84, 0.2, 0.84], 'stone'),
    spike([a * 2.5, 5.3, KZ + b * 2.5], [a * 0.15, 1, b * 0.15], 0.9, 0.3, 'char'),
  ]),
  ...[-1.95, 0, 1.95].flatMap(x => [...fang(x, 9.4, KZ + 1.95, 0.8, 0.5), ...fang(x, 9.4, KZ - 1.95, 0.8, 0.5)]),
  { c: [0, 9.9, KZ], h: 0.9, r: [0.55, 0.4], n: 6, color: 'stoneDark' },
  { c: [0, 10.55, KZ], h: 0.4, r: [0.55, 0.8], n: 6, color: 'iron' },
  { c: [0, 11.2, KZ], h: 0.9, r: [0.6, 0.02], n: 4, color: 'fire' },
  ...pennant(0, 9.4, KZ - 1.7, 2.0),
  // Masonry bands and the keep door.
  ...[1.9, 3.8].flatMap(y => [box([0, y, KZ + 2.52], [5.04, 0.07, 0.04], 'char'), box([2.52, y, KZ], [0.04, 0.07, 5.04], 'char'), box([-2.52, y, KZ], [0.04, 0.07, 5.04], 'char')]),
  box([0, 7.0, KZ + 2.02], [4.04, 0.07, 0.04], 'char'),
  box([0, 1.3, 1.13], [1.8, 2.5, 0.12], 'woodDark'),
  box([0, 2.7, 1.2], [2.4, 0.4, 0.3], 'stoneDark'),
  ...[1, -1].map(sd => box([sd * 1.05, 1.3, 1.2], [0.3, 2.6, 0.3], 'stoneDark')),
  box([0, 1.2, 1.2], [1.4, 2.3, 0.08], 'wood'),
  box([0, 1.45, 1.26], [1.4, 0.12, 0.04], 'iron'),
  box([0, 0.85, 1.26], [1.4, 0.12, 0.04], 'iron'),
  box([0, 0.1, 1.7], [2.2, 0.2, 0.9], 'stone'),
  ...skull('z', 1, 1.1, 0, 3.35, 1.2),
  ...[-1, 1].flatMap(s => cloth('z', 1, 1.1, s * 1.85, 5.2, 0.8, 2.2)),
  ...[-1.5, 1.5].flatMap(x => slit('z', 1, KZ + 2.5, x, 4.2)),
  // Upper stage: slits, a skull and bone spikes on every face, banners on the front and the sides.
  ...[-1.2, 1.2].flatMap(x => [...slit('z', 1, KZ + 2.0, x, 7.5)]),
  ...skull('z', 1, KZ + 2.0, 0, 8.0, 1.6),
  ...skull('z', -1, 2.0 - KZ, 0, 8.0, 1.2),
  ...skull('x', 1, 2.0, KZ, 8.0, 1.2),
  ...skull('x', -1, 2.0, KZ, 8.0, 1.2),
  ...[-1.55, 1.55].flatMap(x => faceSpike('z', 1, KZ + 2.0, x, 6.8, 0.9, 0.08, 0.3, 'bone')),
  ...[-1.55, 1.55].flatMap(x => faceSpike('z', -1, 2.0 - KZ, x, 6.8, 0.9, 0.08, 0.3, 'bone')),
  ...[-1.0, 1.0].map(u => box([u, 3.0, KZ - 2.52], [0.3, 1.0, 0.04], 'slit')),

  // Yard: a fire, a rack of axes, skull stakes, a heap of rocks.
  ...firePit(3.0, 0.3, 0.55),
  box([-3.6, 0.7, 2.2], [0.12, 1.4, 0.12], 'woodDark'), box([-2.0, 0.7, 2.2], [0.12, 1.4, 0.12], 'woodDark'),
  box([-2.8, 1.2, 2.2], [1.8, 0.1, 0.1], 'wood'),
  ...axe(-3.3, 0.8, 2.28, { len: 0.9, tilt: -4 }), ...axe(-2.5, 0.8, 2.28, { len: 0.9, tilt: 4, color: 'stoneLight' }),
  ...skullStake(1.9, 2.6, 1.4, 0.9),
  ...skullStake(-1.9, 2.6, 1.1, 0.9),
  rock(4.4, -3.2, 0.6, 0.6, 'stone', { turn: 30 }),
];

export default {
  name: 'orc-fortress', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 4000,
  preview: '25,90,155', previewGap: 520, previewZoom: 2.2, withAt: [0, 9.2],
};
