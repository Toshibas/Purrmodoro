# Purrmodoro — Product & Technical Spec

A tiny always-on-top desktop Pomodoro timer with three pixel-art cats based on the owner's real cats.

---

## 1. Goals

- Small, cute timer that stays on top of all other windows.
- Three animated pixel-art cats that live in the window while the timer runs.
- Custom timer lengths.
- A "Meow" sound when a timer ends.
- Runs as a native app on **macOS** (Windows build is a bonus, not required).

Out of scope for v1: statistics/history, task lists, cloud sync, accounts.

---

## 2. The cats

All cats are pixel art at a native **32×32 px** per frame (scaled up ×3 or ×4 with nearest-neighbour, no smoothing). Limited palette per cat (≤ 8 colours) with a 1 px dark outline.

### 2.1 Grumpy — gray Scottish Fold (photo 3)

| Trait | Pixel-art detail |
|---|---|
| Coat | Silver/light gray with dark charcoal tabby stripes; "marble" swirl on the side |
| Ears | Folded flat (Scottish Fold) — small rounded bumps, no points |
| Eyes | Yellow-green, **half-closed**, heavy lids — permanently unimpressed |
| Nose | Small pinkish-orange |
| Tail | Thick, striped, wrapped around the body when lying |

**Behaviour — "the loaf":**
1. `lie` — lies curled, mostly still. Idle micro-animation: slow breathing (1 px body rise), occasional slow blink, ear/tail twitch. Duration: random **20–60 s**.
2. `stand_up` — gets up reluctantly (4–6 frames).
3. `stand_wait` — stands in place, glances left/right, maybe one grumpy look at the user. Duration: random **3–8 s**.
4. `lie_down` — turns once and flops back down (4–6 frames).
5. Back to `lie`.

He never walks around. He stays in one fixed spot (bottom-left of the scene).

### 2.2 The playful pair — black & white cats (photos 1 & 2)

> **Assumption:** the two black-and-white photos are two different cats, and "playing catch" means they chase each other. If it's actually one cat, drop Cat B and have Cat A chase a toy (ball/mouse) instead.

**Cat A — "Tux"** (photo 1)
- Black body, white chin/muzzle stripe, big white chest bib, white paws.
- Folded ears, **huge round yellow eyes** with big black pupils (surprised look).

**Cat B — "Patches"** (photo 2)
- Mostly white with a black "cap" over the top of the head and ears, black patches on back and side.
- Upright pointed ears, amber eyes, pink nose.

**Behaviour — "catch":**
1. `run` — one cat chases the other across the scene floor. Run cycle 6 frames. When the chaser reaches the runner (or a random 3–6 s passes) they **swap roles** and run the other way. Occasional `pounce` (3 frames) when catching.
2. Repeat chase for random **15–40 s** total.
3. `rest` — both slow down, sit, then lie down (flopped on side). Breathing animation. Duration random **10–25 s**.
4. Get up, stretch (optional), back to `run`.

Rules:
- Cats stay inside the window bounds and turn around at the edges (sprites are flipped horizontally for direction).
- They may run *past* Grumpy but never through him; drawing order is by Y (lower = in front).
- Rare easter egg: a running cat bumps Grumpy → Grumpy does `stand_up`, glares, and lies down again.

### 2.3 Timer-state reactions

