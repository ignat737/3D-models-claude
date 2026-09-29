// unit-preview.mjs — a picture of a unit from 3D-models/ in the real game scene (toon shader,
// outline, shadows, terrain), rendered by headless Chrome (tools/browser.mjs): the way to LOOK
// at a unit without the Browser pane. Also runs Debug3D.lint() and fails on its errors.
//
//   node tools/unit-preview.mjs swordsman                # 3D-models/previews/swordsman.png
//   node tools/unit-preview.mjs swordsman --squad        # 3D-models/previews/swordsman-squad.png
//   node tools/unit-preview.mjs swordsman --pose=run@0.16,death@1.3 --out=shot.png
//   node tools/unit-preview.mjs swordsman --near         # close-up of the first pose (details)
//   node tools/unit-preview.mjs archer --heading=90      # every unit turned: 90 — seen from its left side
//
// --pose: clip@seconds, one unit per pose, side by side (default: the unit's `preview` field).
// --squad: 30 units in 5 ranks, clips idle/run/attack mixed, from an RTS camera height.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { ROOT, openGame, lint } from './browser.mjs';
import { UNITS, buildGlb, outOf } from './make-units.mjs';

// Runs in the page. Units stand south of the kit's farmer and mill, the view is framed from the
// terrain height there: absolute heights would put the eye inside a hill.
function placeScript(file, poses, mode, heading) {
  return `
const view = app.location.view, scene = view.scene, T = app.location.terrain;
const model = await Model3D.load(${JSON.stringify(file)}, scene);
const units = [];
const add = (x, y, heading, clip, sec) => {
  const u = Model3D.build(model, scene, { name: 'preview' + units.length });
  World3D.addObject(view, u, 'actor');
  u.position.set(x, T.heightAt(x, y), y);
  u.scaling.setAll(0.25);
  u.rotation.y = heading;
  const c = Model3D.clips(u);
  if (!c.play(clip, { blend: 0 })) throw new Error('у модели нет клипа ' + clip + ': ' + c.names().join(', '));
  c._tick(1);
  const g = c.tracks.get(clip).group;
  g.pause();
  g.goToFrame(Math.min(sec * 60, g.to));
  units.push(u);
};
const poses = ${JSON.stringify(poses)}, mode = ${JSON.stringify(mode)}, heading = ${JSON.stringify(heading)};
let pose;
if (mode === 'squad') {
  const clips = ['idle', 'run', 'attack'];
  for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) {
    add(960 + r * 16 + (k % 2) * 4, 1020 + k * 15, Math.PI * 0.9, clips[(r + k) % 3], ((r * 7 + k * 3) % 10) / 10 * 0.6);
  }
  const h = T.heightAt(1000, 1060);
  pose = { eye: [870, 1060, h + 160], target: [1000, 1060, h] };
} else {
  // heading: the camera looks along +X, a unit at rotation PI faces it; +90° shows its left side.
  poses.forEach((p, i) => add(1000 + 6 * i, 1130 + 28 * i, heading === null ? Math.PI * (i % 2 ? 0.95 : 1.12) : Math.PI + heading * Math.PI / 180, p.clip, p.sec));
  const cx = 1000 + 3 * (poses.length - 1), cy = 1130 + 14 * (poses.length - 1), h = T.heightAt(cx, cy);
  const k = mode === 'near' ? 0.55 : Math.max(1.3, poses.length * 0.65);
  pose = { eye: [cx - 58 * k, cy - 16 * k, h + 22 + 12 * k], target: [cx, cy, h + (mode === 'near' ? 30 : 20)] };
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
  const unit = UNITS.find(u => u.name === name);
  if (!unit) {
    console.error(`Укажи юнит: ${UNITS.map(u => u.name).join(', ')}`);
    process.exit(1);
  }
  const file = outOf(unit);
  if (!fs.existsSync(file) || !fs.readFileSync(file).equals(buildGlb(unit))) {
    console.error(`${path.relative(ROOT, file)} не совпадает с генератором: сначала node tools/make-units.mjs ${unit.name}`);
    process.exit(1);
  }
  const mode = process.argv.includes('--squad') ? 'squad' : process.argv.includes('--near') ? 'near' : 'row';
  const poses = (arg('pose') || (mode === 'near' ? 'idle@0.6' : unit.preview || 'idle@0.6,attack@0.5')).split(',').map((s) => {
    const [clip, sec] = s.split('@');
    return { clip, sec: Number(sec) || 0 };
  });
  const out = path.resolve(arg('out') || path.join(ROOT, '3D-models', 'previews', unit.name + (mode === 'squad' ? '-squad' : mode === 'near' ? '-near' : '') + '.png'));
  let failed = false;
  const page = await openGame().catch((e) => {
    console.error(String(e && e.message || e));
    process.exit(1);
  });
  try {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const heading = arg('heading') === '' ? null : Number(arg('heading'));
    const info = await page.eval(placeScript(rel, poses, mode, heading));
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
