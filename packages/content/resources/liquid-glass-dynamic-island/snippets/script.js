/* ============================================================
   LIQUID GLASS DYNAMIC ISLAND — a state machine wearing a spring
   States: idle · music-chip · music-full · timer
   ============================================================ */

const island = document.getElementById("island");
const timerValue = document.getElementById("timerValue");
const ringFg = document.getElementById("ringFg");
const mfPlay = document.getElementById("mfPlay");

const RING_LENGTH = 75.4; // 2πr, r=12
const TIMER_SECONDS = 60;

let state = "idle";
let musicPlaying = false;
let timerRemaining = 0;
let timerInterval = null;

/* ---------- State transitions ---------- */
function setState(next) {
  island.classList.remove(`state-${state}`);
  state = next;
  island.classList.add(`state-${state}`);
}

function startMusic() {
  stopTimer();
  musicPlaying = true;
  island.classList.remove("paused");
  mfPlay.textContent = "⏸";
  mfPlay.setAttribute("aria-label", "Pause");
  setState("music-chip");
}

function startTimer() {
  musicPlaying = false;
  timerRemaining = TIMER_SECONDS;
  paintTimer();
  setState("timer");

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerRemaining--;
    paintTimer();
    if (timerRemaining <= 0) {
      stopTimer();
      setState("idle");
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function clearAll() {
  stopTimer();
  musicPlaying = false;
  setState("idle");
}

function paintTimer() {
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  timerValue.textContent = `${m}:${String(s).padStart(2, "0")}`;
  ringFg.style.strokeDashoffset = String(RING_LENGTH * (1 - timerRemaining / TIMER_SECONDS));
}

/* ---------- Demo triggers ---------- */
document.getElementById("musicBtn").addEventListener("click", startMusic);
document.getElementById("timerBtn").addEventListener("click", startTimer);
document.getElementById("idleBtn").addEventListener("click", clearAll);

/* ---------- Island interactions ---------- */
island.addEventListener("click", (e) => {
  // buttons inside the expanded card handle themselves
  if (e.target.closest(".mf-btn")) return;

  if (state === "music-chip") {
    setState("music-full");
  } else if (state === "music-full" && e.target.closest("#mfHead")) {
    setState("music-chip");
  } else if (state === "timer" || state === "idle") {
    // tapping the timer or idle capsule does nothing destructive
  }
});

mfPlay.addEventListener("click", () => {
  musicPlaying = !musicPlaying;
  island.classList.toggle("paused", !musicPlaying);
  mfPlay.textContent = musicPlaying ? "⏸" : "▶";
  mfPlay.setAttribute("aria-label", musicPlaying ? "Pause" : "Play");
});

/* prev/next just pulse the EQ back on (demo) */
["mfPrev", "mfNext"].forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    musicPlaying = true;
    island.classList.remove("paused");
    mfPlay.textContent = "⏸";
  });
});
