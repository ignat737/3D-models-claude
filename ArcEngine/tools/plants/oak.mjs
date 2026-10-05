// oak.mjs — an oak: a thick trunk with a root flare and three forked limbs, under a broad crown of
// five eight-sided blobs (each a flat-topped double frustum, tinted dark / mid / light so the crown
// reads as clumps of leaves) on a patch of grass. Static: one mesh, one palette material, no skeleton,
// no clips; written to 3D-models/3D-models-plants/ (folder). Model space: meters, feet at y = 0,
// round about Y (the heading does not matter).
import { DEG, fromTo, rotY } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'bark', hex: '#6a4a2c' },
  { name: 'barkDark', hex: '#4c331d' },
  { name: 'leaves', hex: '#4f8a2e' },
  { name: 'leavesDark', hex: '#3a6b24' },
  { name: 'leavesLight', hex: '#6fa83a' },
  { name: 'grass', hex: '#4a6b2a' },
];

// A clump of leaves: a double frustum around centre c, radius r, flat on top.
const blob = ([x, y, z], r, color, turn) => [
  { c: [x, y - 0.275 * r, z], h: 0.55 * r, r: [0.5 * r, r], n: 8, color, q: rotY(turn * DEG), pivot: [x, y, z] },
  { c: [x, y + 0.275 * r, z], h: 0.55 * r, r: [r, 0.55 * r], n: 8, color, q: rotY(turn * DEG), pivot: [x, y, z] },
];

// A limb from a to b with radii [at a, at b].
const limb = (a, b, r) => {
  const c = a.map((v, k) => (v + b[k]) / 2);
  return { c, h: Math.hypot(...a.map((v, k) => b[k] - v)), r, n: 6, color: 'bark', q: fromTo([0, 1, 0], b.map((v, k) => v - a[k])), pivot: c };
};

const PARTS = [
  { c: [0, 0.03, 0], h: 0.06, r: [1.3, 1.25], n: 8, color: 'grass' },
  { c: [0, 0.2, 0], h: 0.4, r: [0.75, 0.5], n: 6, color: 'barkDark' },
  { c: [0, 1.4, 0], h: 2.0, r: [0.5, 0.36], n: 6, color: 'bark' },
  limb([0, 2.6, 0], [1.4, 3.9, 0.5], [0.28, 0.16]),
  limb([0, 2.6, 0], [-1.3, 3.8, -0.8], [0.28, 0.16]),
  limb([0, 2.6, 0], [0.2, 4.6, -0.3], [0.3, 0.2]),

  ...blob([1.6, 4.1, 0.6], 1.6, 'leaves', 10),
  ...blob([-1.5, 4.0, -0.9], 1.7, 'leavesDark', 25),
  ...blob([-0.3, 4.2, 1.5], 1.5, 'leavesDark', 0),
  ...blob([0.1, 5.0, -0.3], 2.3, 'leaves', 15),
  ...blob([0.3, 6.1, 0.2], 1.5, 'leavesLight', 30),
];

export default {
  name: 'oak', folder: '3D-models-plants', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '0,45,90', previewGap: 190, previewZoom: 1.5, withAt: [3.8, 0],
};
