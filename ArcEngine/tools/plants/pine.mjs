// pine.mjs — a pine: a tall bare trunk (reddish bark above the lower half), a few short stubs and a
// small ragged crown of four flat seven-sided pads offset from the axis, topped by a short tuft.
// Slim and high: it reads against the spruce (cone) and the oak (round crown). Static: one mesh,
// one palette material, no skeleton, no clips; written to 3D-models/3D-models-plants/ (folder).
// Model space: meters, feet at y = 0, round about Y (the heading does not matter).
import { DEG, fromTo, rotY } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'bark', hex: '#5f4228' },
  { name: 'barkRed', hex: '#9a5b34' },
  { name: 'needles', hex: '#3a6b3c' },
  { name: 'needlesDark', hex: '#2a5330' },
  { name: 'needlesLight', hex: '#558a47' },
  { name: 'litter', hex: '#5a4630' },
];

// A flat pad of needles centred on c.
const pad = ([x, y, z], r, h, color, turn) => ({
  c: [x, y, z], h, r: [r * 0.7, r], n: 7, color, q: rotY(turn * DEG),
});

const stub = (a, b, r) => {
  const c = a.map((v, k) => (v + b[k]) / 2);
  return { c, h: Math.hypot(...a.map((v, k) => b[k] - v)), r: [r, r * 0.6], n: 5, color: 'bark', q: fromTo([0, 1, 0], b.map((v, k) => v - a[k])), pivot: c };
};

const PARTS = [
  { c: [0, 0.03, 0], h: 0.06, r: [0.9, 0.85], n: 8, color: 'litter' },
  { c: [0, 0.25, 0], h: 0.5, r: [0.4, 0.27], n: 6, color: 'bark' },
  { c: [0, 2.0, 0], h: 3.0, r: [0.27, 0.2], n: 6, color: 'bark' },
  { c: [0, 5.0, 0], h: 3.0, r: [0.2, 0.12], n: 6, color: 'barkRed' },
  stub([0, 4.9, 0], [0.9, 5.7, 0.2], 0.1),
  stub([0, 5.4, 0], [-0.8, 6.3, -0.3], 0.1),

  pad([1.1, 5.9, 0.2], 1.15, 0.75, 'needlesDark', 0),
  pad([-1.0, 6.5, -0.3], 1.2, 0.8, 'needles', 20),
  pad([0.2, 7.1, 0.9], 1.1, 0.7, 'needles', 40),
  pad([-0.1, 7.7, -0.4], 1.3, 0.85, 'needlesLight', 10),
  pad([0.1, 8.4, 0], 0.7, 0.6, 'needlesLight', 30),
];

export default {
  name: 'pine', folder: '3D-models-plants', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '0,45,90', previewGap: 170, previewZoom: 1.7, withAt: [2.6, 0],
};
