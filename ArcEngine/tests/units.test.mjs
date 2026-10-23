// Unit models for a strategy game: tools/make-units.mjs -> 3D-models/3D-models-units/*.glb (shared builder
// tools/unit-glb.mjs). Files on disk match the generators, one mesh + one material each, the
// skeleton and clips are consistent, looped clips have no seam, the death clip ends on the ground.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { IK_MISSES, UNITS, buildGlb, buildMesh, outOf } from '../tools/make-units.mjs';
import { add, dot, qconj, qrot, rig, sub } from '../tools/unit-glb.mjs';
import { extentY } from '../tools/units/horse.mjs';
import { SCALE, extentY as wolfExtentY } from '../tools/units/wolf.mjs';
import { riderMinY } from '../tools/units/goblin-wolf-rider.mjs';
import { HAND } from '../tools/units/humanoid.mjs';
import { DEBRIS_JOINTS, lowest as catapultLowest } from '../tools/units/catapult.mjs';
import * as humanTower from '../tools/units/siege-tower.mjs';
import * as orcTower from '../tools/units/orc-siege-tower.mjs';
import * as humanRam from '../tools/units/battering-ram.mjs';
import * as orcRam from '../tools/units/orc-battering-ram.mjs';
import { DEBRIS_JOINTS as BALLISTA_DEBRIS, lowest as ballistaLowest } from '../tools/units/orc-ballista.mjs';
import { clashes, sampledPose } from './unit-collision.mjs';

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
    for (const need of unit.worker ? ['chop', 'mine', 'death'] : ['attack', 'death']) assert.ok(gltf.animations.some(a => a.name === need), unit.name + ': ' + need);
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
    if (!hips) return t.skip('без таза (лошадь, волк, катапульта) — отдельный тест');
    assert.ok(hips[hips.length - 1][1] < 0.25, 'таз у земли');
  });
}

for (const name of ['worker', 'orc-worker']) {
  test(`${name}: клипы idle, run, chop, mine, death; в руке только рабочий инструмент, остальные неподвижно на спине, ступни на земле в chop и mine`, () => {
    const unit = UNITS.find(u => u.name === name), { J, worldOf } = rig(unit.joints);
    assert.deepEqual(unit.clips.map(c => c.name), ['idle', 'run', 'chop', 'mine', 'death']);
    assert.equal(unit.joints[J.axe].parent, J.torso, 'инструменты висят на торсе');
    const shin = unit.joints[J.shinL].at[1];
    const inHand = { chop: 'axe', mine: 'pick' };
    for (const clip of unit.clips) {
      assert.equal(clip.loop, clip.name !== 'death', clip.name);
      assert.equal(clip.tracks.has('axe.scale') || clip.tracks.has('pick.scale'), false, 'инструмент не прячется масштабом');
      for (const tool of ['axe', 'pick']) {
        const rot = clip.tracks.get(tool + '.rotation'), tr = clip.tracks.get(tool + '.translation');
        assert.ok(rot && tr, `${clip.name}: ${tool} задан в каждом кадре`);
        for (let f = 0; f < clip.times.length; f++) {
          const pose = Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
          const torso = worldOf(pose, J.torso), t = worldOf(pose, J[tool]);
          const local = qrot(qconj(torso.q), sub(t.p, torso.p));
          if (inHand[clip.name] === tool) {
            assert.ok(local[2] > 0.1, `${clip.name} кадр ${f}: ${tool} в руке перед торсом`);
          } else {
            assert.deepEqual(tr[f], tr[0], `${clip.name}: ${tool} на спине не двигается относительно торса`);
            assert.deepEqual(rot[f], rot[0]);
            assert.ok(local[2] < -0.15, `${clip.name}: ${tool} за спиной`);
          }
        }
      }
      if (clip.name !== 'chop' && clip.name !== 'mine') continue;
      for (let f = 0; f < clip.times.length; f++) {
        const pose = Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
        const heels = ['shinL', 'shinR'].map(n => worldOf(pose, J[n]).p[1] + qrot(worldOf(pose, J[n]).q, [0, -shin, 0])[1]);
        assert.ok(Math.abs(Math.min(...heels)) < 1e-6, `${clip.name} кадр ${f}: ступня не на земле`);
      }
    }
  });
}

