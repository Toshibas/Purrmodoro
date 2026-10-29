(() => {
  const W = SCENE_W, H = SCENE_H;
  const BAR_H = 40;
  const INK = '#4b3226';
  const MODES = {
    focus: { label: 'FOCUS', color: '#c4553f' },
    short: { label: 'SHORT BREAK', color: '#3f8a5e' },
    long:  { label: 'LONG BREAK', color: '#3f6aa0' },
  };

  const $ = id => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Tauri window handle (absent when opened in a normal browser).
  const tauri = window.__TAURI__;
  const appWin = tauri?.window?.getCurrentWindow?.();

  let settings = Settings.load();
  let customSound = Settings.loadSound();
  const timer = new PomodoroTimer(() => settings, onFinish);
  const grumpy = new Grumpy();
  const playmates = new Playmates(grumpy);
  const cats = [grumpy, ...playmates.cats];

  let digitsRect = { x: 0, y: 0, w: 0, h: 0 };
  let editing = false;
  let autoStartTimer = null;

  // ---------- timer events ----------

  function onFinish(mode) {
    Meow.play(mode === 'focus' ? 'grumpy' : 'happy', settings, customSound);
    clearTimeout(autoStartTimer);
    if (settings.autoStart) {
      autoStartTimer = setTimeout(() => { if (timer.state === 'done') timer.start(); }, 4000);
    }
  }

  function mood() {
    switch (timer.state) {
      case 'running': return timer.mode === 'focus' ? 'focus' : 'break';
      case 'done': return 'done';
      default: return 'rest';
    }
  }

  function fmt(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60), sec = s % 60;
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  // ---------- drawing ----------

  function drawRoom() {
    ctx.fillStyle = '#f4dfc4';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#efd5b5';
    for (let x = 3; x < W; x += 8) ctx.fillRect(x, 0, 2, 55);

    ctx.fillStyle = '#e9c9a3';
    ctx.fillRect(0, 55, W, 1);
    ctx.fillStyle = '#b07a50';
    ctx.fillRect(0, 56, W, 2);

    ctx.fillStyle = '#d39a67';
    ctx.fillRect(0, 58, W, H - 58);
    ctx.fillStyle = '#bf8656';
    const lines = [58, 64, 71, 78, H];
    for (let i = 1; i < lines.length - 1; i++) ctx.fillRect(0, lines[i], W, 1);
    for (let i = 0; i < lines.length - 1; i++) {
      for (let x = (i * 17) % 30 + 6; x < W; x += 30) ctx.fillRect(x, lines[i] + 1, 1, lines[i + 1] - lines[i] - 1);
    }
  }

  function drawHud(now) {
    const info = MODES[timer.mode];

    const text = fmt(timer.remaining);
    const tw = Font.measure(text, Font.BIG, 2);
    const tx = Math.round((W - tw) / 2), ty = 7;
    digitsRect = { x: tx - 3, y: ty - 3, w: tw + 6, h: 14 + 6 };
    const flash = timer.state === 'done' && Math.floor(now / 400) % 2 === 0;
    if (editing) drawEntry(tx, ty, info.color, now);
    else Font.draw(ctx, text, tx, ty, Font.BIG, 2, flash ? info.color : INK);

    let label = info.label, color = info.color;
    if (timer.state === 'paused') { label = 'PAUSED'; color = '#8a6a55'; }
    if (timer.state === 'done') label = timer.mode === 'focus' ? 'BREAK TIME!' : 'BACK TO WORK!';
    const lw = Font.measure(label, Font.SMALL, 1);
    Font.draw(ctx, label, Math.round((W - lw) / 2), 26, Font.SMALL, 1, color);

    // progress bar
    const bw = 70, bx = (W - bw) / 2, by = 34;
    const done = timer.total ? 1 - timer.remaining / timer.total : 0;
    ctx.fillStyle = '#e2c3a0';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = info.color;
    ctx.fillRect(bx, by, Math.round(bw * done), 2);

    // finished-focus pips for the current long-break cycle
    const every = settings.longEvery;
    let filled = timer.completed % every;
    if (filled === 0 && timer.completed > 0 && timer.mode !== 'focus') filled = every;
    const pw = every * 5 - 2, px = Math.round((W - pw) / 2);
    for (let i = 0; i < every; i++) {
      ctx.fillStyle = i < filled ? '#c4553f' : '#e2c3a0';
      ctx.fillRect(px + i * 5, 39, 3, 3);
    }
  }

  // ---------- main loop (~15 fps is plenty for pixel art) ----------

  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    timer.tick();
    if (acc >= 1 / 15) {
      const m = mood();
      grumpy.update(acc, m);
      playmates.update(acc, m);
      acc = 0;

      drawRoom();
      drawHud(now);
      [...cats].sort((a, b) => a.footY - b.footY).forEach(c => drawCat(ctx, c));
      syncButtons();
    }
    requestAnimationFrame(frame);
  }
  // Keeps the end-of-timer meow on time even if animation frames are throttled.
  setInterval(() => timer.tick(), 500);

  // ---------- buttons ----------

  document.querySelectorAll('[data-icon]').forEach(b => { b.innerHTML = Icons.svg(b.dataset.icon); });

  let shownIcon = 'play';
  function syncButtons() {
    const icon = timer.state === 'running' ? 'pause' : 'play';
    if (icon !== shownIcon) { $('btn-play').innerHTML = Icons.svg(icon); shownIcon = icon; }
    document.title = timer.state === 'running' ? `${fmt(timer.remaining)} · Purrmodoro` : 'Purrmodoro';
  }

  function togglePlay() {
    closeEntry(true);
    Meow.unlock();
    clearTimeout(autoStartTimer);
    timer.toggle();
  }
  function resetTimer() { clearTimeout(autoStartTimer); timer.customMs = null; timer.reset(); }
  function skipTimer() { clearTimeout(autoStartTimer); timer.advance(); }

  $('btn-play').onclick = togglePlay;
  $('btn-reset').onclick = resetTimer;
  $('btn-skip').onclick = skipTimer;
  $('btn-settings').onclick = openSettings;
  $('btn-close').onclick = () => appWin?.close();
  $('btn-min').onclick = () => appWin?.minimize();

  // ---------- canvas: drag window / edit time ----------

  function scenePoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function overDigits(e) {
    const p = scenePoint(e), d = digitsRect;
    return timer.state !== 'running' && p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y && p.y <= d.y + d.h;
  }

  canvas.addEventListener('mousemove', e => { canvas.style.cursor = overDigits(e) ? 'text' : 'grab'; });
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (overDigits(e)) {
      e.preventDefault();
      if (!editing) openEntry();
      return;
    }
    if (editing) closeEntry(true);
    appWin?.startDragging();
  });

  // ---------- custom time entry: typed straight into the clock ----------
  // Digits fill MM:SS left to right (2 5 3 0 -> 25:30). Empty slots count as 0.

  let entry = '';

  function openEntry() {
    entry = '';
    editing = true;
  }

  function closeEntry(apply) {
    if (!editing) return;
    editing = false;
    if (!apply || !entry) return;
    const digits = entry.padEnd(4, '0');
    const ms = (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2))) * 1000;
    if (ms > 0) { clearTimeout(autoStartTimer); timer.setCustom(ms); }
  }

  function entryKey(e) {
    if (/^[0-9]$/.test(e.key)) {
      // The first seconds digit can't be above 5.
      if (entry.length < 4 && !(entry.length === 2 && e.key > '5')) entry += e.key;
    } else if (e.key === 'Backspace') {
      entry = entry.slice(0, -1);
    } else if (e.key === 'Enter') {
      closeEntry(true);
    } else if (e.key === 'Escape') {
      closeEntry(false);
    } else {
      return;
    }
    e.preventDefault();
  }

  // Typed digits in ink, empty slots as faint zeros, next slot blinking.
  function drawEntry(x, y, accent, now) {
    const slots = [entry[0], entry[1], ':', entry[2], entry[3]];
    const cursor = entry.length < 4 ? [0, 1, 3, 4][entry.length] : -1;
    const blinkOn = Math.floor(now / 450) % 2 === 0;
    slots.forEach((ch, i) => {
      let color = INK;
      if (ch === undefined) {
        ch = '0';
        color = i === cursor && blinkOn ? accent : '#dcc09f';
      }
      Font.draw(ctx, ch, x, y, Font.BIG, 2, color);
      x += Font.measure(ch, Font.BIG, 2) + 2;
    });
  }

  // ---------- keyboard ----------

  document.addEventListener('keydown', e => {
    if (!$('settings').classList.contains('hidden')) {
      if (e.key === 'Escape') closeSettings();
      return;
    }
    if (editing) { entryKey(e); return; }
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'r' || e.key === 'R') resetTimer();
    else if (e.key === 's' || e.key === 'S') skipTimer();
  });

  // ---------- settings panel ----------

  const FIELDS = ['focus', 'short', 'long', 'longEvery', 'autoStart', 'volume', 'mute', 'onTop', 'scale'];

  function openSettings() {
    for (const k of FIELDS) {
      const el = $('s-' + k);
      if (el.type === 'checkbox') el.checked = settings[k];
      else el.value = settings[k];
    }
    showSoundName();
    $('settings').classList.remove('hidden');
  }
  function closeSettings() { $('settings').classList.add('hidden'); }

  for (const k of FIELDS) {
    $('s-' + k).addEventListener('change', e => {
      const el = e.target;
      const v = el.type === 'checkbox' ? el.checked : Settings.clamp(k, Number(el.value));
      if (el.type !== 'checkbox') el.value = v;
      settings = { ...settings, [k]: v };
      Settings.save(settings);
      timer.refresh();
      if (k === 'onTop') applyOnTop();
      if (k === 'scale') applyScale();
    });
  }
  $('s-volume').addEventListener('input', e => { settings.volume = Number(e.target.value); });

  $('s-done').onclick = closeSettings;
  $('s-test').onclick = () => {
    Meow.unlock();
    Meow.play('happy', { ...settings, mute: false }, customSound);
  };
  $('s-pick').onclick = () => $('s-file').click();
  $('s-default').onclick = () => {
    customSound = null;
    Settings.saveSound(null);
    showSoundName();
  };
  $('s-file').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { $('s-sound-name').textContent = 'File too big (max 3 MB).'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const sound = { name: file.name, data: reader.result };
      if (!Settings.saveSound(sound)) { $('s-sound-name').textContent = 'Could not save that file.'; return; }
      customSound = sound;
      showSoundName();
    };
    reader.readAsDataURL(file);
  });
  function showSoundName() {
    $('s-sound-name').textContent = customSound ? `Using: ${customSound.name}` : 'Using: built-in meow';
  }

  // ---------- window ----------

  function applyScale() {
    const s = settings.scale;
    document.documentElement.style.setProperty('--scale', s);
    const LogicalSize = tauri?.dpi?.LogicalSize || tauri?.window?.LogicalSize;
    if (appWin && LogicalSize) appWin.setSize(new LogicalSize(W * s, H * s + BAR_H));
  }
  function applyOnTop() { appWin?.setAlwaysOnTop(settings.onTop); }

  applyScale();
  applyOnTop();
  requestAnimationFrame(frame);

  // Exposed for debugging in devtools.
  window.purr = { timer, grumpy, playmates, settings: () => settings };
})();
