// Cat behaviour. Moods come from the timer:
//   rest  (idle / paused)  everyone lies down
//   focus / break          normal loops (break = longer chases)
//   done                   everyone sits up and looks at you
const SCENE_W = 120, SCENE_H = 84;

function rand(a, b) { return a + Math.random() * (b - a); }

class Cat {
  constructor(kind, x, footY) {
    this.kind = kind;
    this.x = x;
    this.footY = footY;
    this.dir = 1;
    this.pose = 'lie';
    this.yOff = 0;
    this.sleeping = false;
    this.blinkOn = false;
    this.blinkT = rand(2, 5);
    this.breathT = rand(0, 1.3);
    this.breathIn = false;
  }

  tickIdle(dt) {
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinkOn = !this.blinkOn;
      this.blinkT = this.blinkOn ? 0.14 : rand(2.5, 6);
    }
    this.breathT += dt;
    if (this.breathT > 1.3) { this.breathT = 0; this.breathIn = !this.breathIn; }
  }

  get drawPose() { return this.pose === 'lie' && this.breathIn ? 'lie2' : this.pose; }
  get eyesClosed() { return this.sleeping || this.blinkOn; }
}

// Gray grumpy cat: lies in his spot, sometimes stands up, waits, turns once and flops back.
class Grumpy extends Cat {
  constructor() {
    super('grumpy', 4, 80);
    this.state = 'lie';
    this.t = rand(8, 15);       // first stand-up comes a bit sooner
  }

  set(state, t) { this.state = state; this.t = t; }

  // A playmate ran into him: get up and glare at it.
  glareAt(other) {
    if (this.state !== 'lie') return;
    this.dir = other.x > this.x ? 1 : -1;
    this.after = 'glare';
    this.set('rising', 0.35);
  }

  update(dt, mood) {
    this.tickIdle(dt);
    if (mood === 'done') {
      this.state = 'alert';
      this.pose = 'sit';
      this.dir = 1;
      return;
    }
    if (this.state === 'alert') this.set('lie', rand(8, 20));

    this.t -= dt;
    switch (this.state) {
      case 'lie':
        this.pose = 'lie';
        if (this.t <= 0) {
          if (mood === 'rest') this.t = rand(10, 20);
          else { this.after = 'stand'; this.set('rising', 0.35); }
        }
        break;
      case 'rising':
        this.pose = 'crouch';
        if (this.t <= 0) {
          if (this.after === 'glare') this.set('glare', 2.5);
          else {
            this.set('stand', rand(3, 8));
            this.turnAt = this.t * rand(0.3, 0.7);
            this.turned = false;
          }
        }
        break;
      case 'stand':
        this.pose = 'stand';
        if (!this.turned && this.t < this.turnAt) { this.dir *= -1; this.turned = true; }
        if (this.t <= 0) this.set('sinking', 0.35);
        break;
      case 'glare':
        this.pose = 'stand';
        if (this.t <= 0) this.set('sinking', 0.35);
        break;
      case 'sinking':
        this.pose = 'crouch';
        if (this.t <= 0) this.set('lie', rand(20, 60));
        break;
    }
  }
}

// The black-and-white pair: chase each other, swap roles, rest, repeat.
class Playmates {
  constructor(grumpy) {
    this.grumpy = grumpy;
    this.tux = new Cat('tux', 46, 74);
    this.patches = new Cat('patches', 82, 70);
    this.cats = [this.tux, this.patches];
    this.runner = this.patches;
    this.chaser = this.tux;
    for (const c of this.cats) {
      Object.assign(c, { pose: 'lie', sleeping: true, pause: 0, pounceT: 0, animT: 0, frame: 0, near: false });
    }
    this.patches.dir = -1;
    this.state = 'sleep';
    this.t = 0;
    this.forever = true;
  }

  set(state, t) { this.state = state; this.t = t; }