// The chop is a flat sweep: the haft stays within 10 degrees of the horizontal plane in every frame,
// and the edge-leading end passes across the body (the haft yaw changes by more than 60 degrees).
for (const name of ['worker', 'orc-worker']) {
  test(`${name}: рубка идёт в горизонтальной плоскости`, () => {
    const unit = UNITS.find(u => u.name === name), { J, worldOf } = rig(unit.joints);
    const clip = unit.clips.find(c => c.name === 'chop');
    const yaws = [];
    for (let f = 0; f < clip.times.length; f++) {
      const pose = Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
      const dir = qrot(worldOf(pose, J.axe).q, [0, 1, 0]);
      assert.ok(Math.abs(dir[1]) < Math.sin(10 * Math.PI / 180), `кадр ${f}: древко наклонено, y=${dir[1].toFixed(2)}`);
      yaws.push(Math.atan2(dir[0], dir[2]) * 180 / Math.PI);
    }
    assert.ok(Math.max(...yaws) - Math.min(...yaws) > 60, 'взмах не меньше 60° по горизонту');
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
  { unit: 'worker', joint: 'axe', radius: 0.03, from: 0, to: 0.8, body: BODY_ALL, title: 'рабочий: древко топора' },
  { unit: 'worker', joint: 'pick', radius: 0.03, from: 0, to: 0.8, body: BODY_ALL, title: 'рабочий: древко кирки' },
  { unit: 'orc-worker', joint: 'axe', radius: 0.035, from: 0, to: 0.92, body: BODY_ALL, title: 'орк-рабочий: древко топора' },
  { unit: 'orc-worker', joint: 'pick', radius: 0.035, from: 0, to: 0.92, body: BODY_ALL, title: 'орк-рабочий: древко кирки' },
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

test('орк: ограниченный замах у макушки, топор наклонён вверх за головой', () => {
  const unit = UNITS.find(u => u.name === 'orc'), { J, worldOf } = rig(unit.joints);
  const clip = unit.clips.find(c => c.name === 'attack');
  const pose = sampledPose(clip, (clip.times.length - 1) * 0.45);
  const axe = worldOf(pose, J.axe), head = worldOf(pose, J.head);
  const left = add(axe.p, qrot(axe.q, [0, 0.3, 0]));
  assert.ok(Math.min(axe.p[1], left[1]) > head.p[1] + 0.28, 'двуручный хват поднят к макушке');
  const bit = add(axe.p, qrot(axe.q, [0, 1.36, 0]));
  assert.ok(bit[2] < head.p[2] - 0.8, 'голова топора отведена за голову орка');
  assert.ok(bit[1] > axe.p[1] + 0.4, 'топор остаётся наклонённым вверх в верхней точке');
  assert.ok(qrot(axe.q, [0, 1, 0])[2] > -Math.sin(70 * Math.PI / 180), 'замах ограничен, топор не проваливается за спину');
});

test('орк: кисти держат древко на всей дуге удара, включая промежутки между ключами', () => {
  const unit = UNITS.find(u => u.name === 'orc'), { J, worldOf } = rig(unit.joints);
  const clip = unit.clips.find(c => c.name === 'attack'), last = clip.times.length - 1;
  for (let f = 0; f <= last * 8; f++) {
    const pose = sampledPose(clip, f / 8), axe = worldOf(pose, J.axe);
    for (const [side, offset] of [['R', 0], ['L', 0.3]]) {
      const fore = worldOf(pose, J['fore' + side]);
      const fist = add(fore.p, qrot(fore.q, [0, -0.34, 0]));
      const grip = add(axe.p, qrot(axe.q, [0, offset, 0]));
      assert.ok(Math.hypot(...sub(fist, grip)) < 0.015, 'кадр ' + f / 8 + ': кисть ' + side + ' держит древко');
    }
  }
});

test('орк: весь топор обходит голову и тело между ключевыми позами', () => {
  const unit = UNITS.find(u => u.name === 'orc');
  const name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['attack'], p => name(p) === 'axe',
    p => BODY_ALL.includes(name(p))), []);
});

test('тролль: ограниченный замах над головой, дубина наклонена вверх за спиной', () => {
  const unit = UNITS.find(u => u.name === 'troll'), { J, worldOf } = rig(unit.joints);
  const clip = unit.clips.find(c => c.name === 'attack');
  const pose = sampledPose(clip, (clip.times.length - 1) * 0.45);
  const club = worldOf(pose, J.club), head = worldOf(pose, J.head);
  const left = add(club.p, qrot(club.q, [0, -0.24, 0]));
  assert.ok(Math.min(club.p[1], left[1]) > head.p[1] + 0.28, 'двуручный хват поднят к макушке');
  const tip = add(club.p, qrot(club.q, [0, 1.28, 0]));
  assert.ok(tip[2] < head.p[2] - 0.8, 'голова дубины отведена назад');
  assert.ok(tip[1] > club.p[1] + 0.4, 'дубина наклонена вверх, без глубокого замаха за спину');
});

test('тролль: кисти держат рукоять на всей дуге удара, включая промежутки между ключами', () => {
  const unit = UNITS.find(u => u.name === 'troll'), { J, worldOf } = rig(unit.joints);
  const clip = unit.clips.find(c => c.name === 'attack'), last = clip.times.length - 1;
  for (let f = 0; f <= last * 8; f++) {
    const pose = sampledPose(clip, f / 8), club = worldOf(pose, J.club);
    for (const [side, offset] of [['R', 0], ['L', -0.24]]) {
      const fore = worldOf(pose, J['fore' + side]);
      const fist = add(fore.p, qrot(fore.q, [0, -HAND * 1.43, 0]));
      const grip = add(club.p, qrot(club.q, [0, offset, 0]));
      assert.ok(Math.hypot(...sub(fist, grip)) < 0.015, 'кадр ' + f / 8 + ': кисть ' + side + ' держит рукоять');
    }
  }
});

test('тролль: вся дубина обходит голову и тело между ключевыми позами', () => {
  const unit = UNITS.find(u => u.name === 'troll');
  const name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['attack'], p => name(p) === 'club',
    p => BODY_ALL.includes(name(p))), []);
});

test('юниты: имена уникальны, у каждого поле preview с его клипами', () => {
  assert.equal(new Set(UNITS.map(u => u.name)).size, UNITS.length);
  for (const unit of UNITS) {
    for (const p of unit.preview.split(',')) assert.ok(unit.clips.some(c => c.name === p.split('@')[0]), unit.name + ': ' + p);
  }
});

const horseUnit = () => UNITS.find(u => u.name === 'horse');
const swordsmanUnit = () => UNITS.find(u => u.name === 'swordsman');
const poseAt = (clip, f) => Object.fromEntries([...clip.tracks].map(([k, v]) => [k, v[f]]));
const drawingFist = (worldOf, J, pose) => {
  const fore = worldOf(pose, J.foreR);
  return add(fore.p, qrot(fore.q, [0, -HAND, 0]));
};
test('лучник: рука поднимается над головой, берёт стрелу сзади и возвращается по той же траектории', () => {
  const unit = UNITS.find(u => u.name === 'archer'), clip = unit.clips.find(c => c.name === 'attack');
  const { J, worldOf } = rig(unit.joints);
  const hand = f => drawingFist(worldOf, J, poseAt(clip, f));
  assert.ok(hand(10)[1] > 1.82, 'кисть над капюшоном до движения за голову');
  assert.ok(hand(13)[2] < -0.25 && hand(16)[2] < -0.2, 'кисть за головой у колчана');
  for (let f = 1; f <= 10; f++) assert.ok(hand(f)[1] >= hand(f - 1)[1], 'подъём без движения вниз');
  for (let f = 0; f <= 16; f++) {
    for (const joint of ['foreR', 'fist']) {
      const a = joint === 'fist' ? hand(f) : worldOf(poseAt(clip, f), J[joint]).p;
      const b = joint === 'fist' ? hand(34 - f) : worldOf(poseAt(clip, 34 - f), J[joint]).p;
      assert.ok(Math.hypot(...sub(a, b)) < 1e-6, `кадр ${f}: ${joint} повторяет обратный путь`);
    }
  }
  const quiver = unit.parts.find(p => p.color === 'feather' && p.pivot);
  const torso = worldOf(poseAt(clip, 16), J.torso);
  const tip = add(quiver.pivot, qrot(quiver.q, sub(quiver.c, quiver.pivot)));
  const worldTip = add(torso.p, qrot(torso.q, sub(tip, unit.joints[J.torso].at)));
  assert.ok(Math.hypot(...sub(hand(16), worldTip)) < 0.08, 'кисть у оперения стрел в колчане');
});

test('лучник: локоть сгибается без скручивания предплечья, рука обходит голову при доставании стрелы', () => {
  const unit = UNITS.find(u => u.name === 'archer'), clip = unit.clips.find(c => c.name === 'attack');
  const { J, worldOf } = rig(unit.joints);
  const boxes = unit.parts.filter(p => p.s && p.joint === J.head);
  for (let f = 0; f < clip.times.length; f++) {
    const pose = poseAt(clip, f), q = pose['foreR.rotation'];
    assert.ok(Math.abs(q[1]) < 1e-6 && Math.abs(q[2]) < 1e-6 && q[0] <= 0, `кадр ${f}: сгибание локтя в одной плоскости`);
    if (f > 34) continue;
    const elbow = worldOf(pose, J.foreR).p, hand = drawingFist(worldOf, J, pose), head = worldOf(pose, J.head);
    for (let a = 0; a <= 1; a += 0.025) {
      const pt = add(elbow, sub(hand, elbow).map(v => v * a));
      const local = add(qrot(qconj(head.q), sub(pt, head.p)), unit.joints[J.head].at);
      for (const b of boxes) {
        const depth = Math.min(...[0, 1, 2].map(k => b.s[k] / 2 + 0.05 - Math.abs(local[k] - b.c[k])));
        assert.ok(depth <= 0, `кадр ${f}: предплечье пересекает голову`);
      }
    }
    if (f < 18) continue;
    const arrow = worldOf(pose, J.arrow);
    for (let y = 0; y <= 0.73; y += 0.01) {
      const pt = add(arrow.p, qrot(arrow.q, [0, y, 0]));
      const local = add(qrot(qconj(head.q), sub(pt, head.p)), unit.joints[J.head].at);
      for (const b of boxes) {
        const depth = Math.min(...[0, 1, 2].map(k => b.s[k] / 2 + 0.008 - Math.abs(local[k] - b.c[k])));
        assert.ok(depth <= 0, `кадр ${f}: стрела пересекает голову при возврате`);
      }
    }
  }
});

