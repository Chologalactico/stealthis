/* ============================================================
   LIQUID GLASS WIDGET STACK — vertical swipe + smart auto-rotate
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AUTO_MS = 5000;

const scene = document.getElementById("scene");
const widget = document.getElementById("widget");
const faces = Array.from(document.querySelectorAll(".face"));
const dotsHost = document.getElementById("dots");

let index = 0;
let autoTimer = null;

/* ---------- Dots ---------- */
const dots = faces.map((face, i) => {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.type = "button";
  dot.setAttribute("role", "tab");
  dot.setAttribute("aria-label", face.getAttribute("aria-label"));
  dot.addEventListener("click", () => {
    show(i);
    pauseAuto();
  });
  dotsHost.appendChild(dot);
  return dot;
});

/* ---------- Rendering ---------- */
function show(next) {
  index = (next + faces.length) % faces.length;
  faces.forEach((face, i) => {
    face.classList.toggle("is-active", i === index);
    // faces "before" the active one wait above, the rest below
    face.classList.toggle("is-above", i === (index + faces.length - 1) % faces.length);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === index);
    dot.setAttribute("aria-selected", String(i === index));
  });
  scene.style.setProperty("--hue", faces[index].dataset.hue);
}

/* ---------- Auto-rotate (paused by interaction/hover) ---------- */
function startAuto() {
  if (prefersReduced) return;
  clearInterval(autoTimer);
  autoTimer = setInterval(() => show(index + 1), AUTO_MS);
}

function pauseAuto() {
  clearInterval(autoTimer);
  autoTimer = null;
}

widget.addEventListener("pointerenter", pauseAuto);
widget.addEventListener("pointerleave", startAuto);

/* ---------- Vertical swipe ---------- */
let startY = null;

widget.addEventListener("pointerdown", (e) => {
  startY = e.clientY;
  widget.setPointerCapture(e.pointerId);
  pauseAuto();
});

widget.addEventListener("pointerup", (e) => {
  if (startY === null) return;
  const dy = e.clientY - startY;
  startY = null;
  if (Math.abs(dy) > 32) {
    show(index + (dy < 0 ? 1 : -1)); // swipe up → next
  }
});

widget.addEventListener("pointercancel", () => {
  startY = null;
});

/* keyboard: up/down flip the stack when the widget has focus */
widget.setAttribute("tabindex", "0");
widget.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    show(index - 1);
    pauseAuto();
  } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    show(index + 1);
    pauseAuto();
  }
});

/* ---------- Boot ---------- */
show(0);
startAuto();
