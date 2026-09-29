# 3D-модели юнитов

Low-poly модели юнитов для стратегии в духе Diplomacy is Not an Option. Каждая модель — один
GLB со скелетом и клипами анимации, **один меш и один материал** (цвета — крошечная текстура-палитра),
то есть один draw call на юнит: сотни юнитов на экране не упираются в процессор.

| Файл | Юнит | Треугольники | Кости | Клипы |
|---|---|---|---|---|
| `swordsman.glb` | мечник: шлем с наносником, кольчуга, синяя котта с золотым крестом, круглый щит, меч | 756 | 13 | `idle`, `run`, `attack`, `death` |

![Мечник: стойка и удар](previews/swordsman.png)

![Отряд из 30 мечников с камеры RTS](previews/swordsman-squad.png)

Рост — 1,75 м (1,89 со шлемом), метры, +Y вверх, лицом к +Z (стандарт glTF). Открывается в
Blender, Unity, Godot и любом просмотрщике glTF.

## Клипы

- `idle` — стойка: меч остриём вниз, щит у бедра, осматривается (петля).
- `run` — бег со щитом перед собой и поднятым мечом (петля).
- `attack` — замах из-за плеча и косой удар с шагом правой ногой, 0,9 с (петля — для ближнего боя).
- `death` — падает на спину и остаётся лежать (играть один раз).

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

Цвет команды — тексели `team` и `teamDark` палитры (`tools/units/swordsman.mjs`).

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
позы клипов); общий сборщик GLB — `tools/unit-glb.mjs`. Новый юнит — новый файл в `tools/units/` и
строка в `UNITS` в `tools/make-units.mjs`.