test('лучник: стрела появляется наконечником вдоль колчана, оперение всех стрел белое', () => {
  const unit = UNITS.find(u => u.name === 'archer'), clip = unit.clips.find(c => c.name === 'attack');
  const { J, worldOf } = rig(unit.joints);
  const quiver = unit.parts.find(p => p.pivot && p.h > 0.1), feathers = unit.parts.filter(p => p.pivot && p.s);
  assert.equal(feathers.length, 3);
  assert.ok(feathers.every(p => p.color === 'feather'), 'все три оперения цвета feather');
  for (const f of [17, 18]) {
    const pose = poseAt(clip, f), torso = worldOf(pose, J.torso);
    const downQuiver = qrot(torso.q, qrot(quiver.q, [0, -1, 0]));
    const arrow = worldOf(pose, J.arrow), axis = qrot(arrow.q, [0, 1, 0]);
    assert.ok(dot(axis, downQuiver) > 0.99999, `кадр ${f}: наконечник направлен в колчан`);
    const tip = add(arrow.p, qrot(arrow.q, [0, 0.73 * pose['arrow.scale'][1], 0]));
    const local = add(qrot(qconj(torso.q), sub(tip, torso.p)), unit.joints[J.torso].at);
    const inQuiver = qrot(qconj(quiver.q), sub(local, quiver.pivot));
    assert.ok(inQuiver[1] >= -quiver.h / 2, `кадр ${f}: наконечник выше дна колчана`);
  }
  for (const f of [21, 22, 23, 24]) {
    const upward = qrot(worldOf(poseAt(clip, f), J.arrow).q, [0, 1, 0]);
    assert.ok(upward[1] > 0.99999 && Math.abs(upward[0]) < 1e-6, `кадр ${f}: стрела вертикально вверх после извлечения`);
  }
  for (const f of [19, 20]) {
    const turning = qrot(worldOf(poseAt(clip, f), J.arrow).q, [0, 1, 0]);
    assert.ok(turning[2] < -0.5, `кадр ${f}: поворот вверх через пространство за головой`);
  }
  const front = qrot(worldOf(poseAt(clip, 29), J.arrow).q, [0, 1, 0]);
  assert.ok(front[2] > 0.99, 'после подъёма стрела поворачивается вперёд к луку');
});

// Match glTF playback: shortest-path quaternion slerp and linear translation/scale. Sample
// between baked keys too, including the arrowhead/fletching and a cylinder enclosing the hood.
test('лучник: стрела обходит голову и капюшон между кадрами извлечения и поворота', () => {
  const unit = UNITS.find(u => u.name === 'archer'), clip = unit.clips.find(c => c.name === 'attack');
  const { J, worldOf } = rig(unit.joints), parts = unit.parts.filter(p => p.joint === J.head);
  const slerp = (a, b, t) => {
    let d = a.reduce((s, v, k) => s + v * b[k], 0);
    if (d < 0) { b = b.map(v => -v); d = -d; }
    if (d > 0.9995) {
      const q = a.map((v, k) => v + (b[k] - v) * t), length = Math.hypot(...q);
      return q.map(v => v / length);
    }
    const angle = Math.acos(Math.min(1, d)), sine = Math.sin(angle);
    return a.map((v, k) => (v * Math.sin((1 - t) * angle) + b[k] * Math.sin(t * angle)) / sine);
  };
  for (let f = 16; f < 39; f++) for (let t = 0; t < 1; t += 0.125) {
    const pose = Object.fromEntries([...clip.tracks].map(([key, values]) => [key,
      key.endsWith('.rotation') ? slerp(values[f], values[f + 1], t) : values[f].map((v, k) => v + (values[f + 1][k] - v) * t)]));
    const arrow = worldOf(pose, J.arrow), head = worldOf(pose, J.head), scale = pose['arrow.scale'][1];
    for (let y = 0; y <= 0.73; y += 0.005) {
      const radius = (y < 0.14 ? 0.023 : y > 0.66 ? 0.02 : 0.008) * scale;
      const pt = add(arrow.p, qrot(arrow.q, [0, y * scale, 0]));
      const local = add(qrot(qconj(head.q), sub(pt, head.p)), unit.joints[J.head].at);
      for (const p of parts) {
        const depth = p.s
          ? Math.min(...[0, 1, 2].map(k => p.s[k] / 2 + radius - Math.abs(local[k] - p.c[k])))
          : Math.min(p.h / 2 + radius - Math.abs(local[1] - p.c[1]), Math.max(...p.r) + radius - Math.hypot(local[0] - p.c[0], local[2] - p.c[2]));
        assert.ok(depth <= 0, `кадр ${f + t}: стрела касается ${p.color} головы/капюшона`);
      }
    }
  }
});

test('лучник: тетива остаётся ненатянутой до возврата руки и установки стрелы', () => {
  const unit = UNITS.find(u => u.name === 'archer'), clip = unit.clips.find(c => c.name === 'attack');
  const { J, worldOf } = rig(unit.joints);
  for (let f = 0; f <= 38; f++) {
    const pose = poseAt(clip, f), bow = worldOf(pose, J.bow), nock = worldOf(pose, J.nock).p;
    const rest = add(bow.p, qrot(bow.q, [0, 0, -0.12]));
    assert.ok(Math.hypot(...sub(nock, rest)) < 1e-6, `кадр ${f}: тетива в исходном положении`);
  }
  const scale = clip.tracks.get('arrow.scale');
  assert.equal(scale[16][0], 0.02, 'до захвата стрела скрыта');
  assert.equal(scale[18][0], 1, 'после захвата стрела в руке');
  assert.equal(scale[34][0], 1, 'стрела остаётся в руке после обратного пути');
  const drawn = poseAt(clip, 48);
  assert.ok(Math.hypot(...sub(worldOf(drawn, J.nock).p, worldOf(drawn, J.arrow).p)) < 1e-6, 'полное натяжение следует за кистью');
});
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

