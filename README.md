# Purrmodoro

A tiny always-on-top Pomodoro timer with three pixel-art cats (see [SPEC.md](SPEC.md)).

- **Grumpy** (gray Scottish Fold) lies in his spot, sometimes gets up, waits, turns, and flops back down.
- **Tux** and **Patches** chase each other, swap roles, pounce, rest, and repeat.
- When a timer ends, everyone sits up and a meow plays.

## Using it

| Action | How |
|---|---|
| Start / pause | ▶ button or `Space` |
| Reset | ↺ button or `R` |
| Skip to next mode | ⏭ button or `S` |
| One-off custom timer | Click the time while it's stopped and type digits straight into the clock: the first two are minutes, the next two seconds (`2530` = 25:30, `05` = 05:00). Enter or Start to set, Backspace to fix, Esc to cancel |
| Lengths, volume, size, always-on-top, your own meow file | ⚙ button |
| Move the window | Drag anywhere on the room |

## Project layout

```
src/            the app (plain HTML/CSS/JS, no build step)
  js/sprites.js   pixel-art cats (part maps + per-cat colours)
  js/cats.js      cat behaviour
  js/timer.js     pomodoro logic
  js/audio.js     synthesized meow / custom sound
src-tauri/      native shell (Tauri 2)
app-icon.png    source for the app icons
tools/serve.ps1 preview the UI in a browser on Windows
```

## Preview on Windows (UI only)

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Then open http://localhost:5173. Window buttons (close, minimise, always on top, drag) only work in the real app.

## Build the Mac app

macOS apps have to be built on a Mac. You can do it in either of two ways.

**A. GitHub Actions (no Mac needed):** push this folder to a GitHub repo, open **Actions → Build macOS app → Run workflow**, and download the `.dmg` from the run's artifacts.

**B. On a Mac:** install [Rust](https://rustup.rs) and [Node.js](https://nodejs.org), then run:

```bash
npx @tauri-apps/cli@2 icon app-icon.png
```

```bash
npx @tauri-apps/cli@2 build
```

The `.dmg` ends up in `src-tauri/target/release/bundle/dmg/`. Use `npx @tauri-apps/cli@2 dev` to run it with live reload.

The app is not code-signed. The first time you open it, right-click it and choose **Open**, or run `xattr -cr /Applications/Purrmodoro.app`.

## Not in v1 yet

These items from the spec are not built yet: the menu-bar icon, system notifications, the opacity slider and launch at login. Settings are stored in the app's webview storage rather than in tauri-plugin-store.