| Timer state | Cats |
|---|---|
| Idle / paused | Everyone rests (Tux & Patches lie down, Grumpy lies) |
| Focus running | Normal behaviour loops above |
| Break running | Tux & Patches play more (longer chases); Grumpy the same (he doesn't care) |
| Timer finished | All three cats sit up and look at the user, Tux & Patches do a little hop, **Meow** plays |

### 2.4 Sprite sheet list (minimum)

| Cat | Animations (frames) |
|---|---|
| Grumpy | lie (4), blink (2), stand_up (5), stand_wait (4), lie_down (5), glare (2), sit_alert (2) |
| Tux | run (6), pounce (3), sit (2), lie (4), stand_up (4), hop (4) |
| Patches | run (6), pounce (3), sit (2), lie (4), stand_up (4), hop (4) |

Format: one PNG sprite sheet per cat + a JSON atlas (Aseprite export format is fine). Frame rate ~8–10 fps for a classic pixel feel.

---

## 3. Window & layout

- Default size **~260 × 200 px** (logical), resizable in steps (S / M / L presets) that keep integer pixel scaling.
- **Always on top** of every other window, including full-screen spaces on macOS where the OS allows (`floating` / `screen-saver` level, visible on all Spaces).
- Frameless, rounded corners, optional slightly transparent background. Whole window is draggable.
- Remembers last position and size between launches.

```
┌──────────────────────────────┐
│  ⚙                      — ✕  │  ← tiny controls, show on hover
│                              │
│          24:59               │  ← pixel font timer
│        [ FOCUS ]             │  ← mode label
│                              │
│  🐱(Grumpy)   🐈💨 🐈        │  ← cat "floor" strip
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│
│      ▶  ⏸  ↺                │  ← start / pause / reset
└──────────────────────────────┘
```

- Pixel font for all text (e.g. "Press Start 2P" or "Silkscreen", both OFL-licensed).
- Colour theme: warm, cozy (beige/peach floor, soft dark text). Optional dark theme.

---

## 4. Timer features

### 4.1 Modes
- **Focus** — default 25 min
- **Short break** — default 5 min
- **Long break** — default 15 min, after every 4 focus sessions (configurable)

### 4.2 Custom timer
- Settings panel lets the user set each mode's length: **1–180 min**, with optional seconds.
- Quick "custom one-off" timer: click the time display to type any value (e.g. `45`, `12:30`).
- Option: auto-start next session (on/off).

### 4.3 Controls
- Start / Pause / Resume, Reset, Skip to next mode.
- Keyboard: `Space` start/pause, `R` reset, `S` skip, `Esc` close settings.
- Tray / menu-bar icon (macOS menu bar) shows remaining time and has Start/Pause/Quit.

### 4.4 Accuracy
- Timer is computed from a start timestamp (not by counting ticks), so it stays correct if the app is backgrounded or the machine is busy.

---

## 5. Sound

- At the end of every timer: play a **"Meow"** sound.
- Bundled default: a short, clear meow (≈1 s) — royalty-free/CC0 sample, or a recording of one of the real cats (best option!).
- Settings: volume slider, mute toggle, "Test meow" button.
- Optional: different meow for end of focus vs end of break (e.g. a grumpy low meow for focus end, a happy chirpy one for break end).
- Optional: system notification ("Break time! 🐾") along with the sound.

---

## 6. Settings (persisted locally)

| Setting | Default |
|---|---|
| Focus length | 25 min |
| Short break | 5 min |
| Long break | 15 min |
| Long break every | 4 sessions |
| Auto-start next | off |
| Volume | 80 % |
| Mute | off |
| Always on top | on |
| Window scale | M (×3) |
| Opacity | 100 % |
| Launch at login | off |

Stored as JSON in the platform app-data folder (`~/Library/Application Support/Purrmodoro/` on macOS).

---

## 7. Technical approach

**Recommended stack: Tauri 2 + TypeScript + HTML Canvas**
- Small native app (~5–10 MB) vs ~150 MB with Electron.
- Window flags: `alwaysOnTop: true`, `decorations: false`, `transparent: true` (needs `macOSPrivateApi` on macOS), `visibleOnAllWorkspaces: true`, `skipTaskbar: true`.
- Rendering: a single `<canvas>` with `image-rendering: pixelated`, a simple game loop (`requestAnimationFrame`), and a tiny state machine per cat.
- Audio: Web Audio / `HTMLAudioElement` with the bundled `meow.ogg` / `meow.mp3`.
- Settings: `tauri-plugin-store`. Tray: Tauri tray API. Notifications: `tauri-plugin-notification`.

Alternative if simpler tooling is preferred: Electron (same front-end code, `win.setAlwaysOnTop(true, 'floating')`).

### Code structure
```
src/
  main.ts            app bootstrap, game loop
  timer.ts           timer logic (modes, timestamps, events)
  cats/
    CatBase.ts       sprite animation + state machine helper
    Grumpy.ts        lie → stand → wait → lie loop
    Playmates.ts     Tux & Patches chase / rest logic
  render.ts          canvas drawing, Y-sorting, scaling
  audio.ts           meow playback
  settings.ts        load/save settings
  ui/                controls, settings panel
assets/
  sprites/grumpy.png, tux.png, patches.png (+ .json)
  sounds/meow.ogg
  fonts/
src-tauri/           Tauri config & Rust shell
```

### Cat state machine (shared shape)
```ts
type CatState = { name: string; anim: string; minMs: number; maxMs: number; next: () => string };
// Each tick: advance animation frame; when state time elapses (or anim ends for one-shots), go to next().
```

---

## 8. macOS build & distribution

- Output: `Purrmodoro.app` packaged in a `.dmg`, **universal** (Apple Silicon + Intel).
- macOS apps **must be built on a Mac** (or via GitHub Actions `macos-latest`) — they can't be produced from Windows.
- Without an Apple Developer account the app is unsigned: first launch needs right-click → Open (or `xattr -cr Purrmodoro.app`). Signing + notarisation optional for v1.
- Minimum target: macOS 11 Big Sur.

---

## 9. Acceptance criteria

1. App launches as a small frameless window that stays above all other apps, on every Space.
2. Grumpy lies, occasionally stands for a few seconds, and lies back down — never wanders.
3. Tux & Patches chase each other across the floor, swap roles, periodically lie down to rest, then resume.
4. All sprites are crisp pixel art (no blur) recognisably matching the three real cats.
5. User can set custom lengths for focus / breaks and a one-off custom timer.
6. When any timer ends, a meow plays (respecting volume/mute) and cats react.
7. Settings and window position persist across restarts.
8. A `.dmg` installs and runs on an Apple Silicon and an Intel Mac.
9. Idle CPU usage stays low (< 3 % on an M1) — cap animation at ~10–15 fps.

---

## 10. Open questions

- Are the two black-and-white photos two different cats (assumed yes)?
- Real cat names to use instead of Grumpy / Tux / Patches?
- Can you record a real meow from one of them for the end sound?
- Is a Windows build also wanted?