test('волк: клипы idle, run, attack, death; на земле в idle, не под землёй нигде, смерть кончается лёжа на земле', () => {
  const wolf = UNITS.find(u => u.name === 'wolf');
  assert.deepEqual(wolf.clips.map(c => c.name), ['idle', 'run', 'attack', 'death']);
  assert.deepEqual(wolf.clips.map(c => c.loop), [true, true, true, false]);
  const idle = wolf.clips.find(c => c.name === 'idle');
  for (let f = 0; f < idle.times.length; f++) assert.ok(Math.abs(wolfExtentY(poseAt(idle, f))[0]) < 0.01, `idle кадр ${f}: лапы не на земле`);
  for (const clip of wolf.clips) {
    for (let f = 0; f < clip.times.length; f++) assert.ok(wolfExtentY(poseAt(clip, f))[0] > -0.05, `${clip.name} кадр ${f}: ушёл под землю`);
  }
  const death = wolf.clips.find(c => c.name === 'death');
  const [low, high] = wolfExtentY(poseAt(death, death.times.length - 1));
  assert.ok(Math.abs(low) < 0.01 && high < 0.5, 'лежит на боку: ' + high.toFixed(2));
});

test('гоблин на волке: клипы волка, оба набора костей, 16 цветов, гоблин сидит на спине волка и не уходит под землю', () => {
  const m = UNITS.find(u => u.name === 'goblin-wolf-rider'), wolf = UNITS.find(u => u.name === 'wolf'), gob = UNITS.find(u => u.name === 'goblin');
  assert.deepEqual(m.clips.map(c => c.name), ['idle', 'run', 'attack', 'throw', 'runThrow', 'death']);
  assert.deepEqual(m.clips.map(c => c.loop), [true, true, true, true, true, false]);
  for (const c of wolf.clips) {
    // The wolf's own clips are carried over unchanged: same length, same wolf tracks.
    const mc = m.clips.find(x => x.name === c.name);
    assert.deepEqual(mc.times, c.times);
    for (const [key, values] of c.tracks) assert.deepEqual(mc.tracks.get(key), values, c.name + ' ' + key);
  }
  assert.equal(m.joints.length, wolf.joints.length + gob.joints.length);
  assert.equal(new Set(m.joints.map(j => j.name)).size, m.joints.length, 'имена костей уникальны');
  assert.equal(buildMesh(m).indices.length, buildMesh(wolf).indices.length + buildMesh(gob).indices.length);
  assert.ok(m.palette.length <= 16, 'палитра 4x4');
  const { J, worldOf } = rig(m.joints);
  for (const clip of m.clips) {
    for (const [key, values] of clip.tracks) assert.equal(values.length, clip.times.length, clip.name + ' ' + key);
    assert.ok(clip.tracks.has('body.translation') && clip.tracks.has('rider_torso.rotation'), clip.name + ': волк и гоблин');
    for (let f = 0; f < clip.times.length; f++) {
      const pose = poseAt(clip, f);
      if (clip.loop) {
        // Seated: his hips keep their place in the body's frame, so he rides with every bounce and pitch.
        const body = worldOf(pose, J.body), hips = worldOf(pose, J.rider_hips);
        const rel = qrot(qconj(body.q), sub(hips.p, body.p));
        assert.ok(Math.abs(rel[0]) < 1e-6 && Math.abs(rel[1] - 0.35 * SCALE) < 0.02 && Math.abs(rel[2] - 0.03 * SCALE) < 1e-6, `${clip.name} кадр ${f}: таз ${rel.map(v => v.toFixed(3))}`);
      } else {
        assert.ok(riderMinY(pose) > -0.01, `${clip.name} кадр ${f}: гоблин под землёй`);
      }
    }
  }
  const death = m.clips.find(c => c.name === 'death'), end = poseAt(death, death.times.length - 1);
  const hips = worldOf(end, J.rider_hips).p;
  assert.ok(hips[1] < 0.35 && Math.abs(hips[0]) > 0.7, 'гоблин лежит на земле рядом с волком: ' + hips.map(v => v.toFixed(2)));
});

test('гоблин на волке: бросок — дротик исчезает в момент выпуска и возвращается из связки; у остальных клипов дротик в руке', () => {
  const m = UNITS.find(u => u.name === 'goblin-wolf-rider');
  for (const clip of m.clips) {
    const scale = clip.tracks.get('rider_spear.scale');
    if (!['throw', 'runThrow'].includes(clip.name)) { assert.equal(scale, undefined, clip.name); continue; }
    assert.equal(clip.times.length, 37);
    assert.ok(Math.abs(clip.times[36] - 1.5) < 1e-9, clip.name + ': 1,5 с');
    const shown = scale.map(v => v[0]);
    assert.ok(shown[0] === 1 && shown[36] === 1 && shown[19] === 1 && shown[20] < 0.1 && shown[30] < 0.1 && shown[31] === 1, clip.name);
    assert.ok(shown.every(v => v >= 0.02), 'не ноль: нулевая нормаль даёт NaN');
  }
  // The rider acts: his head and torso move in idle, run and attack, not only the wolf's.
  for (const name of ['idle', 'run', 'attack']) {
    const clip = m.clips.find(c => c.name === name);
    for (const key of ['rider_head.rotation', 'rider_torso.rotation']) {
      const vs = clip.tracks.get(key);
      assert.ok(vs.some(v => v.some((x, k) => Math.abs(x - vs[0][k]) > 0.02)), `${name}: ${key} движется`);
    }
  }
});

// The javelin's shaft, sampled every 2 cm, against the wolf's boxes in every frame it is held.
test('гоблин на волке: дротик не проходит сквозь волка ни в одном кадре', () => {
  const m = UNITS.find(u => u.name === 'goblin-wolf-rider'), wolf = UNITS.find(u => u.name === 'wolf');
  const { J, worldOf } = rig(m.joints);
  const boxes = m.parts.filter(p => p.s && !p.q && p.joint < wolf.joints.length);
  for (const clip of m.clips.filter(c => c.name !== 'death')) {
    const scale = clip.tracks.get('rider_spear.scale');
    for (let f = 0; f < clip.times.length; f++) {
      if (scale && scale[f][0] < 1) continue;
      const pose = poseAt(clip, f), shaft = worldOf(pose, J.rider_spear);
      for (let y = -0.75; y <= 0.72; y += 0.02) {
        const pt = add(shaft.p, qrot(shaft.q, [0, y, 0]));
        for (const b of boxes) {
          const w = worldOf(pose, b.joint);
          const rel = sub(add(qrot(qconj(w.q), sub(pt, w.p)), m.joints[b.joint].at), b.c);
          const depth = Math.min(...[0, 1, 2].map(k => b.s[k] / 2 + 0.02 - Math.abs(rel[k])));
          assert.ok(depth <= 0, `${clip.name} кадр ${f}: дротик в ${m.joints[b.joint].name} на ${(depth * 100).toFixed(1)} см`);
        }
      }
    }
  }
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

test('мечник верхом: плечо, локоть и меч повторяют текущую пешую атаку', () => {
  const unit = swordsmanUnit(), foot = unit.clips.find(c => c.name === 'attack');
  const keys = ['armR.rotation', 'foreR.rotation', 'sword.rotation'];
  const standing = unit.clips.find(c => c.name === 'rideAttack');
  for (const key of keys) assert.deepEqual(standing.tracks.get(key), foot.tracks.get(key), key);
  const gallop = unit.clips.find(c => c.name === 'rideRunAttack');
  // Different key grids (18 / 32) approximate the same recorded curve: allow 4 degrees.
  for (let i = 0; i <= 400; i++) {
    const u = i / 400, a = sampledPose(foot, u * (foot.times.length - 1)), b = sampledPose(gallop, u * (gallop.times.length - 1));
    for (const key of keys) {
      const dot = Math.abs(a[key].reduce((sum, v, k) => sum + v * b[key][k], 0));
      const angle = 2 * Math.acos(Math.min(1, dot));
      assert.ok(angle < 4 * Math.PI / 180, key + ': та же траектория на скаку');
    }
  }
});

test('мечник: рука и весь меч проходят снаружи головы и шлема при замахе и ударе', () => {
  const unit = swordsmanUnit(), name = p => unit.joints[p.joint].name;
  // 2 cm: between keys the arm swings past the helmet, a hair's clearance reads as touching.
  assert.deepEqual(clashes(unit, ['attack'],
    p => ['armR', 'foreR', 'sword'].includes(name(p)), p => name(p) === 'head', 0.02), []);
});

test('мечник верхом: рука и весь меч не пересекают голову всадника при обоих ударах', () => {
  const unit = UNITS.find(u => u.name === 'mounted-swordsman'), name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['attack', 'runAttack'],
    p => ['rider_armR', 'rider_foreR', 'rider_sword'].includes(name(p)), p => name(p) === 'rider_head'), []);
});

