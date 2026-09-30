// Troll: a low-poly giant 2.5 m tall (the horn tips), broad and hunched: grey-green skin,
// tusks, small horns, team shoulder pads, sash and loincloth, and a huge studded club in
// the right fist. Own body: the humanoid joints scaled (1.6 wide, 1.43 tall, 1.5 deep). Faces +Z.
// Clips: "idle" (the club head on the ground), "run" (club in both hands), "attack" (looped:
// raise the club over the head, smash it down with both hands and a lunge) and "death" (once, stays down).
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, tween } from '../unit-glb.mjs';
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

// Both hands on the club: the right fist at fist (model space), the club at aim, the left fist
// SPACING along the handle (towards the butt, which is the near end when the head is down).
function bothHands(pose, fist, aim, poleR, poleL) {
  reach(pose, 'armR', 'foreR', fist, poleR, HAND);
  aimJoint(pose, 'club', aim, 0);
  reach(pose, 'armL', 'foreL', add(worldOf(pose, J.club).p, qrot(aim, [0, SPACING, 0])), poleL, HAND);
  return pose;
}
// Head up and tilted toward the body's centre (lat) and forward (pitch).
const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));

// Attack key poses, one per frame of the clip (24), found by a sequential search: the handle >= 1.5 cm
// clear of the body boxes, the fists and elbows outside the torso and head, the head of the club
// above the ground, each frame close to the previous one (no flips). hx/hy/hz — right fist,
// lat/pitch — club, ty/lean — torso, step — lunge, pr*/pl* — the direction the elbows bend to.
const CHOP = [
  { u: 0 / 24, hx: -0.23, hy: 1.8, hz: 0.563, lat: 7.163, pitch: 37.316, ty: -14.032, lean: 9.432, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
  { u: 1 / 24, hx: -0.227, hy: 1.815, hz: 0.546, lat: 7.201, pitch: 32.32, ty: -14.061, lean: 8.987, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 2 / 24, hx: -0.227, hy: 1.849, hz: 0.492, lat: 7.518, pitch: 21.262, ty: -14.588, lean: 8.066, step: 0.3, hips: 1.287, prx: -0.99, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 3 / 24, hx: -0.23, hy: 1.902, hz: 0.409, lat: 7.762, pitch: 6.197, ty: -15.275, lean: 6.468, step: 0.3, hips: 1.287, prx: -0.99, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 4 / 24, hx: -0.232, hy: 1.97, hz: 0.355, lat: 8.272, pitch: 1.97, ty: -16.77, lean: 3.256, step: 0.3, hips: 1.287, prx: -0.99, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.22 },
  { u: 5 / 24, hx: -0.229, hy: 2.051, hz: 0.313, lat: 8.813, pitch: -0.007, ty: -18.659, lean: -0.482, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
  { u: 6 / 24, hx: -0.226, hy: 2.162, hz: 0.263, lat: 9.17, pitch: -2.831, ty: -20.844, lean: -4.825, step: 0.3, hips: 1.287, prx: -0.99, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 7 / 24, hx: -0.224, hy: 2.28, hz: 0.219, lat: 9.652, pitch: -4.051, ty: -22.558, lean: -7.588, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 8 / 24, hx: -0.233, hy: 2.343, hz: 0.071, lat: 9.486, pitch: -17.791, ty: -23.817, lean: -6.924, step: 0.352, hips: 1.278, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.22 },
  { u: 9 / 24, hx: -0.252, hy: 2.314, hz: 0.089, lat: 8.548, pitch: -18.16, ty: -22.643, lean: -4.154, step: 0.521, hips: 1.249, prx: -1, pry: -0.8, prz: 0.01, plx: 1, ply: -0.79, plz: 0.23 },
  { u: 10 / 24, hx: -0.281, hy: 2.261, hz: 0.216, lat: 6.118, pitch: 1.651, ty: -18.747, lean: 0.124, step: 0.737, hips: 1.212, prx: -1, pry: -0.8, prz: 0.01, plx: 1, ply: -0.78, plz: 0.26 },
  { u: 11 / 24, hx: -0.257, hy: 1.907, hz: 0.436, lat: 6.555, pitch: 27.624, ty: -15.258, lean: 11.721, step: 0.922, hips: 1.18, prx: -1, pry: -0.8, prz: 0.01, plx: 0.99, ply: -0.77, plz: 0.26 },
  { u: 12 / 24, hx: -0.245, hy: 1.654, hz: 0.582, lat: 7.081, pitch: 49.432, ty: -12.277, lean: 20.602, step: 1, hips: 1.167, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.78, plz: 0.23 },
  { u: 13 / 24, hx: -0.235, hy: 1.477, hz: 0.677, lat: 7.615, pitch: 70.765, ty: -10.732, lean: 26.258, step: 1, hips: 1.165, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.22 },
  { u: 14 / 24, hx: -0.231, hy: 1.352, hz: 0.734, lat: 7.546, pitch: 88.91, ty: -9.337, lean: 30.55, step: 1, hips: 1.162, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 15 / 24, hx: -0.226, hy: 1.262, hz: 0.769, lat: 7.628, pitch: 107.232, ty: -8.617, lean: 33.646, step: 1, hips: 1.158, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 16 / 24, hx: -0.223, hy: 1.214, hz: 0.778, lat: 7.645, pitch: 121.959, ty: -7.519, lean: 35.471, step: 0.997, hips: 1.157, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.2 },
  { u: 17 / 24, hx: -0.223, hy: 1.212, hz: 0.768, lat: 7.947, pitch: 128.407, ty: -7.17, lean: 35.59, step: 0.887, hips: 1.173, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 18 / 24, hx: -0.229, hy: 1.253, hz: 0.75, lat: 7.877, pitch: 124.28, ty: -7.181, lean: 32.751, step: 0.678, hips: 1.203, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
  { u: 19 / 24, hx: -0.235, hy: 1.308, hz: 0.727, lat: 7.969, pitch: 112.337, ty: -8.091, lean: 28.737, step: 0.457, hips: 1.235, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 20 / 24, hx: -0.238, hy: 1.395, hz: 0.721, lat: 8.037, pitch: 102.642, ty: -9.425, lean: 24.851, step: 0.315, hips: 1.255, prx: -1, pry: -0.8, prz: 0.01, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 21 / 24, hx: -0.238, hy: 1.452, hz: 0.702, lat: 7.969, pitch: 93.189, ty: -11.067, lean: 22.056, step: 0.3, hips: 1.259, prx: -1, pry: -0.8, prz: 0.01, plx: 1, ply: -0.8, plz: 0.19 },
  { u: 22 / 24, hx: -0.237, hy: 1.533, hz: 0.68, lat: 8, pitch: 82.728, ty: -12.063, lean: 19.287, step: 0.3, hips: 1.27, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.19 },
  { u: 23 / 24, hx: -0.237, hy: 1.63, hz: 0.651, lat: 7.773, pitch: 71.866, ty: -12.6, lean: 16.04, step: 0.3, hips: 1.281, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.21 },
  { u: 24 / 24, hx: -0.23, hy: 1.8, hz: 0.563, lat: 7.163, pitch: 37.316, ty: -14.032, lean: 9.432, step: 0.3, hips: 1.287, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.79, plz: 0.21 },
];
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
  // lunge -> hold -> back to guard. Looped: a unit in melee plays it over and over.
  loopClip('attack', 1.4, 24, (t) => {
    const p = tween(t / (2 * Math.PI), CHOP);
    return bothHands({
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-24 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(14 * DEG * p.step)),
      'shinL.rotation': rotX(20 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    }, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch), [p.prx, p.pry, p.prz], [p.plx, p.ply, p.plz]);
  }),
  // Death: the knees buckle, he falls on his back, the club lies along the body rolled onto its
  // side, the head a few degrees up: flat along the model it sinks into any rise of the ground.
  onceClip('death', 1.6, 16, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'club', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
  }),
];

export default { name: 'troll', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.55' };
