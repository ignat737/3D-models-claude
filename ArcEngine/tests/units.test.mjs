// Unit models for a strategy game: tools/make-units.mjs -> 3D-models/*.glb (shared builder
// tools/unit-glb.mjs). Files on disk match the generators, one mesh + one material each, the
// skeleton and clips are consistent, looped clips have no seam, the death clip ends on the ground.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { IK_MISSES, UNITS, buildGlb, buildMesh, outOf } from '../tools/make-units.mjs';
import { add, qconj, qrot, rig, sub } from '../tools/unit-glb.mjs';

function parseGlb(buf) {
  assert.equal(buf.toString('latin1', 0, 4), 'glTF');
  assert.equal(buf.readUInt32LE(8), buf.length, 'длина в заголовке');
  const jsonLength = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
  const bin = buf.subarray(20 + jsonLength + 8);
  return { gltf, bin };
}

const floats = (gltf, bin, index) => {
  const a = gltf.accessors[index], view = gltf.bufferViews[a.bufferView];
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  return { data: new Float32Array(bin.buffer, bin.byteOffset + view.byteOffset, a.count * width), width, count: a.count };
};

for (const unit of UNITS) {
  test(`${unit.name}.glb на диске совпадает с генератором (node tools/make-units.mjs)`, () => {
    assert.ok(fs.readFileSync(outOf(unit)).equals(buildGlb(unit)));
  });

  test(`${unit.name}: один меш, один материал с палитрой, low-poly`, () => {
    const { gltf, bin } = parseGlb(buildGlb(unit));
    assert.equal(gltf.buffers[0].byteLength, bin.length);
    for (const v of gltf.bufferViews) assert.ok(v.byteOffset + v.byteLength <= bin.length);
    assert.equal(gltf.meshes.length, 1);
    assert.equal(gltf.meshes[0].primitives.length, 1, 'один draw call на юнит');
    assert.equal(gltf.materials.length, 1);
    const p = gltf.meshes[0].primitives[0];
    const n = gltf.accessors[p.attributes.POSITION].count;
    for (const key of ['NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']) assert.equal(gltf.accessors[p.attributes[key]].count, n, key);
    const img = gltf.bufferViews[gltf.images[0].bufferView];
    assert.equal(bin.toString('latin1', img.byteOffset + 1, img.byteOffset + 4), 'PNG');
    assert.equal(gltf.samplers[0].minFilter, 9728, 'без мипмапов: палитра не сереет вдали');
    assert.ok(buildMesh(unit).indices.length / 3 <= 1000, 'не больше 1000 треугольников');
    // Every UV sits at a texel centre: a part is one flat colour.
    const uv = floats(gltf, bin, p.attributes.TEXCOORD_0);
    let size = 1;
    while (size * size < unit.palette.length) size *= 2;
    for (const v of uv.data) assert.ok(Math.abs(v * size - Math.floor(v * size) - 0.5) < 1e-6);
    // Feet on the ground in the bind pose.
    assert.ok(Math.abs(gltf.accessors[p.attributes.POSITION].min[1]) < 1e-6);
  });

  test(`${unit.name}: скелет и клипы idle/run/attack/death, петли без шва`, () => {
    const { gltf, bin } = parseGlb(buildGlb(unit));
    const skin = gltf.skins[0];
    assert.equal(skin.joints.length, unit.joints.length);
    assert.equal(gltf.accessors[skin.inverseBindMatrices].count, skin.joints.length);
    assert.deepEqual(gltf.animations.map(a => a.name), ['idle', 'run', 'attack', 'death']);
    for (const [i, anim] of gltf.animations.entries()) {
      if (!unit.clips[i].loop) continue;
      for (const s of anim.samplers) {
        const { data, width, count } = floats(gltf, bin, s.output);
        for (let k = 0; k < width; k++) assert.ok(Math.abs(data[k] - data[(count - 1) * width + k]) < 1e-6, anim.name);
      }
    }
  });

  test(`${unit.name}: death заканчивается лёжа на земле`, () => {
    const death = unit.clips.find(c => c.name === 'death');
    assert.equal(death.loop, false);
    const hips = death.tracks.get('hips.translation');
    assert.ok(hips[hips.length - 1][1] < 0.25, 'таз у земли');
  });
}

test('юниты: руки дотягиваются до целей IK (древко, тетива)', () => {
  assert.deepEqual(IK_MISSES, []);
});

// A weapon's shaft axis, sampled every 2 cm, against the body boxes (torso, belt, hips, head,
// legs, arms) in every frame of idle/run/attack: it must stay outside by its radius. Frames where
// the item is hidden (scale < 1: a thrown javelin) are skipped. The troll's club is checked along
// its handle only: its head is meant to come close in a smash.
const BODY_ALL = ['torso', 'hips', 'head', 'legL', 'legR', 'shinL', 'shinR', 'armL', 'armR'];
for (const { unit: name, joint, radius, from, to, body, title } of [
  { unit: 'spearman', joint: 'spear', radius: 0.022, from: -0.8, to: 1.8, body: BODY_ALL, title: 'копейщик: древко' },
  { unit: 'orc', joint: 'axe', radius: 0.032, from: -0.2, to: 1.5, body: BODY_ALL, title: 'орк: древко топора' },
  { unit: 'goblin', joint: 'spear', radius: 0.018, from: -0.75, to: 0.72, body: BODY_ALL, title: 'гоблин: древко копья' },
  { unit: 'troll', joint: 'club', radius: 0.06, from: -0.42, to: 0.5, body: BODY_ALL, title: 'тролль: рукоять дубины' },
]) {
  test(`${title} не проходит сквозь тело ни в одном кадре`, () => {
    const unit = UNITS.find(u => u.name === name);
    const { J, worldOf } = rig(unit.joints);
    const boxes = unit.parts.filter(p => p.s && !p.q && p.s[0] > 0.1 && body.includes(unit.joints[p.joint].name));
    for (const clip of unit.clips.filter(c => c.name !== 'death')) {
      const scale = clip.tracks.get(joint + '.scale');
      for (let f = 0; f < clip.times.length; f++) {
        if (scale && scale[f][0] < 1) continue;
        const pose = Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
        const shaft = worldOf(pose, J[joint]);
        for (let y = from; y <= to; y += 0.02) {
          const pt = add(shaft.p, qrot(shaft.q, [0, y, 0]));
          for (const b of boxes) {
            const w = worldOf(pose, b.joint);
            const rel = sub(add(qrot(qconj(w.q), sub(pt, w.p)), unit.joints[b.joint].at), b.c);
            const depth = Math.min(...[0, 1, 2].map(k => b.s[k] / 2 + radius - Math.abs(rel[k])));
            assert.ok(depth <= 0, `${clip.name} кадр ${f}: древко в ${unit.joints[b.joint].name} на ${(depth * 100).toFixed(1)} см`);
          }
        }
      }
    }
  });
}

test('юниты: имена уникальны, у каждого поле preview с его клипами', () => {
  assert.equal(new Set(UNITS.map(u => u.name)).size, UNITS.length);
  for (const unit of UNITS) {
    for (const p of unit.preview.split(',')) assert.ok(unit.clips.some(c => c.name === p.split('@')[0]), unit.name + ': ' + p);
  }
});
