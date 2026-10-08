// Troll: a low-poly giant 2.5 m tall (the horn tips), broad and hunched: grey-green skin,
// tusks, small horns, team shoulder pads, sash and loincloth, and a huge studded club in
// the right fist. Own body: the humanoid joints scaled (1.6 wide, 1.43 tall, 1.5 deep). Faces +Z.
// Clips: "idle" (the club head on the ground), "run" (club in both hands), "attack" (looped:
// raise the club over the head, smash it down with both hands and a lunge) and "death" (once, stays down).
import { DEG, add, cross, dot, loopClip, norm, onceClip, qconj, qmul, qrot, rig, rotX, rotY, rotZ, sub } from '../unit-glb.mjs';
import { B, SIDES, armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';
import { scaledBody, stoop } from './scaled.mjs';

const { BODY, FIST_R, HAND, S, limbs, grow } = scaledBody(1.6, 1.43, 1.5);
const TIP = 1.28;     // fist -> end of the club head along the club
const SPACING = -0.24; // right fist -> left fist along the handle, towards the butt (a second grip)
const SINK = 0.02;    // the head rests this deep: the ground under it may slope away
const HIPS = 0.90 * 1.43;
const JOINTS = [...BODY, { name: 'club', at: FIST_R, parent: B.foreR }];
const { J, worldOf, aimJoint, reach } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#7b8a6a' },
  { name: 'skinDark', hex: '#5c6a51' },
  { name: 'eye', hex: '#f0b030' },
  { name: 'tusk', hex: '#ece3c8' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'hair', hex: '#2b2a25' },
  { name: 'iron', hex: '#5b6067' },
  { name: 'leather', hex: '#5a3a22' },
  { name: 'cloth', hex: '#4a3b2f' },
  { name: 'wood', hex: '#7b5530' },
  { name: 'woodDark', hex: '#5c3f22' },
];

const clubAt = (y, x = 0, z = 0) => add(FIST_R, [x, y, z]);

const PARTS = [
  // Head: a small skull on a thick neck pushed forward, a heavy brow, yellow eyes, a flat nose,
  // a jutting jaw with two upturned tusks, small ears and two short horns.
  { c: [0, 2.29, 0.04], s: [0.34, 0.26, 0.34], joint: B.head, color: 'skin' },
  { c: [0, 2.36, 0.19], s: [0.36, 0.06, 0.08], joint: B.head, color: 'skinDark' },
  ...SIDES.flatMap(k => [
    { c: [0.08 * k, 2.32, 0.217], s: [0.05, 0.04, 0.014], joint: B.head, color: 'eye' },
    { c: [0.10 * k, 2.27, 0.225], s: [0.04, 0.11, 0.04], joint: B.head, color: 'tusk' },
    { c: [0.205 * k, 2.29, 0.0], s: [0.06, 0.10, 0.07], joint: B.head, color: 'skin' },
    { c: [0.12 * k, 2.46, 0.0], h: 0.08, r: [0.05, 0.008], n: 5, q: rotZ(-20 * k * DEG), pivot: [0.12 * k, 2.42, 0.0], joint: B.head, color: 'tusk' },
  ]),
  { c: [0, 2.27, 0.25], s: [0.10, 0.08, 0.06], joint: B.head, color: 'skinDark' },
  { c: [0, 2.20, 0.13], s: [0.30, 0.12, 0.22], joint: B.head, color: 'skinDark' },
  // Torso: a barrel chest, a hump on the back, a team sash across (front and back),
  // belt with a bone buckle, a hide loincloth on the hips.
  S({ c: [0, 1.20, 0], s: [0.40, 0.50, 0.22], joint: B.torso, color: 'skin' }),
  { c: [0, 2.03, -0.21], s: [0.50, 0.30, 0.16], joint: B.torso, color: 'skin' },
  { c: [0, 1.80, 0.178], s: [0.13, 0.86, 0.014], q: rotZ(32 * DEG), joint: B.torso, color: 'team' },
  { c: [0, 1.80, -0.178], s: [0.13, 0.86, 0.014], q: rotZ(-32 * DEG), joint: B.torso, color: 'team' },
  S({ c: [0, 0.975, 0], s: [0.43, 0.07, 0.25], joint: B.torso, color: 'leather' }),
  S({ c: [0, 0.975, 0.128], s: [0.07, 0.05, 0.01], joint: B.torso, color: 'tusk' }),
  S({ c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: B.hips, color: 'cloth' }),
  ...limbs({ pauldron: 'teamDark', upper: 'skin', fore: 'skin', fist: 'skinDark', thigh: 'cloth', flap: 'team', shin: 'skin', boot: 'skinDark' }),
  // Club, bind pose upright through the right fist: butt cap, handle, leather grip, team band,
  // a thick head in two frustums with an iron ring and iron spikes, a rounded cap.
  { c: clubAt(-0.42), h: 0.05, r: [0.075, 0.075], n: 6, joint: J.club, color: 'leather' },
  { c: clubAt(0.05), h: 0.90, r: [0.055, 0.062], n: 6, joint: J.club, color: 'wood' },
  { c: clubAt(0), h: 0.20, r: [0.072, 0.072], n: 6, joint: J.club, color: 'leather' },
  { c: clubAt(SPACING), h: 0.16, r: [0.072, 0.072], n: 6, joint: J.club, color: 'leather' },
  { c: clubAt(0.42), h: 0.06, r: [0.075, 0.075], n: 6, joint: J.club, color: 'team' },
  { c: clubAt(0.72), h: 0.44, r: [0.10, 0.22], n: 8, joint: J.club, color: 'woodDark' },
  { c: clubAt(1.07), h: 0.26, r: [0.22, 0.17], n: 8, joint: J.club, color: 'woodDark' },
  { c: clubAt(0.94), h: 0.05, r: [0.235, 0.235], n: 8, joint: J.club, color: 'iron' },
  { c: clubAt(1.24), h: 0.08, r: [0.17, 0.09], n: 8, joint: J.club, color: 'wood' },
  ...[[0.26, 0, 90], [-0.26, 0, -90]].map(([x, z, a]) => ({ c: clubAt(1.02, x, z), h: 0.13, r: [0.045, 0.006], n: 4, q: rotZ(-a * DEG), joint: J.club, color: 'iron' })),
  { c: clubAt(1.02, 0, 0.26), h: 0.13, r: [0.045, 0.006], n: 4, q: rotX(90 * DEG), joint: J.club, color: 'iron' },
  { c: clubAt(1.02, 0, -0.26), h: 0.13, r: [0.045, 0.006], n: 4, q: rotX(-90 * DEG), joint: J.club, color: 'iron' },
];

