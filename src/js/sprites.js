// Pixel-art cats. Each pose is a 20x13 grid of "part" letters; every cat
// colours those parts its own way, and an outline is added automatically.
//
// Parts: b body, t tail, p paw/leg, c chest, h face, a head top, H forehead mark,
//        E pointed ear tip, F ear base, u upper eye / lid, e eye, k pupil,
//        n nose, m muzzle.
const SPR_W = 20, SPR_H = 13;

const HEAD = [
  'E......E',
  'EFaHHaFE',
  'aHaaaaHa',
  'huuhhuuh',
  'hekhhkeh',
  'hmmnnmmh',
  '.mmmmmm.',
];

function blankGrid() {
  return Array.from({ length: SPR_H }, () => Array(SPR_W).fill('.'));
}

function stamp(g, rows, x0, y0) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const ch = row[dx], x = x0 + dx, y = y0 + dy;
      if (ch !== '.' && y >= 0 && y < SPR_H && x >= 0 && x < SPR_W) g[y][x] = ch;
    }
  });
}

function dots(g, ch, list) {
  for (const [x, y] of list) if (y >= 0 && y < SPR_H) g[y][x] = ch;
}

function span(g, ch, y, x0, x1) {
  for (let x = x0; x <= x1; x++) g[y][x] = ch;
}

// Standing (drop = 0) or half-crouched (drop = 1), facing right.
function standPose(drop) {
  const g = blankGrid(), d = drop;
  dots(g, 't', [[2, 4 + d], [1, 4 + d], [0, 3 + d], [0, 2 + d], [1, 1 + d]]);
  span(g, 'b', 4 + d, 3, 13);
  for (let y = 5; y <= 8; y++) span(g, 'b', y + d, 2, 13);
  span(g, 'b', 9 + d, 3, 12);
  for (let y = 10 + d; y <= 12; y++) for (const x of [3, 4, 6, 7, 9, 10, 12, 13]) g[y][x] = 'p';
  dots(g, 'c', [[12, 7 + d], [13, 7 + d], [12, 8 + d], [13, 8 + d], [12, 9 + d]]);
  stamp(g, HEAD, 12, d);
  return g;
}

function runPose(stretched) {
  const g = blankGrid();
  dots(g, 't', stretched ? [[2, 4], [1, 3], [0, 3]] : [[2, 4], [1, 4], [0, 5]]);
  span(g, 'b', 4, 3, 13);
  for (let y = 5; y <= 8; y++) span(g, 'b', y, 2, 13);
  span(g, 'b', 9, 3, 12);
  dots(g, 'p', stretched
    ? [[2, 10], [3, 10], [1, 11], [2, 11], [0, 12], [1, 12],
       [12, 10], [13, 10], [13, 11], [14, 11], [14, 12], [15, 12]]
    : [[5, 10], [6, 10], [6, 11], [7, 11], [7, 12],
       [10, 10], [11, 10], [9, 11], [10, 11], [9, 12]]);
  dots(g, 'c', [[12, 7], [13, 7], [12, 8], [13, 8], [12, 9]]);
  stamp(g, HEAD, 12, 0);
  return g;
}

// Loaf. breathIn raises the back by a pixel.
function liePose(breathIn) {
  const g = blankGrid();
  if (breathIn) { span(g, 'b', 6, 6, 9); span(g, 'b', 7, 3, 11); }
  else span(g, 'b', 7, 4, 11);
  span(g, 'b', 8, 2, 12);
  span(g, 'b', 9, 1, 12);
  span(g, 'b', 10, 0, 12);
  span(g, 'b', 11, 0, 12);
  span(g, 't', 12, 1, 11);
  span(g, 'p', 11, 13, 16);
  span(g, 'p', 12, 12, 16);
  stamp(g, HEAD, 12, 4);
  return g;
}

// Sitting, looking at the viewer.
function sitPose() {
  const g = blankGrid();
  span(g, 'b', 7, 6, 13);
  span(g, 'b', 8, 5, 14);
  span(g, 'b', 9, 5, 14);
  for (let y = 10; y <= 12; y++) span(g, 'b', y, 4, 14);
  for (let y = 7; y <= 10; y++) span(g, 'c', y, 8, 11);
  for (let y = 11; y <= 12; y++) for (const x of [7, 8, 10, 11]) g[y][x] = 'p';
  dots(g, 't', [[3, 12], [2, 12], [1, 12], [0, 11]]);
  stamp(g, HEAD, 6, 0);
  return g;
}

const POSES = {
  stand: standPose(0),
  crouch: standPose(1),
  runA: runPose(true),
  runB: runPose(false),
  lie: liePose(false),
  lie2: liePose(true),
  sit: sitPose(),
};

