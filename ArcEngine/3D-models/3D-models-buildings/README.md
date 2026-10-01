# 3D-модели зданий

Low-poly модели зданий для стратегии в том же стиле, что и юниты из `../`: один GLB, **один меш и
один материал** (цвета — крошечная текстура-палитра), то есть один draw call на здание. Здания
статичные: ни скелета, ни клипов анимации, только геометрия.

| Файл | Здание | Треугольники | Цвета |
|---|---|---|---|
| `peasant-house.glb` | крестьянский дом: каменный цоколь, оштукатуренные стены в деревянном каркасе, крутая соломенная двускатная крыша, каменная печная труба на торце, дверь, окно с ставнями и ящиком цветов, окошко на чердаке, бочка у двери, вымпел на коньке. 4,2 × 3,2 м по стенам, 4,4 м до конька, 5,8 м с вымпелом | 804 | 14 из 16 |

![Крестьянский дом: три ракурса](previews/peasant-house.png)

![Деревня из шести домов с камеры RTS](previews/peasant-house-squad.png)

![Крестьянский дом вблизи: дверь, окно, бочка](previews/peasant-house-near.png)

Метры, +Y вверх, фасад (дверь и окно) смотрит в +Z, конёк идёт вдоль X, труба на стороне +X
(стандарт glTF). Начало координат — на земле в центре дома. Открывается в Blender, Unity, Godot и
любом просмотрщике glTF.

Цвет команды — тексели `team` и `teamDark` палитры, те же, что у юнитов: дверь, ставни и вымпел.

## В ArcEngine

Скопировать файл в `assets/models/` (путь к ассету в коде — литералом `'assets/…'`, иначе сборщик
его не увидит) и расставить во вкладке Objects редактора или из кода:

```js
const model = await Model3D.load('assets/models/peasant-house.glb', view.scene);
const house = Model3D.build(model, view.scene, { name: 'house' });
World3D.addObject(view, house, 'prop');
house.scaling.setAll(0.25);                         // тот же масштаб, что у юнитов
house.position.set(x, terrain.heightAt(x, y), y);
house.rotation.y = heading;
```

Много одинаковых домов — `World3D.addInstances(view, mesh, 'prop', items)`: одна модель — один
draw call на всю деревню (скилл `world3d`).

## Как меняются модели

Модели генерируются кодом, руками файлы не правятся:

```
node tools/make-buildings.mjs                       # пересобрать все здания
node tools/make-buildings.mjs --check               # проверить, что файлы совпадают с генератором
node tools/unit-preview.mjs peasant-house           # previews/peasant-house.png — три ракурса в сцене игры
node tools/unit-preview.mjs peasant-house --squad   # previews/peasant-house-squad.png — деревня с камеры RTS
node tools/unit-preview.mjs peasant-house --near --pose=20   # вблизи; --pose — углы в градусах (0 — фасад)
```

Здание описано в `tools/buildings/<имя>.mjs` (палитра, детали из коробок и усечённых конусов,
`static: true`), сборщик GLB — общий `tools/unit-glb.mjs`. Новое здание — новый файл в
`tools/buildings/` и строка в `BUILDINGS` в `tools/make-buildings.mjs`.
