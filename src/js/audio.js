// End-of-timer meow. Uses the user's own sound if they picked one, otherwise
// synthesises a meow: a sawtooth with a rising-then-falling pitch pushed
// through moving formant filters ("mi-aa-ow").
const Meow = (() => {
  let ac = null;

  function audioCtx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  // kind: 'grumpy' (low, slow; end of focus) or 'happy' (chirpy; end of break)
  function synth(volume, kind) {
    const a = audioCtx();
    if (!a) return;
    const low = kind === 'grumpy';
    const p = low ? 0.78 : 1.12;
    const dur = low ? 0.95 : 0.7;
    const t = a.currentTime + 0.03;

    const osc = a.createOscillator();
    osc.type = 'sawtooth';
    const f = osc.frequency;
    f.setValueAtTime(480 * p, t);
    f.linearRampToValueAtTime(860 * p, t + dur * 0.28);
    f.linearRampToValueAtTime(760 * p, t + dur * 0.6);
    f.exponentialRampToValueAtTime(400 * p, t + dur);

    const lfo = a.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = a.createGain();
    lfoGain.gain.value = 14 * p;
    lfo.connect(lfoGain).connect(f);

    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + 0.05);
    env.gain.setValueAtTime(1, t + dur * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // [start, middle, end] formant frequencies, Q, level
    const formants = [
      [[700, 1000, 600], 5, 1],
      [[1800, 2000, 1000], 9, 0.6],
      [[3200, 3000, 2600], 12, 0.25],
    ];
    for (const [fr, q, level] of formants) {
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = q;
      bp.frequency.setValueAtTime(fr[0] * p, t);
      bp.frequency.linearRampToValueAtTime(fr[1] * p, t + dur * 0.35);
      bp.frequency.linearRampToValueAtTime(fr[2] * p, t + dur);
      const g = a.createGain();
      g.gain.value = level * 3;
      osc.connect(bp).connect(g).connect(env);
    }

    const master = a.createGain();
    master.gain.value = volume * 0.6;
    env.connect(master).connect(a.destination);

    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }

  return {
    // Call from a click so the webview allows audio later.
    unlock() { audioCtx(); },

    play(kind, settings, customSound) {
      if (settings.mute) return;
      const volume = settings.volume / 100;
      if (customSound) {
        const el = new Audio(customSound.data);
        el.volume = volume;
        el.play().catch(() => synth(volume, kind));
        return;
      }
      synth(volume, kind);
    },
  };
})();