// The club head down: the club at the world rotation aim, slid so its end touches the ground.
function restHead(pose, aim) {
  const fist = worldOf(pose, J.club).p, up = qrot(aim, [0, 1, 0]);
  return aimJoint(pose, 'club', aim, (-SINK - fist[1]) / up[1] - TIP);
}

// Keep each arm's lateral axis facing outward as it passes vertical. A shortest-arc
// aim alone flips its twist at the overhead pose, making glTF interpolation lose the grip.
function steadyArm(pose, upper, fore) {
  const upright = (q, reference = [1, 0, 0]) => {
    const y = qrot(q, [0, 1, 0]), x = qrot(q, [1, 0, 0]);
    const lateral = norm(sub(reference, y.map(v => v * dot(reference, y))));
    return qmul(q, rotY(Math.atan2(dot(y, cross(x, lateral)), dot(x, lateral))));
  };
  const u = worldOf(pose, J[upper]), f = worldOf(pose, J[fore]);
  const parent = worldOf(pose, JOINTS[J[upper]].parent);
  pose[upper + '.rotation'] = qmul(qconj(parent.q), upright(u.q));
  pose[fore + '.rotation'] = qmul(qconj(worldOf(pose, J[upper]).q), upright(f.q, fore === 'foreL' ? [0, 0, 1] : [1, 0, 0]));
}

// Both hands on the club: the right fist at fist (model space), the club at aim, the left fist
// SPACING along the handle (towards the butt, which is the near end when the head is down).
function bothHands(pose, fist, aim, poleR, poleL, steady = false) {
  reach(pose, 'armR', 'foreR', fist, poleR, HAND);
  if (steady) steadyArm(pose, 'armR', 'foreR');
  aimJoint(pose, 'club', aim, 0);
  reach(pose, 'armL', 'foreL', add(worldOf(pose, J.club).p, qrot(aim, [0, SPACING, 0])), poleL, HAND);
  if (steady) steadyArm(pose, 'armL', 'foreL');
  return pose;
}
// Head up and tilted toward the body's centre (lat) and forward (pitch).
const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));

