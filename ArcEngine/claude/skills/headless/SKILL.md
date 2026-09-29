---
name: headless
description: Seeing the game without the Browser pane — tools/browser.mjs (static no-store server, headless Chrome/Edge with software WebGL2, CDP eval, screenshots, Debug3D.lint from the terminal) and tools/unit-preview.mjs (a unit from 3D-models/ in the real scene). Read when there is no Browser pane (cloud sandbox, CI, terminal-only agent), before claiming anything renders correctly from such an environment, and when headless Chrome fails to start or has no WebGL.
---

# Headless: the game in a terminal

Skill `verify` assumes the Browser pane. Without it, `tools/browser.mjs` gives the same
page: its own static server (no-store, free port — no clash with a running `run.bat`),
Chrome / Edge / Chromium headless with SwiftShader (software WebGL2, no GPU needed), and the
DevTools protocol over Node's built-in WebSocket (Node 22+). Zero dependencies.

```
node tools/browser.mjs --shot=out.png                  # the game as the player starts it
node tools/browser.mjs --eval=probe.js --shot=out.png  # run probe.js in the page first
node tools/browser.mjs --lint                          # Debug3D.lint(); exit 1 on errors
node tools/browser.mjs --page=/_utils/editor/ --size=1600x900 --shot=editor.png
node tools/unit-preview.mjs swordsman [--squad | --near | --pose=clip@sec,...] [--out=x.png]
```

- `probe.js` is the BODY of an async function: `await` freely, `return` a JSON-able value —
  it is printed. Everything of the page is there: `app`, `World3D`, `Model3D`, `Debug3D`.
- Exit code 1 on an uncaught page exception, a failed eval or lint errors; console errors,
  warnings and exceptions are printed after the run.
- The page waits until every location object has loaded or failed (`GAME_READY`); another
  page waits for `document.readyState`.
- As a library: `const page = await openGame(); await page.eval('return 1'); await
  page.shot(file); await page.close();` (`serve`, `launch`, `lint` are exported too).
- The editor page is served as static files: viewing works, saving does not (that needs
  `_utils/editor/server.mjs`).

## Rules

- A screenshot is evidence only after you LOOKED at it (open the PNG). A successful run means
  "no exception", not "looks right".
- Frame views from the terrain: `h = app.location.terrain.heightAt(x, y)`, eye and target
  relative to `h`. Absolute heights put the eye inside a hill; `Debug3D.hold` then lifts it
  (`clamped: true`) and the shot shows something else.
- Wait for shaders before the shot: poll `material.isReady(mesh)`, then `Debug3D.frames(n)`
  (headless gets no reliable rAF). `unit-preview.mjs` does both.
- SwiftShader timings are not performance numbers: `Debug3D.bench()` reports CPU
  rasterisation (a frame costs hundreds of ms). Measure cost on a real GPU (skill `verify`) or
  report triangles and draw calls instead.
- One run is one browser: the probe's changes die with it, nothing to restore. A unit preview
  run takes about a minute in software rendering; batch shots into one probe when you can.

## When Chrome does not start

| Symptom | Cause, fix |
|---|---|
| error "Chrome, Edge or Chromium not found" | set `CHROME` to the browser executable |
| Chrome exits with SIGTRAP right after "DevTools listening" | started through an absolute symlink; the tool resolves `realpath` — keep it |
| error "no WebGL2 in the browser" | the GPU process failed: keep `--use-angle=swiftshader --in-process-gpu --enable-unsafe-swiftshader` |
| crash when attaching to the startup tab | attach only to a tab created with `PUT /json/new` (as the tool does) |
| running as root on Linux | `--no-sandbox` is added automatically |

Do not `pkill -f chrome` from a shell whose own command line contains "chrome": it kills the
shell. Use `pkill -x chrome`.