// Check the full blade, crossguard and grip in the combined skeleton, including between keys.
// Sword parts point along +Z in bind, not +Y: testing the latter misses the real swing.
test('мечник верхом: весь меч не проходит сквозь лошадь в кадрах и между кадрами атаки и бега', () => {
  const unit = UNITS.find(u => u.name === 'mounted-swordsman'), name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack', 'runAttack'],
    p => name(p) === 'rider_sword', p => !name(p).startsWith('rider_')), []);
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

// Catapult: a machine, not a body — wheels instead of feet, a stone instead of a weapon, debris instead of a fall.
const catapultUnit = () => UNITS.find(u => u.name === 'catapult');

test('катапульта: клипы idle, run, attack, death; колёса на земле, в беге колесо делает один оборот за цикл', () => {
  const unit = catapultUnit(), { J } = rig(unit.joints);
  assert.deepEqual(unit.clips.map(c => c.name), ['idle', 'run', 'attack', 'death']);
  assert.deepEqual(unit.clips.map(c => c.loop), [true, true, true, false]);
  for (const clip of unit.clips.filter(c => c.name !== 'death')) {
    for (let f = 0; f < clip.times.length; f++) {
      const low = catapultLowest(poseAt(clip, f));
      if (clip.name === 'attack') assert.ok(low > -1e-6, `attack кадр ${f}: под землёй на ${low}`);
      else assert.ok(Math.abs(low) < 1e-6, `${clip.name} кадр ${f}: колёса ${(low * 100).toFixed(2)} см от земли`);
    }
  }
  const run = unit.clips.find(c => c.name === 'run'), wheel = run.tracks.get('wheelFL.rotation');
  assert.ok(Math.abs(Math.abs(wheel[(wheel.length - 1) / 2][0]) - 1) < 1e-9, 'полцикла — пол-оборота');
  for (const w of ['wheelFR', 'wheelHL', 'wheelHR']) assert.deepEqual(run.tracks.get(w + '.rotation'), wheel, w);
  assert.equal(J.stone !== undefined && unit.joints[J.stone].parent, J.body, 'камень на раме: летит независимо от рычага');
});

test('катапульта: камень в ложке, при выстреле летит вперёд и вверх, прячется масштабом (не 0), новый камень к концу цикла', () => {
  const unit = catapultUnit(), { J, worldOf } = rig(unit.joints);
  const inCup = sub(unit.joints[J.stone].at, unit.joints[J.armTip].at);
  const cupError = (pose) => {
    const tip = worldOf(pose, J.armTip);
    return Math.hypot(...sub(worldOf(pose, J.stone).p, add(tip.p, qrot(tip.q, inCup))));
  };
  for (const name of ['idle', 'run']) {
    const clip = unit.clips.find(c => c.name === name);
    assert.equal(clip.tracks.has('stone.scale'), false, name + ': камень всегда виден');
    for (let f = 0; f < clip.times.length; f++) assert.ok(cupError(poseAt(clip, f)) < 1e-6, `${name} кадр ${f}: камень не в ложке`);
  }
  const clip = unit.clips.find(c => c.name === 'attack'), scale = clip.tracks.get('stone.scale').map(s => s[0]);
  assert.ok(Math.min(...scale) >= 0.02, 'масштаб никогда не 0');
  for (let f = 0; f <= 10; f++) {
    assert.equal(scale[f], 1, `кадр ${f}: камень виден`);
    assert.ok(cupError(poseAt(clip, f)) < 1e-6, `кадр ${f}: камень в ложке до удара о подушку`);
  }
  const hit = worldOf(poseAt(clip, 10), J.stone).p, flown = worldOf(poseAt(clip, 17), J.stone).p;
  assert.ok(flown[2] - hit[2] > 2 && flown[1] - hit[1] > 1.5, 'летит вперёд и вверх: ' + sub(flown, hit).map(v => v.toFixed(2)));
  assert.equal(scale[17], 1);
  assert.ok(scale[18] < 0.05, 'спрятан вдали, а не на пути обратно в ложку');
  for (let f = 19; f < clip.times.length; f++) assert.ok(cupError(poseAt(clip, f)) < 1e-6, `кадр ${f}: новый камень в ложке`);
  assert.equal(scale.at(-10), 1, 'к концу цикла камень снова заряжен');
});

test('катапульта: рычаг, ложка и камень не проходят сквозь стойку с подушкой ни в кадрах, ни между ними', () => {
  const unit = catapultUnit(), name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], p => ['arm', 'armTip', 'stone'].includes(name(p)), p => name(p) === 'stand'), []);
});

test('катапульта: разрушение — ни один кадр не под землёй, рама легла углом на землю, обломки лежат на земле в стороне', () => {
  const unit = catapultUnit(), { J, worldOf } = rig(unit.joints), all = unit.joints.map((_, i) => i);
  const death = unit.clips.find(c => c.name === 'death');
  for (let f = 0; f < death.times.length; f++) assert.ok(catapultLowest(poseAt(death, f), all) > -1e-3, `death кадр ${f}: ушла под землю`);
  const end = poseAt(death, death.times.length - 1);
  assert.ok(Math.abs(catapultLowest(end, [J.body])) < 1e-3, 'угол рамы без колеса на земле');
  assert.ok(qrot(worldOf(end, J.body).q, [0, 1, 0])[1] < Math.cos(10 * Math.PI / 180), 'рама накренилась');
  assert.deepEqual(DEBRIS_JOINTS, ['wheelFR', 'stone', 'armTip', 'board', 'pole']);
  for (const name of DEBRIS_JOINTS) {
    const p = worldOf(end, J[name]).p;
    assert.ok(Math.abs(catapultLowest(end, [J[name]])) < 1e-3, name + ': лежит на земле');
    assert.ok(Math.abs(p[0]) > 0.8 || Math.abs(p[2]) > 1.55, name + ': в стороне от рамы ' + p.map(v => v.toFixed(2)));
  }
});

