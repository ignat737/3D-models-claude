// make-units.mjs — low-poly skinned unit models for a strategy game: 3D-models/3D-models-units/<unit>.glb.
// Each unit is described in tools/units/<unit>.mjs (joints, parts, palette, clips) and built by
// tools/unit-glb.mjs into one mesh + one palette material (one draw call per unit).
//
//   node tools/make-units.mjs                # writes every unit
//   node tools/make-units.mjs swordsman      # only the named ones
//   node tools/make-units.mjs --check        # exit 1 if a file on disk differs from its generator
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { IK_MISSES, buildGlb, buildMesh } from './unit-glb.mjs';
import archer from './units/archer.mjs';
import goblin from './units/goblin.mjs';
import goblinWolfRider from './units/goblin-wolf-rider.mjs';
import horse from './units/horse.mjs';
import mountedSwordsman from './units/mounted-swordsman.mjs';
import orc from './units/orc.mjs';
import spearman from './units/spearman.mjs';
import swordsman from './units/swordsman.mjs';
import orcWorker from './units/orc-worker.mjs';
import troll from './units/troll.mjs';
import worker from './units/worker.mjs';
import wolf from './units/wolf.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '3D-models', '3D-models-units');
const UNITS = [swordsman, archer, spearman, orc, goblin, troll, horse, mountedSwordsman, wolf, goblinWolfRider, worker, orcWorker];
const outOf = unit => path.join(OUT_DIR, unit.name + '.glb');

export { UNITS, OUT_DIR, outOf, buildGlb, buildMesh, IK_MISSES };

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const unknown = names.filter(n => !UNITS.some(u => u.name === n));
  if (unknown.length) {
    console.error(`Нет таких юнитов: ${unknown.join(', ')}. Есть: ${UNITS.map(u => u.name).join(', ')}`);
    process.exit(1);
  }
  const chosen = names.length ? UNITS.filter(u => names.includes(u.name)) : UNITS;
  for (const m of IK_MISSES) console.log(`  IK: ${m.joint} не дотягивается на ${m.cm} см (рука висит в воздухе)`);
  let stale = 0;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const unit of chosen) {
    const glb = buildGlb(unit), out = outOf(unit), rel = path.relative(ROOT, out);
    if (process.argv.includes('--check')) {
      const same = fs.existsSync(out) && fs.readFileSync(out).equals(glb);
      if (!same) stale++;
      console.log(same ? `${rel}: совпадает с генератором` : `${rel}: отличается от генератора`);
      continue;
    }
    fs.writeFileSync(out, glb);
    const tris = buildMesh(unit).indices.length / 3;
    console.log(`${rel}: ${glb.length} байт, ${tris} треугольников, ${unit.joints.length} костей, клипы: ${unit.clips.map(c => c.name).join(', ')}`);
  }
  process.exit(stale ? 1 : 0);
}
