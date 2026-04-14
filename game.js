// Minecraft PacMan - Steve vs Zombies
(() => {
const CELL = 40;
const COLS = 13;
const ROWS = 15;

// Compact PacMan-style maze. Legend:
// # wall, . carrot, o golden apple, space empty, P Steve spawn, Z zombie spawn
const RAW_MAP = [
  "#############",
  "#o....#....o#",
  "#.###.#.###.#",
  "#...........#",
  "#.#.#####.#.#",
  "#.#...Z...#.#",
  "#.#.#ZZZ#.#.#",
  "  ..#ZZZ#..  ",
  "#.#.#####.#.#",
  "#.#.......#.#",
  "#.#.#####.#.#",
  "#.....P.....#",
  "#o###.#.###o#",
  "#...........#",
  "#############",
];

// Parse map
const map = [];      // 2D grid of tile types
let steveSpawn = {x: 14, y: 23};
const zombieSpawns = [];
let totalCarrots = 0;

for (let y = 0; y < ROWS; y++) {
  const row = [];
  const line = RAW_MAP[y] || "";
  for (let x = 0; x < COLS; x++) {
    const ch = line[x] || " ";
    if (ch === "#") row.push("wall");
    else if (ch === ".") { row.push("carrot"); totalCarrots++; }
    else if (ch === "o") { row.push("apple"); totalCarrots++; }
    else if (ch === "P") { row.push("empty"); steveSpawn = {x, y}; }
    else if (ch === "Z") { row.push("empty"); zombieSpawns.push({x, y}); }
    else if (ch === "-") row.push("door");
    else row.push("empty");
  }
  map.push(row);
}

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
ctx.imageSmoothingEnabled = false;

// Assets
const assets = {};
const ASSET_NAMES = ["steve","zombie","zombie_scared","wall","carrot","golden_apple","diamond","heart"];
let assetsLoaded = 0;
function loadAssets(cb) {
  ASSET_NAMES.forEach(name => {
    const img = new Image();
    img.onload = () => { assetsLoaded++; if (assetsLoaded === ASSET_NAMES.length) cb(); };
    img.src = `assets/${name}.png`;
    assets[name] = img;
  });
}

// Game state
const DIRS = {
  up:    {x: 0, y: -1},
  down:  {x: 0, y: 1},
  left:  {x: -1, y: 0},
  right: {x: 1, y: 0},
  none:  {x: 0, y: 0},
};

let steve, zombies, score, lives, level, powerMode, powerTimer, gameRunning, carrotsLeft, bonus;

function resetLevel(keepScore) {
  // rebuild carrots
  totalCarrots = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = (RAW_MAP[y] || "")[x] || " ";
      if (ch === ".") { map[y][x] = "carrot"; totalCarrots++; }
      else if (ch === "o") { map[y][x] = "apple"; totalCarrots++; }
    }
  }
  carrotsLeft = totalCarrots;
  steve = {
    x: steveSpawn.x, y: steveSpawn.y,
    px: steveSpawn.x * CELL, py: steveSpawn.y * CELL,
    dir: "none", nextDir: "none",
    speed: 2,
  };
  zombies = zombieSpawns.slice(0, 4).map((sp, i) => ({
    x: sp.x, y: sp.y,
    px: sp.x * CELL, py: sp.y * CELL,
    dir: ["up","left","right","down"][i % 4],
    speed: 1.7,
    personality: i,
    scared: false,
    dead: false,
    releaseAt: i * 180, // frames until release
  }));
  powerMode = false;
  powerTimer = 0;
  bonus = null;
  if (!keepScore) { score = 0; lives = 3; level = 1; }
}

function isWalkable(x, y, isZombie) {
  if (y < 0 || y >= ROWS) return true; // tunnel rows
  if (x < 0 || x >= COLS) return true;
  const t = map[y][x];
  if (t === "wall") return false;
  if (t === "door") return isZombie;
  return true;
}