  update(dt, mood) {
    for (const c of this.cats) c.tickIdle(dt);

    if (mood === 'done') {
      if (this.state !== 'celebrate') { this.set('celebrate', 0); this.celebT = 0; }
    } else if (mood === 'rest') {
      this.forever = true;
      if (this.state === 'rest') this.state = 'sleep';
      else if (this.state !== 'settle' && this.state !== 'sleep') this.settle(true);
    } else if (this.state === 'celebrate' || this.state === 'sleep') {
      this.wake();
    }

    this.t -= dt;
    switch (this.state) {
      case 'celebrate': this.celebrate(dt); break;
      case 'settle':
        if (this.t <= 0) {
          for (const c of this.cats) { c.pose = 'lie'; c.sleeping = true; }
          this.set(this.forever ? 'sleep' : 'rest', rand(10, 25));
        }
        break;
      case 'rest': if (this.t <= 0) this.wake(); break;
      case 'getup': if (this.t <= 0) this.startChase(mood); break;
      case 'chase': this.chase(dt); break;
    }
  }

  settle(forever) {
    this.forever = forever;
    for (const c of this.cats) { c.pose = 'sit'; c.yOff = 0; c.sleeping = false; c.pounceT = 0; }
    this.set('settle', 1.2);
  }

  wake() {
    for (const c of this.cats) { c.pose = 'crouch'; c.sleeping = false; c.yOff = 0; }
    this.set('getup', 0.4);
  }

  startChase(mood) {
    this.set('chase', rand(15, 40) * (mood === 'break' ? 1.6 : 1));
    this.swapT = rand(3, 6);
    this.runner.dir = this.runner.x >= this.chaser.x ? 1 : -1;
    for (const c of this.cats) { c.pause = 0; c.pounceT = 0; }
  }

  swap(caught) {
    [this.runner, this.chaser] = [this.chaser, this.runner];
    this.runner.dir = this.runner.x >= this.chaser.x ? 1 : -1;
    this.chaser.pause = caught ? 0.6 : 0.25;
    this.swapT = rand(3, 6);
  }

  chase(dt) {
    const lo = 1, hi = SCENE_W - SPR_W - 1;
    const r = this.runner, ch = this.chaser;

    for (const c of this.cats) {
      if (c.pounceT > 0) {
        c.pounceT -= dt;
        const p = Math.min(1, 1 - c.pounceT / 0.35);
        c.yOff = -Math.round(Math.sin(Math.PI * p) * 4);
        c.pose = 'runA';
        c.x += c.dir * 40 * dt;
        if (c.pounceT <= 0) { c.yOff = 0; this.swap(true); }
        continue;
      }
      if (c.pause > 0) {
        c.pause -= dt;
        c.pose = 'sit';
        c.yOff = 0;
        continue;
      }
      if (c === ch) c.dir = r.x > ch.x ? 1 : -1;
      c.x += c.dir * (c === r ? 30 : 34) * dt;
      c.animT += dt;
      if (c.animT > 0.11) { c.animT = 0; c.frame ^= 1; }
      c.pose = c.frame ? 'runA' : 'runB';
      c.yOff = c.frame ? -1 : 0;
    }

    for (const c of this.cats) {
      if (c.x < lo) { c.x = lo; if (c === this.runner) c.dir = 1; }
      if (c.x > hi) { c.x = hi; if (c === this.runner) c.dir = -1; }
    }

    const busy = this.cats.some(c => c.pounceT > 0);
    if (!busy && ch.pause <= 0 && Math.abs(r.x - ch.x) < 7) ch.pounceT = 0.35;

    this.swapT -= dt;
    if (this.swapT <= 0 && !busy) this.swap(false);

    // Running past Grumpy sometimes wakes him up.
    for (const c of this.cats) {
      const near = c.x < this.grumpy.x + 14;
      if (near && !c.near && Math.random() < 0.3) this.grumpy.glareAt(c);
      c.near = near;
    }

    if (this.t <= 0 && !busy) this.settle(false);
  }

  celebrate(dt) {
    this.celebT += dt;
    this.cats.forEach((c, i) => {
      c.pose = 'sit';
      c.sleeping = false;
      c.pounceT = 0;
      c.dir = c.x < SCENE_W / 2 ? 1 : -1;
      c.yOff = this.celebT < 3 ? -Math.round(Math.abs(Math.sin(this.celebT * 7 + i * 1.5)) * 3) : 0;
    });
  }
}