function inBlob(x, y, cx, cy, r) { return (x - cx) ** 2 + (y - cy) ** 2 < r * r; }

// Per-cat colouring. Returns a colour or null (= leave transparent).
const CAT_LOOKS = {
  // Gray Scottish Fold silver tabby: folded ears, heavy grumpy lids.
  grumpy: {
    outline: '#2b2a30',
    color(ch, x, y, closed) {
      const fur = '#a9adb4', dark = '#5b5f67', light = '#d5d8dc', lid = '#7a7e86';
      switch (ch) {
        case 'b': return (x + (y >> 1)) % 4 === 0 ? dark : fur;
        case 't': return x % 2 === 0 ? dark : fur;
        case 'a': case 'F': case 'h': return fur;
        case 'H': return dark;
        case 'm': case 'c': return light;
        case 'p': return '#c4c7cc';
        case 'n': return '#d48a6a';
        case 'u': return closed ? fur : lid;
        case 'e': return closed ? lid : '#c8d24c';
        case 'k': return closed ? lid : '#2b2b2b';
        default: return null;            // folded ears: no tips
      }
    },
  },

  // Tuxedo: black, white chin/bib/socks, huge yellow eyes, folded ears.
  tux: {
    outline: '#0b0a0d',
    color(ch, x, y, closed) {
      const fur = '#25242b', white = '#f2f0ea';
      switch (ch) {
        case 'b': case 't': case 'a': case 'F': case 'H': case 'h': return fur;
        case 'm': case 'c': return white;
        case 'p': return y >= 12 ? white : fur;
        case 'n': return '#3b3539';
        case 'u': return closed ? fur : '#efc24a';
        case 'e': return closed ? '#4a4850' : '#efc24a';
        case 'k': return closed ? '#4a4850' : '#0d0c10';
        default: return null;
      }
    },
  },

  // Mostly white with a black cap and back patches, pointed ears.
  patches: {
    outline: '#2b2a30',
    color(ch, x, y, closed) {
      const white = '#f5f2eb', black = '#27262c';
      switch (ch) {
        case 'E': case 'F': case 'a': case 'H': case 't': return black;
        case 'b': return inBlob(x, y, 7, 6, 3.3) || inBlob(x, y, 4, 10, 2.2) ? black : white;
        case 'h': case 'm': case 'c': case 'p': return white;
        case 'n': return '#e89aa4';
        case 'u': return closed ? white : '#d9a23a';
        case 'e': return closed ? black : '#d9a23a';
        case 'k': return closed ? black : '#2a1d10';
        default: return null;
      }
    },
  },
};

const spriteCache = new Map();

function getSprite(kind, pose, closed) {
  const key = `${kind}|${pose}|${closed ? 1 : 0}`;
  let c = spriteCache.get(key);
  if (c) return c;

  const look = CAT_LOOKS[kind], grid = POSES[pose];
  const W = SPR_W + 2, H = SPR_H + 2;
  c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const filled = Array.from({ length: H }, () => Array(W).fill(false));

  for (let y = 0; y < SPR_H; y++) {
    for (let x = 0; x < SPR_W; x++) {
      const ch = grid[y][x];
      if (ch === '.') continue;
      const col = look.color(ch, x, y, closed);
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x + 1, y + 1, 1, 1);
      filled[y + 1][x + 1] = true;
    }
  }

  g.fillStyle = look.outline;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      const near = (filled[y - 1]?.[x]) || (filled[y + 1]?.[x]) || filled[y][x - 1] || filled[y][x + 1];
      if (near) g.fillRect(x, y, 1, 1);
    }
  }

  spriteCache.set(key, c);
  return c;
}

// cat: { kind, x, footY, dir, yOff, drawPose, eyesClosed }
function drawCat(ctx, cat) {
  const spr = getSprite(cat.kind, cat.drawPose, cat.eyesClosed);
  const sx = Math.round(cat.x) - 1;
  const sy = Math.round(cat.footY - SPR_H + cat.yOff) - 1;

  // Soft shadow, smaller while airborne.
  const lift = Math.min(3, -Math.round(cat.yOff));
  ctx.fillStyle = 'rgba(80, 40, 10, 0.18)';
  ctx.fillRect(Math.round(cat.x) + 2 + lift, cat.footY, 15 - lift * 2, 2);

  if (cat.dir < 0) {
    ctx.save();
    ctx.translate(sx + spr.width, sy);
    ctx.scale(-1, 1);
    ctx.drawImage(spr, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(spr, sx, sy);
  }
}