// Orc ballista: a crossbow on a cart. The claw (`nock`) slides along the stock, the bolt rides in it
// until the arms reach straight, then flies; in death the bow is torn off its post.
const ballistaUnit = () => UNITS.find(u => u.name === 'orc-ballista');
const BOW = ['mount', 'bowL', 'bowR', 'nock', 'winch'];

test('орочья баллиста: клипы idle, run, attack, death; колёса на земле, в беге колесо делает один оборот за цикл', () => {
  const unit = ballistaUnit(), { J } = rig(unit.joints);
  assert.deepEqual(unit.clips.map(c => c.name), ['idle', 'run', 'attack', 'death']);
  assert.deepEqual(unit.clips.map(c => c.loop), [true, true, true, false]);
  for (const clip of unit.clips.filter(c => c.name !== 'death')) {
    for (let f = 0; f < clip.times.length; f++) {
      const low = ballistaLowest(poseAt(clip, f));
      if (clip.name === 'attack') assert.ok(low > -1e-6, `attack кадр ${f}: под землёй на ${low}`);
      else assert.ok(Math.abs(low) < 1e-6, `${clip.name} кадр ${f}: колёса ${(low * 100).toFixed(2)} см от земли`);
    }
  }
  const run = unit.clips.find(c => c.name === 'run'), wheel = run.tracks.get('wheelFL.rotation');
  assert.ok(Math.abs(Math.abs(wheel[(wheel.length - 1) / 2][0]) - 1) < 1e-9, 'полцикла — пол-оборота');
  for (const w of ['wheelFR', 'wheelHL', 'wheelHR']) assert.deepEqual(run.tracks.get(w + '.rotation'), wheel, w);
  assert.equal(unit.joints[J.bolt].parent, J.body, 'болт на раме: летит независимо от ложа');
});

test('орочья баллиста: болт в когте, лук натянут в idle и run; при выстреле болт летит прямо вперёд, прячется масштабом (не 0), новый болт к концу цикла', () => {
  const unit = ballistaUnit(), { J, worldOf } = rig(unit.joints);
  const inClaw = (pose) => {
    const nock = worldOf(pose, J.nock), bolt = worldOf(pose, J.bolt);
    return Math.hypot(...sub(bolt.p, nock.p)) + Math.hypot(...sub(qrot(bolt.q, [0, 0, 1]), qrot(nock.q, [0, 0, 1])));
  };
  const drawn = pose => sub(worldOf(pose, J.mount).p, worldOf(pose, J.nock).p);
  for (const name of ['idle', 'run']) {
    const clip = unit.clips.find(c => c.name === name);
    assert.equal(clip.tracks.has('bolt.scale'), false, name + ': болт всегда виден');
    for (let f = 0; f < clip.times.length; f++) {
      const pose = poseAt(clip, f);
      assert.ok(inClaw(pose) < 1e-6, `${name} кадр ${f}: болт не в когте`);
      assert.ok(Math.hypot(...drawn(pose)) > 0.4, `${name} кадр ${f}: коготь оттянут назад`);
    }
  }
  const clip = unit.clips.find(c => c.name === 'attack'), scale = clip.tracks.get('bolt.scale').map(s => s[0]);
  assert.ok(Math.min(...scale) >= 0.02, 'масштаб никогда не 0');
  for (let f = 0; f <= 5; f++) {
    assert.equal(scale[f], 1, `кадр ${f}: болт виден`);
    assert.ok(inClaw(poseAt(clip, f)) < 1e-6, `кадр ${f}: болт в когте, пока плечи не распрямились`);
  }
  const shot = worldOf(poseAt(clip, 5), J.bolt).p, flown = worldOf(poseAt(clip, 10), J.bolt).p;
  assert.ok(flown[2] - shot[2] > 4 && Math.abs(flown[1] - shot[1]) < 0.5 && Math.abs(flown[0] - shot[0]) < 1e-6, 'летит прямо и полого: ' + sub(flown, shot).map(v => v.toFixed(2)));
  assert.equal(scale[10], 1);
  assert.ok(scale[11] < 0.05, 'спрятан вдали, а не на пути обратно на ложе');
  for (let f = 12; f < clip.times.length; f++) assert.ok(inClaw(poseAt(clip, f)) < 1e-6, `кадр ${f}: новый болт в когте`);
  assert.equal(scale.at(-6), 1, 'к концу цикла болт снова заряжен');
});

test('орочья баллиста: коготь не сходит с ложа, болт не задевает лук, лук не задевает телегу, полотнища не проходят сквозь древко', () => {
  const unit = ballistaUnit(), { J, worldOf } = rig(unit.joints), name = p => (p.span ? 'string' : unit.joints[p.joint].name);
  const stock = unit.parts.find(p => p.joint === J.mount && p.s && p.s[2] > 1.5);
  for (const clip of unit.clips.filter(c => c.name !== 'death')) {
    for (let f = 0; f < clip.times.length; f++) {
      const z = clip.tracks.get('nock.translation')[f][2] + unit.joints[J.mount].at[2] - stock.c[2];
      assert.ok(Math.abs(z) < stock.s[2] / 2, `${clip.name} кадр ${f}: коготь за концом ложа`);
    }
  }
  const solid = p => !p.span;
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], p => solid(p) && name(p) === 'bolt', p => solid(p) && BOW.includes(name(p))), []);
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], p => solid(p) && BOW.includes(name(p)), p => solid(p) && !BOW.includes(name(p)) && name(p) !== 'bolt'), []);
  // The strips hang from the bone bar (they touch it); the shaft is the tall box.
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], p => name(p) === 'banner', p => name(p) === 'pole' && p.s[1] > 1), []);
});

test('орочья баллиста: разрушение — ни один кадр не под землёй, рама легла углом на землю, лук сорван со стойки и лежит плашмя, обломки на земле в стороне', () => {
  const unit = ballistaUnit(), { J, worldOf } = rig(unit.joints), all = unit.joints.map((_, i) => i);
  const death = unit.clips.find(c => c.name === 'death');
  for (let f = 0; f < death.times.length; f++) assert.ok(ballistaLowest(poseAt(death, f), all) > -1e-3, `death кадр ${f}: ушла под землю`);
  const end = poseAt(death, death.times.length - 1);
  assert.ok(Math.abs(ballistaLowest(end, [J.body])) < 1e-3, 'угол рамы без колеса на земле');
  assert.ok(qrot(worldOf(end, J.body).q, [0, 1, 0])[1] < Math.cos(10 * Math.PI / 180), 'рама накренилась');
  assert.ok(qrot(worldOf(end, J.mount).q, [0, 1, 0])[1] > Math.cos(5 * Math.PI / 180), 'лук лежит плашмя');
  assert.deepEqual(BALLISTA_DEBRIS, ['wheelFL', 'bolt', 'mount', 'pole']);
  const tree = { mount: BOW.map(n => J[n]), pole: [J.pole, J.banner] };
  for (const name of BALLISTA_DEBRIS) {
    const p = worldOf(end, J[name]).p;
    assert.ok(Math.abs(ballistaLowest(end, tree[name] || [J[name]])) < 1e-3, name + ': лежит на земле');
    assert.ok(Math.abs(p[0]) > 0.8 || Math.abs(p[2]) > 1.4, name + ': в стороне от рамы ' + p.map(v => v.toFixed(2)));
  }
});

