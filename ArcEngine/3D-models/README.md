# 3D-модели юнитов

Low-poly модели юнитов для стратегии в духе Diplomacy is Not an Option. Каждая модель — один
GLB со скелетом и клипами анимации, **один меш и один материал** (цвета — крошечная текстура-палитра),
то есть один draw call на юнит: сотни юнитов на экране не упираются в процессор.

| Файл | Юнит | Треугольники | Кости | Клипы |
|---|---|---|---|---|
| `swordsman.glb` | мечник: шлем с наносником, кольчуга, синяя котта с золотым крестом, круглый щит, меч | 756 | 13 | `idle`, `run`, `attack`, `death` |
| `archer.glb` | лучник: капюшон и оплечье цвета команды, оливковая туника, колчан за спиной, длинный лук, тетива которого тянется за рукой | 712 | 14 | `idle`, `run`, `attack`, `death` |
| `spearman.glb` | копейщик: шапель (шлем с широкими полями), стёганка цвета команды, борода, копьё 2,6 м двумя руками | 684 | 12 | `idle`, `run`, `attack`, `death` |

![Мечник: стойка и удар](previews/swordsman.png)

![Отряд из 30 мечников с камеры RTS](previews/swordsman-squad.png)

![Лучник: стойка и полное натяжение](previews/archer.png)

![Отряд из 30 лучников с камеры RTS](previews/archer-squad.png)

![Копейщик: стойка и выпад](previews/spearman.png)

![Отряд из 30 копейщиков с камеры RTS](previews/spearman-squad.png)

Рост — 1,75 м (с головным убором до 1,89), метры, +Y вверх, лицом к +Z (стандарт glTF).
Открывается в Blender, Unity, Godot и любом просмотрщике glTF.

## Клипы

У всех юнитов одни и те же имена клипов, поэтому код игры для них один. `idle`, `run` и `attack`
идут по кругу, `death` играется один раз, и юнит остаётся лежать.

| Клип | Мечник | Лучник | Копейщик |
|---|---|---|---|
| `idle` | меч остриём вниз, щит у бедра | лук опущен у левого бока | копьё стоит упором в землю |
| `run` | щит перед собой, меч поднят | лук качается в левой руке | копьё наискось вперёд, двумя руками |
| `attack` | замах и косой удар, 0,9 с | стрела из колчана, натяжение, выстрел, 1,5 с | отвод и укол с выпадом, 1,0 с |
| `death` | падает на спину | падает на спину, лук вдоль тела | падает на спину, копьё вдоль тела |

## В ArcEngine

Скопировать файл в `assets/models/` (путь к ассету в коде — литералом `'assets/…'`, иначе сборщик
его не увидит) и расставить во вкладке Objects редактора или из кода:

```js
const model = await Model3D.load('assets/models/swordsman.glb', view.scene);
const unit = Model3D.build(model, view.scene, { name: 'swordsman' });
World3D.addObject(view, unit, 'actor');
unit.scaling.setAll(0.25);                          // как персонаж набора
unit.position.set(x, terrain.heightAt(x, y), y);
const clips = Model3D.clips(unit);
clips.play(moving ? 'run' : 'idle');
clips.play('attack');
clips.play('death', { loop: false });
```

Цвет команды — тексели `team` и `teamDark` палитры (`tools/units/<юнит>.mjs`).

## Как меняются модели

Модели генерируются кодом, руками файлы не правятся:

```
node tools/make-units.mjs              # пересобрать все модели
node tools/make-units.mjs swordsman    # только мечника
node tools/make-units.mjs --check      # проверить, что файлы совпадают с генератором
node tools/unit-preview.mjs swordsman          # previews/swordsman.png — снимок в сцене игры
node tools/unit-preview.mjs swordsman --squad  # previews/swordsman-squad.png — отряд с камеры RTS
```

Юнит описан в `tools/units/<имя>.mjs` (кости, детали из коробок и усечённых конусов, палитра,
позы клипов); общее тело (кости, лицо, руки и ноги, бег, падение) — `tools/units/humanoid.mjs`,
сборщик GLB — `tools/unit-glb.mjs`. Новый юнит — новый файл в `tools/units/` и строка в `UNITS`
в `tools/make-units.mjs`.
