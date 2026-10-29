// Settings persisted in the webview's localStorage (kept in the app's data folder).
const Settings = {
  KEY: 'purrmodoro.settings',
  SOUND_KEY: 'purrmodoro.meow',

  defaults: {
    focus: 25,
    short: 5,
    long: 15,
    longEvery: 4,
    autoStart: false,
    volume: 80,
    mute: false,
    onTop: true,
    scale: 3,
  },

  limits: {
    focus: [1, 180],
    short: [1, 180],
    long: [1, 180],
    longEvery: [1, 12],
    volume: [0, 100],
    scale: [2, 4],
  },

  load() {
    try {
      return { ...this.defaults, ...JSON.parse(localStorage.getItem(this.KEY) || '{}') };
    } catch {
      return { ...this.defaults };
    }
  },

  save(s) {
    try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch {}
  },

  clamp(key, value) {
    const lim = this.limits[key];
    if (!lim || !Number.isFinite(value)) return Number.isFinite(value) ? value : this.defaults[key];
    return Math.min(lim[1], Math.max(lim[0], value));
  },

  // Custom meow: { name, data } where data is a data: URL.
  loadSound() {
    try { return JSON.parse(localStorage.getItem(this.SOUND_KEY) || 'null'); } catch { return null; }
  },

  saveSound(sound) {
    try {
      if (sound) localStorage.setItem(this.SOUND_KEY, JSON.stringify(sound));
      else localStorage.removeItem(this.SOUND_KEY);
      return true;
    } catch {
      return false;
    }
  },
};
