// make-buildings.mjs — low-poly static building models: 3D-models/3D-models-buildings/<building>.glb.
// A building is described in tools/buildings/<building>.mjs (palette, parts) and built by the same
// tools/unit-glb.mjs as the units: one mesh, one palette material, no skeleton, no animation.
//
//   node tools/make-buildings.mjs                  # writes every building
//   node tools/make-buildings.mjs peasant-house    # only the named ones
//   node tools/make-buildings.mjs --check          # exit 1 if a file on disk differs from its generator
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { buildGlb, buildMesh } from './unit-glb.mjs';
import peasantHouse from './buildings/peasant-house.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '3D-models', '3D-models-buildings');
const BUILDINGS = [peasantHouse];
const outOf = building => path.join(OUT_DIR, building.name + '.glb');

export { BUILDINGS, OUT_DIR, outOf, buildGlb, buildMesh };

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const unknown = names.filter(n => !BUILDINGS.some(b => b.name === n));
  if (unknown.length) {
    console.error(`Нет таких зданий: ${unknown.join(', ')}. Есть: ${BUILDINGS.map(b => b.name).join(', ')}`);
    process.exit(1);
  }
  const chosen = names.length ? BUILDINGS.filter(b => names.includes(b.name)) : BUILDINGS;
  let stale = 0;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const building of chosen) {
    const glb = buildGlb(building), out = outOf(building), rel = path.relative(ROOT, out);
    if (process.argv.includes('--check')) {
      const same = fs.existsSync(out) && fs.readFileSync(out).equals(glb);
      if (!same) stale++;
      console.log(same ? `${rel}: совпадает с генератором` : `${rel}: отличается от генератора`);
      continue;
    }
    fs.writeFileSync(out, glb);
    console.log(`${rel}: ${glb.length} байт, ${buildMesh(building).indices.length / 3} треугольников`);
  }
  process.exit(stale ? 1 : 0);
}
