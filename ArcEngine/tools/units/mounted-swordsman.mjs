// Mounted swordsman: the horse and the swordsman in ONE model (one mesh, one material, one
// skeleton), assembled from horse.mjs and swordsman.mjs — nothing is drawn here. The rider's joints
// (prefixed `rider_`) hang on the horse's `saddle`; his parts and joints move by the saddle's bind
// position, and every horse clip is merged with the rider's paired clip of the same length.
// Clips: "idle", "run", "attack" (standing), "runAttack" (at a gallop) — looped; "death" — once
// (the horse rolls over, the rider is thrown and lies beside it). Faces +Z.
import { add } from '../unit-glb.mjs';
import horse from './horse.mjs';
import swordsman from './swordsman.mjs';

const PAIRS = { idle: 'ride', run: 'rideRun', attack: 'rideAttack', runAttack: 'rideRunAttack', death: 'rideDeath' };
const SADDLE = horse.joints.findIndex(j => j.name === 'saddle');
const SEAT = horse.joints[SADDLE].at, N = horse.joints.length;
const rider = name => 'rider_' + name;

const JOINTS = [
  ...horse.joints,
  ...swordsman.joints.map(j => ({ name: rider(j.name), at: add(j.at, SEAT), parent: j.parent < 0 ? SADDLE : j.parent + N })),
];

// One 4x4 palette (16 colours): equal hex values are one texel. The horse's eye texel goes to the
// mane's (#2b1d14, the swordsman's eye too): the two blacks are a shade apart, and this keeps the
// palette at 16.
const EYE_TO = { eye: 'mane' };
const PALETTE = horse.palette.filter(c => !(c.name in EYE_TO));
const alias = {};
for (const c of swordsman.palette) {
  const same = PALETTE.find(p => p.hex === c.hex);
  if (same) alias[c.name] = same.name;
  else {
    PALETTE.push(c);
    alias[c.name] = c.name;
  }
}

const shift = (p) => {
  const out = { ...p, color: alias[p.color] };
  if (p.span) {
    out.span = p.span.map(v => add(v, SEAT));
    out.joints = p.joints.map(j => j + N);
  } else {
    out.c = add(p.c, SEAT);
    if (p.pivot) out.pivot = add(p.pivot, SEAT);
    out.joint = p.joint + N;
  }
  return out;
};
const PARTS = [
  ...horse.parts.map(p => ({ ...p, color: EYE_TO[p.color] || p.color })),
  ...swordsman.parts.map(shift),
];

const CLIPS = horse.clips.map((h) => {
  const r = swordsman.clips.find(c => c.name === PAIRS[h.name]);
  if (!r || r.loop !== h.loop || r.times.length !== h.times.length || r.times.some((t, i) => Math.abs(t - h.times[i]) > 1e-9)) {
    throw new Error(`mounted-swordsman: ${h.name} and ${PAIRS[h.name]} differ in length`);
  }
  const tracks = new Map(h.tracks);
  for (const [key, values] of r.tracks) {
    const [joint, prop] = key.split('.');
    tracks.set(rider(joint) + '.' + prop, values);
  }
  return { ...h, tracks };
});

export default {
  name: 'mounted-swordsman', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,attack@0.52,runAttack@0.6,death@1.5',
  previewGap: 75,
  maxTriangles: 1400,   // two models in one: horse 556 + swordsman 756
};
