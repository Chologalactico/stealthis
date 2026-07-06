/* ============================================================
   LIQUID GLASS BOTTOM SHEET — draggable detents with velocity
   Position = translateY(% of sheet height hidden below screen).
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DETENTS = [0.28, 0.58, 0.94]; // visible fraction of the sheet
const FLICK = 0.5; // px/ms release velocity that advances a detent

const sheet = document.getElementById("sheet");
const head = document.getElementById("sheetHead");
const body = document.getElementById("sheetBody");
const backdrop = document.getElementById("backdrop");

/* ---------- Demo data ---------- */
const PLACES = [
  ["☕", "#b45309", "Café Prisma", "Coffee · Opens 7:00", "120 m"],
  ["🥐", "#d97706", "Hornero Bakery", "Bakery · Busy now", "300 m"],
  ["📚", "#0369a1", "Marginalia Books", "Bookstore · Quiet", "450 m"],
  ["🌿", "#15803d", "Jardín Central", "Park · Open 24 h", "600 m"],
  ["🍜", "#be123c", "Ramen Cosmos", "Noodles · Closes 23:00", "750 m"],
  ["🎞", "#7c3aed", "Cine Aurora", "Cinema · 4 screenings", "900 m"],
  ["🏛", "#475569", "Museo del Vidrio", "Museum · Free Sunday", "1.1 km"],
  ["🧗", "#0e7490", "Bloque Climbing", "Gym · Until 22:00", "1.4 km"],
];

document.getElementById("places").innerHTML = PLACES.map(
  ([glyph, color, name, meta, dist]) => `
    <li class="place">
      <span class="place-icon" style="background:${color}" aria-hidden="true">${glyph}</span>
      <span class="place-meta"><strong>${name}</strong><span>${meta}</span></span>
      <span class="place-dist">${dist}</span>
    </li>`
).join("");

/* ---------- Position model ---------- */
let visible = 0; // current visible fraction (0 = fully hidden)
let open = false;

function apply(fraction, settle) {
  visible = Math.min(Math.max(fraction, 0), DETENTS[DETENTS.length - 1]);
  sheet.classList.toggle("settling", Boolean(settle) && !prefersReduced);
  sheet.style.transform = `translate(-50%, ${(1 - visible) * 100}%)`;
  backdrop.style.opacity = String((visible / DETENTS[DETENTS.length - 1]) * 0.85);
  body.classList.toggle("can-scroll", visible >= DETENTS[DETENTS.length - 1] - 0.01);
}

function openSheet() {
  open = true;
  sheet.hidden = false;
  backdrop.hidden = false;
  apply(0, false);
  requestAnimationFrame(() => requestAnimationFrame(() => apply(DETENTS[1], true)));
}

function closeSheet() {
  apply(0, true);
  open = false;
  setTimeout(() => {
    if (!open) {
      sheet.hidden = true;
      backdrop.hidden = true;
    }
  }, prefersReduced ? 0 : 450);
}

document.getElementById("openBtn").addEventListener("click", openSheet);
document.getElementById("closeBtn").addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && open) closeSheet();
});

/* ---------- Drag with velocity snapping ---------- */
let dragStartY = null;
let dragStartVisible = 0;
let lastY = 0;
let lastT = 0;
let velocity = 0;

head.addEventListener("pointerdown", (e) => {
  dragStartY = e.clientY;
  dragStartVisible = visible;
  lastY = e.clientY;
  lastT = performance.now();
  velocity = 0;
  head.setPointerCapture(e.pointerId);
});

head.addEventListener("pointermove", (e) => {
  if (dragStartY === null || !head.hasPointerCapture(e.pointerId)) return;
  const now = performance.now();
  const dt = now - lastT;
  if (dt > 0) velocity = (e.clientY - lastY) / dt; // px/ms, + is downward
  lastY = e.clientY;
  lastT = now;

  const delta = (dragStartY - e.clientY) / sheet.offsetHeight;
  apply(dragStartVisible + delta, false);
});

function endDrag() {
  if (dragStartY === null) return;
  dragStartY = null;

  let target;
  if (Math.abs(velocity) > FLICK) {
    // flick: advance one detent in the flick direction (down may close)
    const dir = velocity > 0 ? -1 : 1;
    const currentIdx = nearestIndex(visible);
    const nextIdx = currentIdx + dir;
    if (nextIdx < 0) return closeSheet();
    target = DETENTS[Math.min(nextIdx, DETENTS.length - 1)];
  } else {
    // slow release: settle to nearest stop, or close below the peek zone
    if (visible < DETENTS[0] * 0.6) return closeSheet();
    target = DETENTS[nearestIndex(visible)];
  }
  apply(target, true);
}

head.addEventListener("pointerup", endDrag);
head.addEventListener("pointercancel", endDrag);

function nearestIndex(fraction) {
  let best = 0;
  DETENTS.forEach((d, i) => {
    if (Math.abs(d - fraction) < Math.abs(DETENTS[best] - fraction)) best = i;
  });
  return best;
}