function atCellCenter(entity) {
  return entity.px === entity.x * CELL && entity.py === entity.y * CELL;
}

function tryMove(entity, dir, isZombie) {
  const d = DIRS[dir];
  const nx = entity.x + d.x;
  const ny = entity.y + d.y;
  return isWalkable(nx, ny, isZombie);
}

function moveEntity(entity, isZombie) {
  if (atCellCenter(entity)) {
    // wrap tunnels
    if (entity.x < 0) { entity.x = COLS - 1; entity.px = entity.x * CELL; }
    if (entity.x >= COLS) { entity.x = 0; entity.px = 0; }
    // try nextDir
    if (!isZombie && entity.nextDir !== "none" && tryMove(entity, entity.nextDir, false)) {
      entity.dir = entity.nextDir;
      entity.nextDir = "none";
    }
    if (!tryMove(entity, entity.dir, isZombie)) {
      if (!isZombie) entity.dir = "none";
      return;
    }
  }
  const d = DIRS[entity.dir];
  entity.px += d.x * entity.speed;
  entity.py += d.y * entity.speed;
  // snap
  if (d.x !== 0) {
    if (Math.abs(entity.px - entity.x * CELL) >= CELL) {
      entity.x += d.x;
      entity.px = entity.x * CELL;
    }
  }
  if (d.y !== 0) {
    if (Math.abs(entity.py - entity.y * CELL) >= CELL) {
      entity.y += d.y;
      entity.py = entity.y * CELL;
    }
  }
}

// Zombie AI: at every intersection, pick direction (no reverse) that
// minimizes (or maximizes when scared) distance to Steve, with some personality.
function zombieChoose(z) {
  const opposite = {up:"down",down:"up",left:"right",right:"left",none:"none"};
  const options = [];
  for (const dir of ["up","down","left","right"]) {
    if (dir === opposite[z.dir]) continue;
    if (tryMove(z, dir, true)) options.push(dir);
  }
  if (options.length === 0) {
    // forced reverse
    if (tryMove(z, opposite[z.dir], true)) { z.dir = opposite[z.dir]; }
    return;
  }
  let target = {x: steve.x, y: steve.y};
  // personality tweaks
  if (z.personality === 1) {
    const sd = DIRS[steve.dir];
    target = {x: steve.x + sd.x * 4, y: steve.y + sd.y * 4};
  } else if (z.personality === 2) {
    target = {x: steve.x - 3, y: steve.y - 3};
  } else if (z.personality === 3 && Math.random() < 0.3) {
    target = {x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS)};
  }
  let best = options[0], bestD = Infinity;
  for (const dir of options) {
    const d = DIRS[dir];
    const nx = z.x + d.x, ny = z.y + d.y;
    let dist = Math.hypot(nx - target.x, ny - target.y);
    if (z.scared) dist = -dist;
    if (dist < bestD) { bestD = dist; best = dir; }
  }
  z.dir = best;
}

function updateZombies() {
  for (const z of zombies) {
    if (z.dead) {
      // respawn at center
      z.x = 6; z.y = 7; z.px = z.x*CELL; z.py = z.y*CELL;
      z.dead = false; z.scared = false;
      z.dir = "up"; z.releaseAt = 60;
      continue;
    }
    if (z.releaseAt > 0) { z.releaseAt--; continue; }
    if (atCellCenter(z)) zombieChoose(z);
    const effectiveSpeed = z.scared ? 1.0 : (1.5 + level * 0.1);
    const savedSpeed = z.speed;
    z.speed = Math.min(effectiveSpeed, 2);
    moveEntity(z, true);
    z.speed = savedSpeed;
  }
}