// Raise the hands to the crown while the club stays tilted upward behind the head.
// The single, limited wind-up immediately reverses into a forward smash without a hold.
const CHOP = [
  { u: 0, hx: -0.23, hy: 1.8, hz: 0.563, lat: 7.163, pitch: 37.316, ty: -14.032, lean: 9.432, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
  { u: 0.2, hx: -0.232, hy: 1.97, hz: 0.355, lat: 8.272, pitch: 1.97, ty: -16.77, lean: 3.256, step: 0.3, hips: 1.287, prx: -0.99, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.22 },
  { u: 0.34, hx: 0.03, hy: 2.48, hz: 0.39, lat: 20, pitch: 0, ty: 0, lean: 0, step: 0.3, hips: 1.287, prx: -1, pry: -0.35, prz: 0.3, plx: 1, ply: -0.3, plz: 0.6 },
  { u: 0.45, hx: 0.03, hy: 2.52, hz: 0.26, lat: 20, pitch: -65, ty: 0, lean: 0, step: 0.08, hips: 1.287, prx: -1, pry: -0.2, prz: 0.8, plx: 1, ply: 0, plz: -0.8 },
  { u: 0.57, hx: 0.05, hy: 2.37, hz: 0.4, lat: 20, pitch: -25, ty: -7, lean: 0, step: 0.521, hips: 1.249, prx: -1, pry: 0.2, prz: 0.3, plx: 1, ply: 0.2, plz: 0.8 },
  { u: 0.67, hx: -0.245, hy: 1.654, hz: 0.612, lat: 7.081, pitch: 49.432, ty: -12.277, lean: 20.602, step: 1, hips: 1.167, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.78, plz: 0.23 },
  { u: 0.74, hx: -0.231, hy: 1.352, hz: 0.759, lat: 7.546, pitch: 88.91, ty: -9.337, lean: 30.55, step: 1, hips: 1.162, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 0.82, hx: -0.223, hy: 1.214, hz: 0.808, lat: 7.645, pitch: 121.959, ty: -7.519, lean: 35.471, step: 0.997, hips: 1.157, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.2 },
  { u: 1, hx: -0.23, hy: 1.8, hz: 0.563, lat: 7.163, pitch: 37.316, ty: -14.032, lean: 9.432, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
];
// Monotone Hermite interpolation keeps each control inside its two key values. Unlike
// smoothstep per stop, matching tangents let the motion flow through the intermediate poses.
// The wind-up has one turning point and immediately reverses into the strike.
function chopPose(u) {
  let i = 0;
  while (i < CHOP.length - 2 && u > CHOP[i + 1].u) i++;
  const a = CHOP[i], b = CHOP[i + 1], h = b.u - a.u, t = (u - a.u) / h;
  const out = {};
  for (const key of Object.keys(a)) {
    if (key === 'u') continue;
    const d = CHOP.slice(1).map((p, j) => (p[key] - CHOP[j][key]) / (p.u - CHOP[j].u));
    const slope = j => {
      const last = CHOP.length - 1, left = j === 0 ? d[last - 1] : d[j - 1], right = j === last ? d[0] : d[j];
      if (left * right <= 0) return 0;
      const hl = j === 0 ? 1 - CHOP[last - 1].u : CHOP[j].u - CHOP[j - 1].u;
      const hr = j === last ? CHOP[1].u : CHOP[j + 1].u - CHOP[j].u;
      const w1 = 2 * hr + hl, w2 = hr + 2 * hl;
      return (w1 + w2) / (w1 / left + w2 / right);
    };
    out[key] = (2*t*t*t - 3*t*t + 1)*a[key] + (t*t*t - 2*t*t + t)*h*slope(i)
      + (-2*t*t*t + 3*t*t)*b[key] + (t*t*t - t*t)*h*slope(i + 1);
  }
  return out;
}

// Run pose (same search, no lunge): the club across the chest, head up and forward.
const RUN = { hx: -0.24, hy: 1.714, hz: 0.576, lat: 11.31, pitch: 44.69, ty: -19.18, lean: 13.72, poleR: [-1, -0.795, 0.003], poleL: [1, -0.789, 0.231] };

const CLIPS = [
  // At ease: a slow heavy breath, the club head resting on the ground at the right side.
  loopClip('idle', 3.0, 12, (t) => {
    const pose = stoop(armAngles({ lz: 10, lx: -8 - 2 * Math.sin(t), flx: -20, rz: -6, rx: -4, frx: -6 }, grow(idleBody(t))), 10 + 2 * Math.sin(t));
    return restHead(pose, qmul(rotZ(18 * DEG), rotX(158 * DEG)));
  }),
  // Run: a heavy stomp, the club carried in both hands across the chest, head up and forward.
  loopClip('run', 0.8, 16, (t) => {
    const pose = grow(runBody(t));
    pose['torso.rotation'] = qmul(rotY(RUN.ty * DEG), rotX(RUN.lean * DEG));
    pose['head.rotation'] = qmul(rotY(-0.9 * RUN.ty * DEG), rotX(-0.8 * RUN.lean * DEG));
    const bounce = 0.05 * Math.abs(Math.sin(t)) - 0.029;
    return bothHands(pose, [RUN.hx, RUN.hy + bounce, RUN.hz], tilt(RUN.lat, RUN.pitch + 3 * Math.sin(2 * t)), RUN.poleR, RUN.poleL);
  }),
  // Attack: guard -> the club raised over the head -> a two-handed smash down in front with a
  // lunge -> back to guard, with no pause at the top. Looped: a unit in melee plays it over and over.
  loopClip('attack', 1.4, 120, (t) => {
    const p = chopPose(t / (2 * Math.PI));
    return bothHands({
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-24 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(14 * DEG * p.step)),
      'shinL.rotation': rotX(20 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    }, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch), [p.prx, p.pry, p.prz], [p.plx, p.ply, p.plz], true);
  }),
  // Death: the knees buckle, he falls on his back, the club lies along the body rolled onto its
  // side, the head a few degrees up: flat along the model it sinks into any rise of the ground.
  onceClip('death', 1.6, 16, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'club', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
  }),
];

export default { name: 'troll', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.63,attack@1.036' };
