/* ============================================================
   P5.JS FLOW FIELD PAINTER — generative particle filaments
   Each particle samples 3D Perlin noise for its heading and
   drags a low-alpha stroke; trails accumulate into silk.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PALETTES = [
  { name: "Ember", bg: "#0d0705", colors: ["#ff6b35", "#f7c59f", "#ffd166", "#ff2e63"] },
  { name: "Reef", bg: "#03110f", colors: ["#00f5d4", "#00bbf9", "#9b5de5", "#b8f7ee"] },
  { name: "Ivory", bg: "#f4efe8", colors: ["#1d3557", "#e63946", "#457b9d", "#2a9d8f"] },
  { name: "Neon", bg: "#05010d", colors: ["#f72585", "#7209b7", "#4cc9f0", "#4361ee"] },
];

const NOISE_SCALE = 0.0016;
const SPEED = 1.7;
const TRAIL_ALPHA = 12;
const STROKE_ALPHA = 26;

let palIndex = 0;
let particles = [];
let zoff = 0;
let seedCount = 1;

const seedNoEl = document.getElementById("seedNo");
const palNameEl = document.getElementById("palName");

function particleCount() {
  return Math.min(1300, Math.floor((width * height) / 1700));
}

function spawn() {
  const p = { x: random(width), y: random(height) };
  p.px = p.x;
  p.py = p.y;
  return p;
}

function resetField(newSeed) {
  if (newSeed) {
    noiseSeed(floor(random(1e9)));
    seedCount++;
    seedNoEl.textContent = String(seedCount).padStart(3, "0");
  }
  particles = Array.from({ length: particleCount() }, spawn);
  zoff = 0;
  background(PALETTES[palIndex].bg);
  document.body.style.background = PALETTES[palIndex].bg;
  palNameEl.textContent = PALETTES[palIndex].name;
}

function stepParticles() {
  const pal = PALETTES[palIndex];
  for (const p of particles) {
    const n = noise(p.x * NOISE_SCALE, p.y * NOISE_SCALE, zoff);
    const a = n * TWO_PI * 2.4;
    p.px = p.x;
    p.py = p.y;
    p.x += cos(a) * SPEED;
    p.y += sin(a) * SPEED;

    // wrap without drawing a streak across the canvas
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p.x = random(width);
      p.y = random(height);
      p.px = p.x;
      p.py = p.y;
      continue;
    }

    const c = color(pal.colors[floor(n * pal.colors.length * 3) % pal.colors.length]);
    c.setAlpha(STROKE_ALPHA);
    stroke(c);
    line(p.px, p.py, p.x, p.y);
  }
  zoff += 0.0018;
}

/* ---------- p5 lifecycle (global mode) ---------- */
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("sketch");
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  strokeWeight(1.1);
  resetField(false);

  if (prefersReduced) {
    // present a finished still artwork instead of an animation
    for (let i = 0; i < 300; i++) stepParticles();
    noLoop();
  }
}

function draw() {
  const wash = color(PALETTES[palIndex].bg);
  wash.setAlpha(TRAIL_ALPHA);
  noStroke();
  fill(wash);
  rect(0, 0, width, height);
  stepParticles();
}

function mousePressed(e) {
  // only the canvas regenerates; ignore HUD button clicks
  if (e && e.target && e.target.tagName !== "CANVAS") return;
  resetField(true);
  if (prefersReduced) {
    for (let i = 0; i < 300; i++) stepParticles();
    redraw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetField(false);
  if (prefersReduced) {
    for (let i = 0; i < 300; i++) stepParticles();
    redraw();
  }
}

/* ---------- HUD controls ---------- */
document.getElementById("seedBtn").addEventListener("click", () => {
  resetField(true);
  if (prefersReduced) {
    for (let i = 0; i < 300; i++) stepParticles();
    redraw();
  }
});

document.getElementById("paletteBtn").addEventListener("click", () => {
  palIndex = (palIndex + 1) % PALETTES.length;
  resetField(false);
  if (prefersReduced) {
    for (let i = 0; i < 300; i++) stepParticles();
    redraw();
  }
});
