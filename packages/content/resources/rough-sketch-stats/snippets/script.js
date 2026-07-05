/* ============================================================
   ROUGH.JS SKETCH STATS — hand-drawn charts on paper
   Every redraw re-randomizes the wobble; hover to re-sketch.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INK = "#2b2622";
const PAPER = "#f6f1e7";
const COLORS = { red: "#d1495b", blue: "#30638e", yellow: "#edae49", teal: "#00798c" };

const BASE_DATA = {
  bars: [12, 22, 9, 30, 18, 26, 14],
  barLabels: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  line: [3, 5, 4, 7, 6, 9, 7.5],
  pie: [
    { label: "making", value: 45, color: COLORS.teal },
    { label: "meetings", value: 25, color: COLORS.red },
    { label: "wandering", value: 30, color: COLORS.yellow },
  ],
};

function jitter(v) {
  return v * (0.9 + Math.random() * 0.2);
}

/* size the backing store for the device and return draw context */
function prepare(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  // rough uses the same 2d context, so the dpr scale applies to it too
  const rc = rough.canvas(canvas);
  return { rc, ctx, w, h };
}

function handFont(ctx, size) {
  ctx.font = `500 ${size}px Caveat, cursive`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
}

/* ---------- Bars ---------- */
function drawBars(canvas) {
  const { rc, ctx, w, h } = prepare(canvas);
  const values = BASE_DATA.bars.map(jitter);
  const max = Math.max(...values);
  const pad = 26;
  const baseline = h - 26;
  const bw = (w - pad * 2) / values.length;
  const palette = [COLORS.red, COLORS.blue, COLORS.yellow, COLORS.teal];

  rc.line(pad - 8, baseline, w - pad + 8, baseline, { roughness: 1.6, stroke: INK, strokeWidth: 1.5 });

  values.forEach((v, i) => {
    const bh = ((h - 58) * v) / max;
    const x = pad + i * bw + bw * 0.18;
    rc.rectangle(x, baseline - bh, bw * 0.64, bh, {
      roughness: 1.8,
      stroke: INK,
      strokeWidth: 1.6,
      fill: palette[i % palette.length],
      fillStyle: "hachure",
      hachureAngle: 40 + Math.random() * 80,
      hachureGap: 5,
    });
    handFont(ctx, 16);
    ctx.fillText(BASE_DATA.barLabels[i], x + bw * 0.32, h - 8);
  });
}

/* ---------- Line ---------- */
function drawLine(canvas) {
  const { rc, ctx, w, h } = prepare(canvas);
  const values = BASE_DATA.line.map(jitter);
  const max = 10;
  const pad = 28;
  const step = (w - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => [pad + i * step, h - 30 - ((h - 64) * v) / max]);

  rc.line(pad - 8, h - 30, w - pad + 8, h - 30, { roughness: 1.6, stroke: INK, strokeWidth: 1.5 });
  rc.curve(points, { roughness: 1.4, stroke: COLORS.blue, strokeWidth: 2.6 });

  points.forEach(([x, y], i) => {
    rc.circle(x, y, 9, {
      roughness: 1.4,
      stroke: INK,
      strokeWidth: 1.4,
      fill: i === points.length - 2 ? COLORS.red : PAPER,
      fillStyle: "solid",
    });
  });

  handFont(ctx, 16);
  ctx.fillText("deep work, self-reported", w / 2, 18);
}

/* ---------- Pie (donut via paper hole) ---------- */
function drawPie(canvas) {
  const { rc, ctx, w, h } = prepare(canvas);
  const cx = w / 2;
  const cy = h / 2 + 6;
  const d = Math.min(w, h) - 58;
  const total = BASE_DATA.pie.reduce((sum, s) => sum + s.value, 0);

  let angle = -Math.PI / 2;
  for (const slice of BASE_DATA.pie) {
    const sweep = (slice.value / total) * Math.PI * 2;
    rc.arc(cx, cy, d, d, angle, angle + sweep, true, {
      roughness: 1.6,
      stroke: INK,
      strokeWidth: 1.6,
      fill: slice.color,
      fillStyle: "hachure",
      hachureAngle: 20 + Math.random() * 120,
      hachureGap: 5,
    });
    angle += sweep;
  }

  // paper-colored hole fakes the donut
  rc.circle(cx, cy, d * 0.42, { roughness: 1.4, stroke: INK, strokeWidth: 1.4, fill: PAPER, fillStyle: "solid" });

  handFont(ctx, 15);
  let ly = 20;
  ctx.textAlign = "left";
  for (const slice of BASE_DATA.pie) {
    ctx.fillStyle = slice.color;
    ctx.fillRect(8, ly - 9, 10, 10);
    ctx.fillStyle = INK;
    ctx.fillText(`${slice.label} ${slice.value}%`, 24, ly);
    ly += 20;
  }
}

/* ---------- Wiring ---------- */
const DRAWERS = { bars: drawBars, line: drawLine, pie: drawPie };
const cards = Array.from(document.querySelectorAll(".chart-card"));

function drawAll() {
  for (const card of cards) {
    DRAWERS[card.dataset.chart](card.querySelector("canvas"));
  }
}

for (const card of cards) {
  if (!prefersReduced) {
    card.addEventListener("mouseenter", () => DRAWERS[card.dataset.chart](card.querySelector("canvas")));
  }
}

document.getElementById("redrawBtn").addEventListener("click", drawAll);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawAll, 160);
});

/* wait for the handwriting font so canvas labels match the page */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(drawAll);
} else {
  drawAll();
}