function checkPickups() {
  const t = map[steve.y][steve.x];
  if (t === "carrot") {
    map[steve.y][steve.x] = "empty";
    score += 10;
    carrotsLeft--;
    playSound("eat");
  } else if (t === "apple") {
    map[steve.y][steve.x] = "empty";
    score += 50;
    carrotsLeft--;
    powerMode = true;
    powerTimer = 60 * 8; // 8 seconds
    zombies.forEach(z => { z.scared = true; });
    playSound("power");
  }
  if (bonus && bonus.x === steve.x && bonus.y === steve.y) {
    score += 200;
    bonus = null;
    playSound("bonus");
  }
}

function checkCollisions() {
  for (const z of zombies) {
    if (z.dead || z.releaseAt > 0) continue;
    const dx = Math.abs(z.px - steve.px);
    const dy = Math.abs(z.py - steve.py);
    if (dx < CELL * 0.7 && dy < CELL * 0.7) {
      if (z.scared) {
        z.dead = true;
        score += 200;
        playSound("zombie_die");
      } else {
        loseLife();
        return;
      }
    }
  }
}

function loseLife() {
  lives--;
  playSound("death");
  if (lives <= 0) {
    gameOver(false);
  } else {
    // respawn
    steve.x = steveSpawn.x; steve.y = steveSpawn.y;
    steve.px = steve.x * CELL; steve.py = steve.y * CELL;
    steve.dir = "none"; steve.nextDir = "none";
    zombies.forEach((z, i) => {
      const sp = zombieSpawns[i % zombieSpawns.length];
      z.x = sp.x; z.y = sp.y; z.px = z.x*CELL; z.py = z.y*CELL;
      z.releaseAt = i * 120;
      z.scared = false; z.dead = false;
    });
    powerMode = false;
  }
}

function gameOver(won) {
  gameRunning = false;
  document.getElementById("overlay-text").textContent = won ? "YOU WIN!" : "GAME OVER";
  document.getElementById("overlay").classList.remove("hidden");
}

// Drawing
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[y][x];
      const px = x * CELL, py = y * CELL;
      if (t === "wall") {
        ctx.drawImage(assets.wall, px, py, CELL, CELL);
      } else if (t === "door") {
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(px, py + CELL/2 - 2, CELL, 4);
      } else if (t === "carrot") {
        ctx.drawImage(assets.carrot, px, py, CELL, CELL);
      } else if (t === "apple") {
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 200);
        const s = CELL * pulse;
        ctx.drawImage(assets.golden_apple, px + (CELL-s)/2, py + (CELL-s)/2, s, s);
      }
    }
  }
  if (bonus) {
    ctx.drawImage(assets.diamond, bonus.x * CELL, bonus.y * CELL, CELL, CELL);
  }
  // Steve
  ctx.drawImage(assets.steve, steve.px, steve.py, CELL, CELL);
  drawSteveEyes();
  // Zombies
  for (const z of zombies) {
    if (z.dead) continue;
    const flash = powerMode && powerTimer < 120 && Math.floor(powerTimer / 10) % 2 === 0;
    const img = z.scared ? (flash ? assets.zombie : assets.zombie_scared) : assets.zombie;
    ctx.drawImage(img, z.px, z.py, CELL, CELL);
  }
}

// Draw Steve's eyes on top of sprite, pupils oscillate left<->right over time
function drawSteveEyes() {
  const s = CELL / 16;
  const eyes = [ {x: 4, y: 6}, {x: 8, y: 6} ];
  ctx.fillStyle = "#ffffff";
  for (const e of eyes) {
    ctx.fillRect(steve.px + e.x * s, steve.py + e.y * s, 2 * s, 2 * s);
  }
  // oscillate 0 or 1 every ~500ms
  const ox = Math.floor(Date.now() / 500) % 2 === 0 ? 0 : 1;
  ctx.fillStyle = "#1a3ea8";
  for (const e of eyes) {
    ctx.fillRect(steve.px + (e.x + ox) * s, steve.py + e.y * s, s, s);
  }
}

function updateHUD() {
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  const lc = document.getElementById("lives");
  lc.innerHTML = "";
  for (let i = 0; i < lives; i++) {
    const img = document.createElement("img");
    img.src = "assets/heart.png";
    lc.appendChild(img);
  }
}

