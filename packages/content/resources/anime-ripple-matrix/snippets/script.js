/* ============================================================
   ANIME.JS RIPPLE MATRIX — grid staggering from any origin
   One tween declaration; per-dot delays come from grid distance.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COLS = 22;
const ROWS = 14;

const matrix = document.getElementById("matrix");
matrix.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

const dots = [];
for (let i = 0; i < COLS * ROWS; i++) {
  const dot = document.createElement("div");
  dot.className = "dot";
  dot.dataset.index = i;
  matrix.appendChild(dot);
  dots.push(dot);
}

const BASE = "#2a2f45";
const ACCENT = "#66e0ff";
const HOT = "#ff7ad9";

/* ---------- Bursts ---------- */
function ripple(fromIndex) {
  if (prefersReduced) {
    flash(fromIndex);
    return;
  }
  anime.remove(dots);
  anime({
    targets: dots,
    scale: [
      { value: 2.1, easing: "easeOutSine", duration: 210 },
      { value: 1, easing: "easeInOutQuad", duration: 620 },
    ],
    backgroundColor: [
      { value: ACCENT, easing: "easeOutSine", duration: 210 },
      { value: BASE, easing: "easeInOutQuad", duration: 620 },
    ],
    delay: anime.stagger(36, { grid: [COLS, ROWS], from: fromIndex }),
  });
}

function wave() {
  if (prefersReduced) {
    flash(Math.floor(dots.length / 2));
    return;
  }
  anime.remove(dots);
  anime({
    targets: dots,
    translateY: [
      { value: -16, easing: "easeOutSine", duration: 240 },
      { value: 0, easing: "easeOutBounce", duration: 540 },
    ],
    backgroundColor: [
      { value: HOT, easing: "easeOutSine", duration: 240 },
      { value: BASE, easing: "easeInOutQuad", duration: 540 },
    ],
    delay: anime.stagger(22, { grid: [COLS, ROWS], from: "first", axis: "x" }),
  });
}

/* reduced-motion fallback: instant color flash, no movement */
function flash(fromIndex) {
  const cx = fromIndex % COLS;
  const cy = Math.floor(fromIndex / COLS);
  dots.forEach((dot, i) => {
    const dx = (i % COLS) - cx;
    const dy = Math.floor(i / COLS) - cy;
    if (Math.hypot(dx, dy) < 4) dot.classList.add("flash");
  });
  setTimeout(() => dots.forEach((d) => d.classList.remove("flash")), 500);
}

/* ---------- Input ---------- */
let lastInteraction = 0;

matrix.addEventListener("click", (e) => {
  lastInteraction = Date.now();
  let index;
  if (e.target.classList.contains("dot")) {
    index = Number(e.target.dataset.index);
  } else {
    // clicked in a gap: derive the nearest cell from coordinates
    const rect = matrix.getBoundingClientRect();
    const col = Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * COLS)));
    const row = Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)));
    index = row * COLS + col;
  }
  ripple(index);
});

document.getElementById("pulseBtn").addEventListener("click", () => {
  lastInteraction = Date.now();
  ripple(Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2));
});

document.getElementById("waveBtn").addEventListener("click", () => {
  lastInteraction = Date.now();
  wave();
});

/* ---------- Idle autopilot ---------- */
if (!prefersReduced) {
  setInterval(() => {
    if (document.hidden) return;
    if (Date.now() - lastInteraction < 5000) return;
    ripple(Math.floor(Math.random() * dots.length));
  }, 4200);

  // greeting pulse
  setTimeout(() => ripple(Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2)), 500);
}