// Siege towers (human and orc): machines like the catapult; their `attack` drops the drawbridge instead of shooting.
for (const [name, { DEBRIS_JOINTS: TOWER_DEBRIS, LAND_TIME, lowest: towerLowest }] of [['siege-tower', humanTower], ['orc-siege-tower', orcTower]]) {
const towerUnit = () => UNITS.find(u => u.name === name);

test(name + ': осадная башня: клипы idle, run, attack, death; колёса на земле, в беге колесо делает один оборот за цикл', () => {
  const unit = towerUnit();
  assert.deepEqual(unit.clips.map(c => c.name), ['idle', 'run', 'attack', 'death']);
  assert.deepEqual(unit.clips.map(c => c.loop), [true, true, true, false]);
  for (const clip of unit.clips.filter(c => c.name !== 'death')) {
    for (let f = 0; f < clip.times.length; f++) {
      const low = towerLowest(poseAt(clip, f));
      if (clip.name === 'attack') assert.ok(low > -1e-6, `attack кадр ${f}: под землёй на ${low}`);
      else assert.ok(Math.abs(low) < 1e-6, `${clip.name} кадр ${f}: колёса ${(low * 100).toFixed(2)} см от земли`);
    }
  }
  const run = unit.clips.find(c => c.name === 'run'), wheel = run.tracks.get('wheelFL.rotation');
  assert.ok(Math.abs(Math.abs(wheel[(wheel.length - 1) / 2][0]) - 1) < 1e-9, 'полцикла — пол-оборота');
  for (const w of ['wheelFR', 'wheelHL', 'wheelHR']) assert.deepEqual(run.tracks.get(w + '.rotation'), wheel, w);
});

test(name + ': осадная башня: разрушение — ни один кадр не под землёй, рама легла углом на землю, обломки лежат на земле в стороне', () => {
  const unit = towerUnit(), { J, worldOf } = rig(unit.joints), all = unit.joints.map((_, i) => i);
  const death = unit.clips.find(c => c.name === 'death');
  for (let f = 0; f < death.times.length; f++) assert.ok(towerLowest(poseAt(death, f), all) > -1e-3, `death кадр ${f}: ушла под землю`);
  const end = poseAt(death, death.times.length - 1);
  assert.ok(Math.abs(towerLowest(end, [J.body])) < 1e-3, 'угол рамы без колеса на земле');
  assert.ok(qrot(worldOf(end, J.body).q, [0, 1, 0])[1] < Math.cos(10 * Math.PI / 180), 'башня накренилась');
  assert.deepEqual(TOWER_DEBRIS, ['wheelFR', 'bridge', 'crown', 'hide', 'pole']);
  for (const name of TOWER_DEBRIS) {
    const p = worldOf(end, J[name]).p;
    const tree = name === 'pole' ? [J.pole, J.flag] : [J[name]];
    assert.ok(Math.abs(towerLowest(end, tree)) < 1e-3, name + ': лежит на земле');
    assert.ok(Math.abs(p[0]) > 1.2 || Math.abs(p[2]) > 1.5, name + ': в стороне от рамы ' + p.map(v => v.toFixed(2)));
  }
});

test(name + ': осадная башня: мост опускается на 90° к моменту удара, лежит ровно, поднимается обратно; не задевает башню ни в кадрах, ни между ними', () => {
  const unit = towerUnit(), clip = unit.clips.find(c => c.name === 'attack'), track = clip.tracks.get('bridge.rotation');
  const angle = f => 2 * Math.atan2(track[f][0], track[f][3]) * 180 / Math.PI;
  const landed = Math.round(LAND_TIME / clip.times.at(-1) * (clip.times.length - 1));
  assert.ok(Math.abs(angle(0)) < 1e-6 && Math.abs(angle(track.length - 1)) < 1e-6, 'цикл начинается и кончается с поднятого моста');
  assert.ok(Math.abs(angle(landed) - 90) < 1e-6, 'в момент удара мост лежит горизонтально');
  assert.ok(Math.abs(angle(landed + 10) - 90) < 1e-6, 'лежит ровно');
  for (let f = 0; f < landed; f++) assert.ok(angle(f) <= angle(f + 1) + 1e-9, `кадр ${f}: мост падает, а не поднимается`);
  const name = p => unit.joints[p.joint].name;
  assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], p => name(p) === 'bridge', p => name(p) !== 'bridge'), []);
});
}

