/* ============================================================
   LIQUID GLASS VOLUME HUD — transient overlay with two clocks
   expanded (adjusting) → slim (1s idle) → hidden (2.2s idle)
   ============================================================ */

const STEP = 6; // volume ticks, like the hardware buttons
const SLIM_MS = 1000;
const HIDE_MS = 2200;

const hud = document.getElementById("hud");
const fill = document.getElementById("hudFill");
const icon = document.getElementById("hudIcon");
const modeName = document.getElementById("modeName");

const levels = { volume: 50, brightness: 72 };
let mode = "volume";

let slimTimer = null;
let hideTimer = null;

/* ---------- Lifecycle ---------- */
function poke() {
  hud.dataset.state = "expanded";
  clearTimeout(slimTimer);
  clearTimeout(hideTimer);
  slimTimer = setTimeout(() => (hud.dataset.state = "slim"), SLIM_MS);
  hideTimer = setTimeout(() => (hud.dataset.state = "hidden"), HIDE_MS);
}

/* ---------- Rendering ---------- */
function iconFor() {
  const level = levels[mode];
  if (mode === "brightness") return level < 40 ? "🔅" : "🔆";
  if (level === 0) return "🔇";
  if (level < 34) return "🔈";
  if (level < 67) return "🔉";
  return "🔊";
}

function render() {
  fill.style.height = `${levels[mode]}%`;
  icon.textContent = iconFor();
  hud.setAttribute("aria-label", `${mode} ${levels[mode]}%`);
}

/* ---------- Adjustment ---------- */
function adjust(direction) {
  levels[mode] = Math.min(Math.max(levels[mode] + direction * STEP, 0), 100);
  render();
  poke();

  hud.classList.remove("nudge-up", "nudge-down");
  void hud.offsetWidth;
  hud.classList.add(direction > 0 ? "nudge-up" : "nudge-down");
  setTimeout(() => hud.classList.remove("nudge-up", "nudge-down"), 200);
}

/* ---------- Mode switching ---------- */
function setMode(next) {
  mode = next;
  modeName.textContent = mode === "volume" ? "Volume" : "Brightness";
  render();
  poke();
}

document.getElementById("modeToggle").addEventListener("click", () => {
  setMode(mode === "volume" ? "brightness" : "volume");
});

/* ---------- Rocker with hold-to-repeat ---------- */
function wireRocker(btn, direction) {
  let holdTimer = null;
  let repeatTimer = null;

  btn.addEventListener("pointerdown", () => {
    adjust(direction);
    holdTimer = setTimeout(() => {
      repeatTimer = setInterval(() => adjust(direction), 120);
    }, 420);
  });

  const stop = () => {
    clearTimeout(holdTimer);
    clearInterval(repeatTimer);
  };
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
  btn.addEventListener("pointercancel", stop);
}

wireRocker(document.getElementById("rockUp"), 1);
wireRocker(document.getElementById("rockDown"), -1);

/* ---------- Keyboard ---------- */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    adjust(1);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    adjust(-1);
  } else if (e.key.toLowerCase() === "b") {
    setMode(mode === "volume" ? "brightness" : "volume");
  }
});

render();
