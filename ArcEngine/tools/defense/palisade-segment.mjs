// palisade-segment.mjs — a 10 m segment of a wooden palisade: 30 sharpened hexagonal logs of uneven
// height, two rails and four props on the back, an earth ridge at the foot and a team pennant on a
// pole. Segments chain along X: the logs end flush at x = ±5. Static: one mesh, one palette
// material, no skeleton, no clips; written to 3D-models/3D-models-defense/ (folder).
// Model space: meters, feet at y = 0, the outer face looks to +Z, the segment runs along X.
import { rotX } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'wood', hex: '#7a5632' },
  { name: 'woodDark', hex: '#5e4125' },
  { name: 'woodLight', hex: '#a37a48' },
  { name: 'cut', hex: '#d2b078' },
  { name: 'rail', hex: '#4a331e' },
  { name: 'earth', hex: '#6b5a3f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LENGTH = 10, COUNT = 30, PITCH = LENGTH / COUNT;
const R = PITCH / 2;                          // circumradius of a log: neighbours touch at the corners
const TIP = 0.5;                              // height of the sharpened end
const HEIGHTS = [3.0, 2.85, 3.15, 2.9, 3.05, 2.8, 3.1];   // total log heights above the ground, repeated
const BODY = ['wood', 'woodDark', 'woodLight'];
const BACK = -R;                              // back face of the logs

const box = (c, s, color, extra) => ({ c, s, color, ...extra });

// A beam from (y1, z1) to (y2, z2) in the YZ plane, at x.
function strut(x, [y1, z1], [y2, z2], w, color) {
  const len = Math.hypot(y2 - y1, z2 - z1), c = [x, (y1 + y2) / 2, (z1 + z2) / 2];
  return box(c, [w, w, len], color, { q: rotX(Math.atan2(-(y2 - y1), z2 - z1)), pivot: c });
}

const logs = Array.from({ length: COUNT }, (_, i) => {
  const x = -LENGTH / 2 + PITCH * (i + 0.5), z = (i % 2 ? 0.025 : -0.025), h = HEIGHTS[i % HEIGHTS.length];
  return [
    { c: [x, (h - TIP) / 2, z], h: h - TIP, r: [R, R], n: 6, color: BODY[i % BODY.length] },
    { c: [x, h - TIP / 2, z], h: TIP, r: [R, 0.035], n: 6, color: 'cut' },
  ];
}).flat();

const RAILS = [0.85, 1.95], RAIL_Z = BACK - 0.06;
const POLE_X = 0, POLE_Z = BACK - 0.4, POLE_H = 4.4;

const PARTS = [
  // Earth ridge piled at the foot of the logs.
  box([0, 0.06, 0], [LENGTH, 0.12, 0.9], 'earth'),

  ...logs,

  // Rails lashed across the back and the props that carry them.
  ...RAILS.map(y => box([0, y, RAIL_Z], [LENGTH, 0.16, 0.14], 'rail')),
  ...[-3.75, -1.25, 1.25, 3.75].flatMap(x => [
    strut(x, [0.12, BACK - 1.25], [RAILS[1], RAIL_Z - 0.03], 0.14, 'rail'),
    box([x, 0.07, BACK - 1.3], [0.3, 0.14, 0.36], 'earth'),
  ]),

  // Pennant pole behind the wall: the team colour that shows from the RTS camera.
  box([POLE_X, POLE_H / 2, POLE_Z], [0.1, POLE_H, 0.1], 'woodLight'),
  box([POLE_X + 0.42, POLE_H - 0.3, POLE_Z], [0.7, 0.42, 0.04], 'team'),
  box([POLE_X + 0.9, POLE_H - 0.3, POLE_Z], [0.26, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'palisade-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150,
};