// Sounds — procedural Web Audio (Minecraft-ish)
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(type) {
  if (!audioCtx) return;
  const ctxA = audioCtx;
  const now = ctxA.currentTime;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.connect(gain);
  gain.connect(ctxA.destination);
  if (type === "eat") {
    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now); osc.stop(now + 0.09);
  } else if (type === "power") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === "death") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.start(now); osc.stop(now + 1);
  } else if (type === "zombie_die") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now); osc.stop(now + 0.4);
  } else if (type === "bonus") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now); osc.stop(now + 0.25);
  } else if (type === "zombie_groan") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.6);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.start(now); osc.stop(now + 0.8);
  }
}

// Periodic zombie groan ambience
let groanTimer = 0;
function ambientSounds() {
  groanTimer++;
  if (groanTimer > 300 + Math.random() * 300) {
    playSound("zombie_groan");
    groanTimer = 0;
  }
}

// Main loop — fixed timestep driven by performance.now() (consistent across browsers)
const STEP_MS = 1000 / 60;
const MAX_CATCHUP_STEPS = 5;
let lastTime = 0;
let accumulator = 0;
function step() {
  if (!gameRunning) return;
  moveEntity(steve, false);
  checkPickups();
  updateZombies();
  checkCollisions();
  if (powerMode) {
    powerTimer--;
    if (powerTimer <= 0) {
      powerMode = false;
      zombies.forEach(z => z.scared = false);
    }
  }
  if (carrotsLeft <= 0) {
    level++;
    resetLevel(true);
  }
  ambientSounds();
  updateHUD();
}
function loop() {
  const now = performance.now();
  if (lastTime === 0) lastTime = now;
  let delta = now - lastTime;
  lastTime = now;
  if (delta > 250) delta = 250;
  accumulator += delta;
  let steps = 0;
  while (accumulator >= STEP_MS && steps < MAX_CATCHUP_STEPS) {
    step();
    accumulator -= STEP_MS;
    steps++;
  }
  if (accumulator > STEP_MS * MAX_CATCHUP_STEPS) accumulator = 0;
  draw();
  requestAnimationFrame(loop);
}

// Input
function setDir(dir) {
  if (!gameRunning) return;
  initAudio();
  if (tryMove(steve, dir, false) && atCellCenter(steve)) {
    steve.dir = dir;
  } else {
    steve.nextDir = dir;
  }
}

document.addEventListener("keydown", e => {
  const map = {
    ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right",
    w:"up", s:"down", a:"left", d:"right",
    W:"up", S:"down", A:"left", D:"right",
  };
  if (map[e.key]) { setDir(map[e.key]); e.preventDefault(); }
});

document.querySelectorAll(".dp-btn").forEach(btn => {
  const dir = btn.dataset.dir;
  const fire = e => {
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    if (!gameRunning && !document.getElementById("start-screen").classList.contains("hidden")) return;
    setDir(dir);
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 120);
  };
  btn.addEventListener("pointerdown", fire);
  btn.addEventListener("touchstart", fire, {passive: false});
  btn.addEventListener("click", fire);
});

// Swipe
let touchStart = null;
canvas.addEventListener("touchstart", e => {
  touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
}, {passive: true});
canvas.addEventListener("touchend", e => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
  else setDir(dy > 0 ? "down" : "up");
  touchStart = null;
}, {passive: true});

document.getElementById("start-btn").addEventListener("click", () => {
  initAudio();
  document.getElementById("start-screen").classList.add("hidden");
  gameRunning = true;
});
document.getElementById("restart-btn").addEventListener("click", () => {
  initAudio();
  document.getElementById("overlay").classList.add("hidden");
  resetLevel(false);
  gameRunning = true;
});

// Boot
resetLevel(false);
updateHUD();
gameRunning = false;
loadAssets(() => { loop(); });
})();