// Battering rams: a covered frame with a hanging log; `attack` draws the log back and swings it into the wall.
for (const [name, { DEBRIS_JOINTS: RAM_DEBRIS, HIT_TIME, lowest: ramLowest }] of [['battering-ram', humanRam], ['orc-battering-ram', orcRam]]) {
  const ramUnit = () => UNITS.find(u => u.name === name);

  test(name + ': клипы idle, run, attack, death; колёса на земле, в беге колесо делает один оборот за цикл', () => {
    const unit = ramUnit();
    assert.deepEqual(unit.clips.map(c => c.name), ['idle', 'run', 'attack', 'death']);
    assert.deepEqual(unit.clips.map(c => c.loop), [true, true, true, false]);
    for (const clip of unit.clips.filter(c => c.name !== 'death')) {
      for (let f = 0; f < clip.times.length; f++) {
        const low = ramLowest(poseAt(clip, f));
        if (clip.name === 'attack') assert.ok(low > -1e-6, `attack кадр ${f}: под землёй на ${low}`);
        else assert.ok(Math.abs(low) < 1e-6, `${clip.name} кадр ${f}: колёса ${(low * 100).toFixed(2)} см от земли`);
      }
    }
    const run = unit.clips.find(c => c.name === 'run'), wheel = run.tracks.get('wheelFL.rotation');
    assert.ok(Math.abs(Math.abs(wheel[(wheel.length - 1) / 2][0]) - 1) < 1e-9, 'полцикла — пол-оборота');
    for (const w of ['wheelFR', 'wheelHL', 'wheelHR']) assert.deepEqual(run.tracks.get(w + '.rotation'), wheel, w);
  });

  test(name + ': бревно отводится назад, бьёт вперёд в кадре удара быстрее, чем отводилось, и возвращается; не задевает раму ни в кадрах, ни между ними', () => {
    const unit = ramUnit(), clip = unit.clips.find(c => c.name === 'attack'), track = clip.tracks.get('hangF.rotation');
    const angle = f => 2 * Math.atan2(track[f][0], track[f][3]) * 180 / Math.PI;   // hangers: + back, - forward
    const hit = Math.round(HIT_TIME / clip.times.at(-1) * (clip.times.length - 1));
    assert.ok(Math.abs(angle(0)) < 1e-6 && Math.abs(angle(track.length - 1)) < 1e-6, 'цикл начинается и кончается с бревном на месте');
    const back = Math.max(...track.map((_, f) => angle(f))), front = angle(hit);
    assert.ok(back > 20 && front < -20, `размах: назад ${back.toFixed(1)}°, вперёд ${front.toFixed(1)}°`);
    assert.ok(Math.abs(angle(hit) - Math.min(...track.map((_, f) => angle(f)))) < 1e-6, 'самая дальняя точка вперёд — в кадре удара');
    const drawn = track.findIndex((_, f) => angle(f) > back - 1e-6);
    assert.ok(hit - drawn < drawn, 'удар короче замаха');
    const swung = p => ['log', 'hangF', 'hangR'].includes(unit.joints[p.joint].name);
    assert.deepEqual(clashes(unit, ['idle', 'run', 'attack'], swung, p => !swung(p) && !unit.joints[p.joint].name.startsWith('wheel') && !['pole', 'flag'].includes(unit.joints[p.joint].name) && !p.hinge), []);
  });

  test(name + ': разрушение — ни один кадр не под землёй, рама легла углом на землю, обломки лежат на земле в стороне', () => {
    const unit = ramUnit(), { J, worldOf } = rig(unit.joints), all = unit.joints.map((_, i) => i);
    const death = unit.clips.find(c => c.name === 'death');
    for (let f = 0; f < death.times.length; f++) assert.ok(ramLowest(poseAt(death, f), all) > -1e-3, `death кадр ${f}: ушла под землю`);
    const end = poseAt(death, death.times.length - 1);
    assert.ok(Math.abs(ramLowest(end, [J.body])) < 1e-3, 'угол рамы без колеса на земле');
    assert.ok(qrot(worldOf(end, J.body).q, [0, 1, 0])[1] < Math.cos(10 * Math.PI / 180), 'рама накренилась');
    assert.deepEqual(RAM_DEBRIS, ['wheelFR', 'roof', 'beamL', 'beamR', 'pole']);
    for (const piece of RAM_DEBRIS) {
      const p = worldOf(end, J[piece]).p, tree = piece === 'pole' ? [J.pole, J.flag] : [J[piece]];
      assert.ok(Math.abs(ramLowest(end, tree)) < 1e-3, piece + ': лежит на земле');
      assert.ok(Math.abs(p[0]) > 1.2 || Math.abs(p[2]) > 1.9, piece + ': в стороне от рамы ' + p.map(v => v.toFixed(2)));
    }
  });

  test(name + ': разрушение — крыша падает по часовой стрелке (вид спереди); ствол обрывается у переднего подвеса и висит на заднем, подвес остаётся на балке', () => {
    const unit = ramUnit(), { J, worldOf } = rig(unit.joints), death = unit.clips.find(c => c.name === 'death');
    const frames = death.times.map((_, f) => poseAt(death, f)), end = frames.at(-1);
    // Seen from the front (+Z) +X is on the right: the roof's up vector turns from +Y toward +X.
    const roll = frames.map((p) => { const up = qrot(worldOf(p, J.roof).q, [0, 1, 0]); return Math.atan2(up[0], up[1]) * 180 / Math.PI; });
    for (let f = 10; f < roll.length; f++) assert.ok(roll[f] >= roll[f - 1] - 0.01, `кадр ${f}: крыша крутится против часовой (${roll[f - 1].toFixed(2)} -> ${roll[f].toFixed(2)})`);
    assert.ok(roll.at(-1) > 60, 'крыша легла набок вправо: ' + roll.at(-1).toFixed(1));
    // Both hangers stay on the frame (no translation track): the log is torn loose from the front one
    // only and keeps its rear station on the rear hanger's lower end in every frame.
    for (const hanger of ['hangF', 'hangR']) assert.ok(!death.tracks.has(hanger + '.translation'), hanger + ' остаётся на оси балки');
    const hangZ = unit.joints[J.hangR].at[2] - unit.joints[J.log].at[2], drop = unit.joints[J.hangR].at[1] - unit.joints[J.log].at[1];
    for (let f = 0; f < frames.length; f++) {
      const log = worldOf(frames[f], J.log), hang = worldOf(frames[f], J.hangR);
      const a = add(log.p, qrot(log.q, [0, 0, hangZ])), b = add(hang.p, qrot(hang.q, [0, -drop, 0]));
      assert.ok(Math.hypot(...sub(a, b)) < 1e-6, `кадр ${f}: ствол оторвался от заднего подвеса`);
    }
    const front = unit.joints[J.hangF].at, logAt = unit.joints[J.log].at;
    const tearFrame = frames.findIndex((p, f) => {
      const log = worldOf(p, J.log), hang = worldOf(p, J.hangF);
      return Math.hypot(...sub(add(log.p, qrot(log.q, [0, 0, front[2] - logAt[2]])), add(hang.p, qrot(hang.q, [0, -drop, 0])))) > 0.02;
    });
    assert.ok(tearFrame > 5 && tearFrame < 25, 'ствол отрывается от переднего подвеса, пока рама ещё трясётся: кадр ' + tearFrame);
    assert.ok(ramLowest(end, [J.hangF]) > 0.5 && ramLowest(end, [J.hangR]) > 0.5, 'оба подвеса висят на балке');
    // In the end only the front tip is on the ground: the nose points down, the rear end hangs high.
    const log = worldOf(end, J.log), nose = qrot(log.q, [0, 0, 1]), rear = add(log.p, qrot(log.q, [0, 0, -1.2]));
    assert.ok(Math.abs(ramLowest(end, [J.log])) < 1e-3, 'нос ствола на земле');
    assert.ok(nose[1] < -Math.sin(15 * Math.PI / 180), 'ствол смотрит носом вниз: ' + nose.map(v => v.toFixed(2)));
    assert.ok(rear[1] > 0.7, 'задняя часть ствола висит: y = ' + rear[1].toFixed(2));
    // The front cross beam: two halves that touch at the start; they split when the log lands on them
    // (the log is still in the air then) and lie apart on the ground at the end.
    const name = p => unit.joints[p.joint].name;
    const dist = p => Math.hypot(...sub(worldOf(p, J.beamL).p, worldOf(p, J.beamR).p));
    const bind = unit.joints[J.beamL].at[0] * 2;
    assert.ok(Math.abs(dist(frames[0]) - bind) < 1e-6, 'в начале половины перекладины сомкнуты');
    const split = frames.findIndex(p => Math.abs(dist(p) - bind) > 0.02);
    assert.ok(split > tearFrame, 'перекладина ломается уже после обрыва подвеса: кадр ' + split);
    assert.ok(ramLowest(frames[split], [J.log]) > 0.1, 'в момент удара нос ствола ещё в воздухе');
    assert.ok(dist(end) > 2.5, 'половины лежат врозь: ' + dist(end).toFixed(2));
    for (const half of [J.beamL, J.beamR]) assert.ok(Math.abs(ramLowest(end, [half])) < 1e-3, 'половина перекладины лежит на земле');
    // The log never goes through the frame or the beam halves, in the frames or between them.
    assert.deepEqual(clashes(unit, ['death'], p => name(p) === 'log', p => ['body', 'beamL', 'beamR'].includes(name(p))), []);
  });
}
