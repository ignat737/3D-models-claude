// unit-preview.mjs — a picture of a unit from 3D-models/ in the real game scene (toon shader,
// outline, shadows, terrain), rendered by headless Chrome (tools/browser.mjs): the way to LOOK
// at a unit without the Browser pane. Also runs Debug3D.lint() and fails on its errors.
//
//   node tools/unit-preview.mjs swordsman                # 3D-models/previews/swordsman.png
//   node tools/unit-preview.mjs swordsman --squad        # 3D-models/previews/swordsman-squad.png
//   node tools/unit-preview.mjs swordsman --pose=run@0.16,death@1.3 --out=shot.png
//   node tools/unit-preview.mjs swordsman --near         # close-up of the first pose (details)
//   node tools/unit-preview.mjs archer --heading=90      # every unit turned: 90 — seen from its left side
//   node tools/unit-preview.mjs horse --rider=swordsman  # the horse with a swordsman in the saddle
//   node tools/unit-preview.mjs peasant-house           # a building (static): views from the corners
//   node tools/unit-preview.mjs peasant-house --squad   # a hamlet of 6 from the RTS camera
//   node tools/unit-preview.mjs peasant-house --with=spearman   # a unit standing by the building
//   --gap=90: spacing of the poses in px (the default fits a standing unit; a fallen one is wider)
//
// --pose: clip@seconds, one unit per pose, side by side (default: the unit's `preview` field).
// --squad: 30 units in 5 ranks, clips idle/run/attack mixed, from an RTS camera height.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { ROOT, openGame, lint } from './browser.mjs';
import { UNITS, buildGlb, outOf as unitOut } from './make-units.mjs';
import { BUILDINGS, outOf as buildingOut } from './make-buildings.mjs';

const outOf = u => (u.static ? buildingOut(u) : unitOut(u));

