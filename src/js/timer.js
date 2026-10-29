// Pomodoro timer. Remaining time is derived from an end timestamp, so it stays
// accurate even when the webview is throttled in the background.
class PomodoroTimer {
  constructor(getSettings, onFinish) {
    this.getSettings = getSettings;
    this.onFinish = onFinish;
    this.mode = 'focus';        // focus | short | long
    this.state = 'idle';        // idle | running | paused | done
    this.completed = 0;         // finished focus sessions
    this.customMs = null;       // one-off length for the current session
    this.reset();
  }

  lengthMs(mode) {
    const s = this.getSettings();
    const min = mode === 'focus' ? s.focus : mode === 'short' ? s.short : s.long;
    return Math.round(min * 60000);
  }

  get total() { return this.customMs ?? this.lengthMs(this.mode); }

  reset() {
    this.state = 'idle';
    this.remaining = this.total;
  }

  start() {
    if (this.state === 'running') return;
    if (this.state === 'done') this.advance();
    this.endAt = Date.now() + this.remaining;
    this.state = 'running';
  }

  pause() {
    if (this.state !== 'running') return;
    this.remaining = Math.max(0, this.endAt - Date.now());
    this.state = 'paused';
  }

  toggle() { this.state === 'running' ? this.pause() : this.start(); }

  nextMode() {
    if (this.mode !== 'focus') return 'focus';
    const every = this.getSettings().longEvery;
    return this.completed > 0 && this.completed % every === 0 ? 'long' : 'short';
  }

  // Moves to the next mode without counting the current one (also used by Skip).
  advance() {
    this.mode = this.nextMode();
    this.customMs = null;
    this.reset();
  }

  setCustom(ms) {
    this.customMs = ms;
    this.reset();
  }

  // Called when settings change: refresh an untouched idle timer.
  refresh() {
    if (this.state === 'idle' && this.customMs == null) this.remaining = this.total;
  }

  tick() {
    if (this.state !== 'running') return;
    this.remaining = Math.max(0, this.endAt - Date.now());
    if (this.remaining === 0) {
      this.state = 'done';
      if (this.mode === 'focus') this.completed++;
      this.onFinish(this.mode);
    }
  }
}
