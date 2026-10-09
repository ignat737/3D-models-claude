// orc-palisade-segment.mjs — a 10 m segment of an orc palisade: twenty thick crooked logs of uneven
// height (3.2-4.3 m) leaning out over the attacker, tips charred black, a field of sharpened stakes
// in front, skulls on pegs, a tattered hide banner in the team colours, and a totem pole behind with
// a tusked skull and a pennant. The orc twin of palisade-segment: the same 10 m, the logs end flush at
// x = +-5, so it chains with its own tower and gate. Static: one mesh, one palette material.
import { PALETTE, banner, beam, box, palisadeLog, skull, spike } from './orc-common.mjs';

const N = 20, R = 0.27, X0 = 5 - R, PITCH = 2 * X0 / (N - 1);
const BANNER_AT = 0, SKULLS = [[2, 2.5], [5, 2.9], [14, 2.9], [17, 2.5]];

const logs = Array.from({ length: N }, (_, i) => {
  const x = -X0 + PITCH * i;
  return { i, x, ...palisadeLog(i, x, R, { lean: Math.abs(x - BANNER_AT) < 1.1 ? 0.5 : undefined }) };
});

// A skull on a peg that reaches back to the log it hangs on.
const trophies = SKULLS.flatMap(([i, y]) => {
  const { x, front } = logs[i], plane = front(y) + 0.28;
  return [box([x, y - 0.08, front(y) + 0.14], [0.08, 0.08, 0.3], 'woodDark'), ...skull('z', 1, plane, x, y, 1, true)];
});

const RAIL_Z = -R - 0.07;
const PARTS = [
  box([0, 0.07, 0], [10, 0.14, 1.3], 'earth'),
  ...logs.flatMap(l => l.parts),

  // Rails lashed across the back and the props under them.
  ...[1.0, 2.35].map(y => box([0, y, RAIL_Z], [10, 0.17, 0.15], 'woodDark')),
  ...[-3.75, -1.25, 1.25, 3.75].flatMap(x => [
    beam([x, 0.12, RAIL_Z - 1.4], [x, 2.4, RAIL_Z - 0.04], 0.15, 'woodDark'),
    box([x, 0.07, RAIL_Z - 1.45], [0.34, 0.14, 0.38], 'earth'),
  ]),

  // Sharpened stakes in front, leaning at the attacker.
  ...Array.from({ length: 9 }, (_, k) => spike([-4.4 + k * 1.1, 0.08, 0.5 + 0.12 * (k % 2)], [0, 0.85, 1], 1.5, 0.09, 'wood')),

  ...trophies,
  // Banner hung from two arms.
  ...[-0.7, 0.7].map(dx => box([BANNER_AT + dx, 3.4, 0.45], [0.1, 0.1, 0.5], 'woodDark')),
  ...banner('z', 1, 0.5, BANNER_AT, 3.4, 1.0, 1.7),

  // Totem pole behind the wall: a tusked skull and the team pennant, seen over the logs.
  box([-2.5, 2.9, -1.0], [0.14, 5.8, 0.14], 'woodDark'),
  ...skull('z', 1, -0.93, -2.5, 5.75, 1.15, true),
  box([-2.05, 4.9, -1.0], [0.8, 0.46, 0.04], 'team'),
  box([-1.45, 4.85, -1.0], [0.4, 0.22, 0.04], 'teamDark'),
];

export default {
  name: 'orc-palisade-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150,
};
