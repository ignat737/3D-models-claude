// Unit models for a strategy game: tools/make-units.mjs -> 3D-models/*.glb (shared builder
// tools/unit-glb.mjs). Files on disk match the generators, one mesh + one material each, the
// skeleton and clips are consistent, looped clips have no seam, the death clip ends on the ground.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { IK_MISSES, UNITS, buildGlb, buildMesh, outOf } from '../tools/make-units.mjs';
import { add, qconj, qrot, rig, sub } from '../tools/unit-glb.mjs';
import { extentY } from '../tools/units/horse.mjs';

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
    const limit = unit.maxTriangles || 1000;
    assert.ok(buildMesh(unit).indices.length / 3 <= limit, `не больше ${limit} треугольников`);
    // Every UV sits at a texel centre: a part is one flat colour.
    const uv = floats(gltf, bin, p.attributes.TEXCOORD_0);
    let size = 1;
    while (size * size < unit.palette.length) size *= 2;
    for (const v of uv.data) assert.ok(Math.abs(v * size - Math.floor(v * size) - 0.5) < 1e-6);
    // Feet on the ground in the bind pose.
    assert.ok(Math.abs(gltf.accessors[p.attributes.POSITION].min[1]) < 1e-6);
  });

  test(`${unit.name}: скелет и клипы файла = клипы генератора, idle и run первыми, петли без шва`, () => {
    const { gltf, bin } = parseGlb(buildGlb(unit));
    const skin = gltf.skins[0];
    assert.equal(skin.joints.length, unit.joints.length);
    assert.equal(gltf.accessors[skin.inverseBindMatrices].count, skin.joints.length);
    assert.deepEqual(gltf.animations.map(a => a.name), unit.clips.map(c => c.name));
    assert.deepEqual(gltf.animations.slice(0, 2).map(a => a.name), ['idle', 'run']);
    for (const need of ['attack', 'death']) assert.ok(gltf.animations.some(a => a.name === need), unit.name + ': ' + need);
    for (const [i, anim] of gltf.animations.entries()) {
      if (!unit.clips[i].loop) continue;
      for (const s of anim.samplers) {
        const { data, width, count } = floats(gltf, bin, s.output);
        for (let k = 0; k < width; k++) assert.ok(Math.abs(data[k] - data[(count - 1) * width + k]) < 1e-6, anim.name);
      }
    }
  });

  test(`${unit.name}: death заканчивается лёжа на земле`, (t) => {
    const death = unit.clips.find(c => c.name === 'death');
    assert.equal(death.loop, false);
    const hips = death.tracks.get('hips.translation');
    if (!hips) return t.skip('смерть лошади — отдельный тест');
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

const horseUnit = () => UNITS.find(u => u.name === 'horse');
const swordsmanUnit = () => UNITS.find(u => u.name === 'swordsman');
const poseAt = (clip, f) => Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
// Horse clip <-> rider clip: the same length and number of keys, played together.
const PAIRS = [['idle', 'ride'], ['run', 'rideRun'], ['attack', 'rideAttack'], ['runAttack', 'rideRunAttack'], ['death', 'rideDeath']];

test('лошадь: idle, run, attack, runAttack, death; кость saddle над спиной, без всадника', () => {
  const horse = horseUnit();
  assert.deepEqual(horse.clips.map(c => c.name), ['idle', 'run', 'attack', 'runAttack', 'death']);
  assert.deepEqual(horse.clips.map(c => c.loop), [true, true, true, true, false]);
  const saddle = horse.joints.find(j => j.name === 'saddle');
  assert.ok(saddle && saddle.at[1] > 1.4 && Math.abs(saddle.at[0]) < 1e-9, 'сиденье по центру на высоте спины');
});

test('лошадь: на земле во всех кадрах живых клипов (кроме бега), смерть кончается лёжа на земле', () => {
  const horse = horseUnit();
  for (const name of ['idle', 'attack']) {
    const clip = horse.clips.find(c => c.name === name);
    for (let f = 0; f < clip.times.length; f++) {
      const [low] = extentY(poseAt(clip, f));
      assert.ok(Math.abs(low) < 0.01, `${name} кадр ${f}: копыта ${(low * 100).toFixed(1)} см от земли`);
    }
  }
  const death = horse.clips.find(c => c.name === 'death');
  for (let f = 0; f < death.times.length; f++) assert.ok(extentY(poseAt(death, f))[0] > -0.01, `death кадр ${f}: ушла под землю`);
  const [low, high] = extentY(poseAt(death, death.times.length - 1));
  assert.ok(Math.abs(low) < 0.01 && high < 1.05, 'лежит на боку: ' + high.toFixed(2));
});

test('мечник верхом: каждый клип той же длины и с тем же числом кадров, что клип лошади', () => {
  const horse = horseUnit(), sw = swordsmanUnit();
  for (const [h, r] of PAIRS) {
    const a = horse.clips.find(c => c.name === h), b = sw.clips.find(c => c.name === r);
    assert.ok(a && b, h + '/' + r);
    assert.deepEqual(b.times, a.times, `${r} идёт вместе с ${h}`);
    assert.equal(b.loop, a.loop);
  }
});

test('мечник верхом: ноги по бокам от седла, пока он в седле', () => {
  const { J, worldOf } = rig(swordsmanUnit().joints);
  for (const name of ['ride', 'rideRun', 'rideAttack', 'rideRunAttack', 'rideDeath']) {
    const clip = swordsmanUnit().clips.find(c => c.name === name);
    assert.ok(clip, name);
    const seated = clip.times.length - 1 + (name === 'rideDeath' ? -Math.round(clip.times.length * 0.7) : 0);
    for (let f = 0; f < Math.min(seated + 1, clip.times.length); f++) {
      const pose = poseAt(clip, f);
      assert.ok(pose['hips.translation'][1] < 0.2, name + ' кадр ' + f + ': таз у седла');
      for (const side of ['L', 'R']) assert.ok(Math.abs(worldOf(pose, J['shin' + side]).p[0]) > 0.33, `${name} кадр ${f}: колено ${side} снаружи бока лошади`);
    }
  }
});

// The sword of a rider, sampled every 3 cm, against the horse's boxes (neck, head, body, saddle)
// under the paired horse clip: it must stay clear in every frame while he is in the saddle.
test('мечник верхом: меч не проходит сквозь лошадь ни в одном кадре атаки и бега', () => {
  const horse = horseUnit(), sw = swordsmanUnit();
  const H = rig(horse.joints), R = rig(sw.joints);
  const boxes = horse.parts.filter(p => p.s && !['hoof', 'coatDark'].includes(p.color) && horse.joints[p.joint].name !== 'saddle' || (p.s && p.color === 'leather' && horse.joints[p.joint].name === 'saddle'));
  for (const [h, r] of PAIRS.filter(([h]) => h !== 'death')) {
    const hc = horse.clips.find(c => c.name === h), rc = sw.clips.find(c => c.name === r);
    for (let f = 0; f < hc.times.length; f++) {
      const hp = poseAt(hc, f), rp = poseAt(rc, f), S = H.worldOf(hp, H.J.saddle), sword = R.worldOf(rp, R.J.sword);
      for (let y = -0.1; y <= 0.85; y += 0.03) {
        const local = add(sword.p, qrot(sword.q, [0, y, 0]));
        const pt = add(S.p, qrot(S.q, local));
        for (const b of boxes) {
          const w = H.worldOf(hp, b.joint);
          let rel = add(qrot(qconj(w.q), sub(pt, w.p)), horse.joints[b.joint].at);
          if (b.q) { const pv = b.pivot || b.c; rel = add(pv, qrot(qconj(b.q), sub(rel, pv))); }
          const depth = Math.min(...[0, 1, 2].map(k => b.s[k] / 2 + 0.02 - Math.abs(rel[k] - b.c[k])));
          assert.ok(depth <= 0, `${r} кадр ${f}: меч в ${horse.joints[b.joint].name} (${b.color}) на ${(depth * 100).toFixed(1)} см`);
        }
      }
    }
  }
});

test('мечник верхом: после смерти лошади лежит на земле рядом с ней, не под ней', () => {
  const horse = horseUnit(), sw = swordsmanUnit();
  const H = rig(horse.joints);
  const hc = horse.clips.find(c => c.name === 'death'), rc = sw.clips.find(c => c.name === 'rideDeath');
  const last = hc.times.length - 1, S = H.worldOf(poseAt(hc, last), H.J.saddle), hips = poseAt(rc, last)['hips.translation'];
  const world = add(S.p, qrot(S.q, hips));
  assert.ok(world[1] < 0.3, 'таз у земли: ' + world[1].toFixed(2));
  assert.ok(Math.abs(world[0]) > 0.9, 'в стороне от лошади: ' + world[0].toFixed(2));
});

test('всадник верхом: один файл из лошади и мечника, клипы лошади, 16 цветов, оба набора костей', () => {
  const m = UNITS.find(u => u.name === 'mounted-swordsman'), horse = horseUnit(), sw = swordsmanUnit();
  assert.deepEqual(m.clips.map(c => c.name), horse.clips.map(c => c.name));
  assert.deepEqual(m.clips.map(c => c.loop), horse.clips.map(c => c.loop));
  assert.equal(m.joints.length, horse.joints.length + sw.joints.length);
  assert.equal(new Set(m.joints.map(j => j.name)).size, m.joints.length, 'имена костей уникальны');
  assert.equal(buildMesh(m).indices.length, buildMesh(horse).indices.length + buildMesh(sw).indices.length);
  assert.equal(m.palette.length, 16, 'палитра 4x4');
  for (const clip of m.clips) {
    for (const [key, values] of clip.tracks) assert.equal(values.length, clip.times.length, clip.name + ' ' + key);
    assert.ok(clip.tracks.has('body.translation') && clip.tracks.has('rider_hips.translation'), clip.name + ': лошадь и всадник');
  }
});

test('всадник верхом: мечник сидит на седле (таз над сиденьем) во всех кадрах бега', () => {
  const m = UNITS.find(u => u.name === 'mounted-swordsman'), { J, worldOf } = rig(m.joints);
  const run = m.clips.find(c => c.name === 'run');
  for (let f = 0; f < run.times.length; f++) {
    const pose = poseAt(run, f), saddle = worldOf(pose, J.saddle), hips = worldOf(pose, J.rider_hips);
    const rel = qrot(qconj(saddle.q), sub(hips.p, saddle.p));   // in the saddle's frame: it pitches with the horse
    assert.ok(Math.abs(rel[0]) < 1e-6 && Math.abs(rel[1] - 0.13) < 0.03 && Math.abs(rel[2]) < 1e-6, `кадр ${f}: таз ${rel.map(v => v.toFixed(3))}`);
  }
});