// Runs in the page. Units stand south of the kit's farmer and mill, the view is framed from the
// terrain height there: absolute heights would put the eye inside a hill.
function placeScript(file, poses, mode, heading, gap, riderFile, withFile, withAt, zoom = 1) {
  return `
const view = app.location.view, scene = view.scene, T = app.location.terrain;
const model = await Model3D.load(${JSON.stringify(file)}, scene);
const riderModel = ${JSON.stringify(riderFile)} ? await Model3D.load(${JSON.stringify(riderFile)}, scene) : null;
const withModel = ${JSON.stringify(withFile)} ? await Model3D.load(${JSON.stringify(withFile)}, scene) : null;
const units = [];
const freeze = (m, clip, sec) => {
  const c = Model3D.clips(m);
  if (!c.play(clip, { blend: 0 })) throw new Error('у модели нет клипа ' + clip + ': ' + c.names().join(', '));
  c._tick(1);
  const g = c.tracks.get(clip).group;
  g.pause();
  g.goToFrame(Math.min(sec * 60, g.to));
};
const add = (x, y, heading, clip, sec) => {
  const u = Model3D.build(model, scene, { name: 'preview' + units.length });
  World3D.addObject(view, u, 'actor');
  u.position.set(x, T.heightAt(x, y), y);
  u.scaling.setAll(0.25);
  u.rotation.y = heading;
  if (clip) freeze(u, clip, sec);
  if (riderModel) {
    // The mount's idle / run pair with the rider's seated clips.
    const r = Model3D.build(riderModel, scene, { name: 'rider' + units.length });
    World3D.addObject(view, r, 'actor');
    if (!Model3D.mount(r, u, 'saddle')) throw new Error('у модели нет кости saddle');
    freeze(r, clip === 'idle' ? 'ride' : 'ride' + clip[0].toUpperCase() + clip.slice(1), sec);
  }
  units.push(u);
  return u;
};
const poses = ${JSON.stringify(poses)}, mode = ${JSON.stringify(mode)}, heading = ${JSON.stringify(heading)}, gap = ${JSON.stringify(gap)};
let pose;
if (mode === 'squad' && !model.clips.length) {
  // A hamlet: two rows of three, turned a little differently.
  const w = gap;
  for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) add(960 + r * w * 1.35, 1020 + k * w * 1.4, Math.PI * (0.85 + 0.1 * ((r + k * 2) % 3)), null, 0);
  const cx = 960 + 0.68 * w, cy = 1020 + 1.4 * w, h = T.heightAt(cx, cy);
  pose = { eye: [cx - 3.4 * w, cy, h + 2.3 * w], target: [cx, cy, h + 0.1 * w] };
} else if (mode === 'squad') {
  // Ranks and files scale with the unit's length (gap / 28: 1 for a human).
  const g = gap / 28, rank = 16 * (1 + (g - 1) * 1.3), file = 15 * g, f = Math.pow(g, 0.9);
  const clips = ['idle', 'run', 'attack', 'runAttack'].filter(c => model.clips.includes(c));
  for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) {
    add(960 + r * rank + (k % 2) * 4 * g, 1020 + k * file, Math.PI * 0.9, clips[(r + k) % clips.length], ((r * 7 + k * 3) % 10) / 10 * 0.6);
  }
  const cx = 960 + 2 * rank + 2 * g, cy = 1020 + 2.5 * file, h = T.heightAt(cx, cy);
  pose = { eye: [cx - 130 * f, cy, h + 160 * f], target: [cx, cy, h] };
} else {
  // heading: the camera looks along +X, a unit at rotation PI faces it; +90° shows its left side.
  poses.forEach((p, i) => add(1000 + 6 * i, 1130 + gap * i, p.heading !== undefined ? Math.PI + p.heading * Math.PI / 180 : heading === null ? Math.PI * (i % 2 ? 0.95 : 1.12) : Math.PI + heading * Math.PI / 180, p.clip, p.sec));
  const cx = 1000 + 3 * (poses.length - 1), cy = 1130 + gap / 2 * (poses.length - 1), h = T.heightAt(cx, cy);
  const k = mode === 'near' ? 0.55 * Math.pow(gap / 28, 0.8) : Math.max(1.3, poses.length * 0.65 * Math.sqrt(gap / 28)) * (model.clips.length ? 1 : 1.35) * (withModel ? 1.9 : 1) * ${JSON.stringify(zoom)};
  pose = { eye: [cx - 58 * k, cy - 16 * k, h + 22 + 12 * k], target: [cx, cy, h + (mode === 'near' ? 30 : 20)] };
}
if (withModel) {
  // A unit by the building: placed in the building's model frame (meters: x along the ridge,
  // z out of the door side), facing the same way as the front, in its idle.
  const house = units[0], fit = house.getChildTransformNodes(true)[0];
  const at = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(${JSON.stringify(withAt[0])}, 0, ${JSON.stringify(withAt[1])}), fit.computeWorldMatrix(true));
  const u = Model3D.build(withModel, scene, { name: 'with' });
  World3D.addObject(view, u, 'actor');
  u.position.set(at.x, T.heightAt(at.x, at.z), at.z);
  u.scaling.setAll(0.25);
  u.rotation.y = house.rotation.y;
  freeze(u, 'idle', 0.6);
  units.push(u);
}
const meshes = units.flatMap(u => u.getChildMeshes());
for (let i = 0; i < 150 && !meshes.every(m => !m.material || m.material.isReady(m)); i++) await new Promise(r => setTimeout(r, 200));
const held = Debug3D.hold(pose);
Debug3D.frames(10);
await new Promise(r => setTimeout(r, 500));
Debug3D.frames(10);
return { units: units.length, clips: model.clips, clamped: !!(held && held.clamped) };
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
  const name = process.argv.slice(2).find(a => !a.startsWith('--'));
  const unit = [...UNITS, ...BUILDINGS].find(u => u.name === name);
  if (!unit) {
    console.error(`Укажи юнит или здание: ${[...UNITS, ...BUILDINGS].map(u => u.name).join(', ')}`);
    process.exit(1);
  }
  const file = outOf(unit);
  if (!fs.existsSync(file) || !fs.readFileSync(file).equals(buildGlb(unit))) {
    console.error(`${path.relative(ROOT, file)} не совпадает с генератором: сначала node tools/make-units.mjs ${unit.name}`);
    process.exit(1);
  }
  const riderUnit = arg('rider') ? UNITS.find(u => u.name === arg('rider')) : null;
  if (arg('rider') && !riderUnit) {
    console.error(`Нет юнита-всадника ${arg('rider')}. Есть: ${UNITS.map(u => u.name).join(', ')}`);
    process.exit(1);
  }
  const riderFile = riderUnit ? path.relative(ROOT, outOf(riderUnit)).split(path.sep).join('/') : null;
  const withUnit = arg('with') ? UNITS.find(u => u.name === arg('with')) : null;
  if (arg('with') && (!withUnit || !unit.static)) {
    console.error(`--with: юнит из ${UNITS.map(u => u.name).join(', ')} и только рядом со зданием`);
    process.exit(1);
  }
  const withFile = withUnit ? path.relative(ROOT, outOf(withUnit)).split(path.sep).join('/') : null;
  const mode = process.argv.includes('--squad') ? 'squad' : process.argv.includes('--near') ? 'near' : 'row';
  const poses = unit.static
    // A building has no clips: --pose lists headings in degrees (0 — the front, 90 — its left side).
    ? (arg('pose') || (mode === 'near' ? '30' : unit.preview)).split(',').map(h => ({ clip: null, sec: 0, heading: Number(h) }))
    : (arg('pose') || (mode === 'near' ? 'idle@0.6' : (riderUnit && unit.riderPreview) || unit.preview || 'idle@0.6,attack@0.5')).split(',').map((s) => {
      const [clip, sec] = s.split('@');
      return { clip, sec: Number(sec) || 0 };
    });
  const out = path.resolve(arg('out') || path.join(path.dirname(file), 'previews', unit.name + (riderUnit ? '-' + riderUnit.name : '') + (withUnit ? '-' + withUnit.name : '') + (mode === 'squad' ? '-squad' : mode === 'near' ? '-near' : '') + '.png'));
  let failed = false;
  const page = await openGame().catch((e) => {
    console.error(String(e && e.message || e));
    process.exit(1);
  });
  try {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const heading = arg('heading') === '' ? null : Number(arg('heading'));
    const info = await page.eval(placeScript(rel, poses, mode, heading, Number(arg('gap')) || unit.previewGap || 28, riderFile, withFile, unit.withAt || [-3.0, 2.2], unit.previewZoom || 1));
    if (info.clamped) console.log('  камера поднята над землёй (Debug3D.hold clamped): кадр может быть не тем');
    await page.shot(out);
    const findings = await lint(page);
    for (const f of findings) console.log(`  lint ${f.level}: ${f.code} ${f.target} — ${f.message}`);
    failed = findings.some(f => f.level === 'error');
    console.log(`${path.relative(ROOT, out)}: юнитов ${info.units}, клипы файла: ${info.clips.join(', ')}; lint: ${findings.length ? findings.length + ' замечаний' : 'чисто'}`);
  } catch (e) {
    console.error(String(e && e.stack || e));
    failed = true;
  } finally {
    for (const l of page.logs) console.log(`  console ${l.type}: ${l.text}`);
    failed = failed || page.logs.some(l => l.type === 'exception');
    await page.close();
  }
  process.exit(failed ? 1 : 0);
}
