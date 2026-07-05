/* ============================================================
   LIQUID GLASS MEDIA PLAYER — living-glass lock-screen widget
   Pointer-tracked specular shine, gel buttons, accessible
   scrubber, simulated playback with per-track ambient color.
   ============================================================ */

const TRACKS = [
  { title: "Violet Static", artist: "Nadir Fields", hue: 265, duration: 214 },
  { title: "Copper Sunrise", artist: "Loma Vista", hue: 25, duration: 187 },
  { title: "Sea of Glass", artist: "Hall & Meridian", hue: 190, duration: 243 },
  { title: "Neon Orchard", artist: "Prism Pilot", hue: 320, duration: 201 },
];

let trackIndex = 0;
let position = 0; // seconds
let playing = false;

/* ---------- Elements ---------- */
const scene = document.getElementById("scene");
const player = document.getElementById("player");
const titleEl = document.getElementById("trackTitle");
const artistEl = document.getElementById("trackArtist");
const playBtn = document.getElementById("playBtn");
const scrubber = document.getElementById("scrubber");
const scrubFill = document.getElementById("scrubFill");
const scrubKnob = document.getElementById("scrubKnob");
const timeNow = document.getElementById("timeNow");
const timeLeft = document.getElementById("timeLeft");

const current = () => TRACKS[trackIndex];

/* ---------- Track + progress rendering ---------- */
function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function renderTrack() {
  const track = current();
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;
  scene.style.setProperty("--hue", String(track.hue));
  renderProgress();
}

function renderProgress() {
  const track = current();
  const ratio = Math.min(position / track.duration, 1);
  const pct = `${(ratio * 100).toFixed(2)}%`;
  scrubFill.style.width = pct;
  scrubKnob.style.left = pct;
  timeNow.textContent = fmt(position);
  timeLeft.textContent = `-${fmt(Math.max(track.duration - position, 0))}`;
  scrubber.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  scrubber.setAttribute("aria-valuetext", `${fmt(position)} of ${fmt(track.duration)}`);
}

/* ---------- Playback simulation ---------- */
let lastTick = null;

function tick(now) {
  if (!playing) return;
  if (lastTick !== null) {
    position += (now - lastTick) / 1000;
    if (position >= current().duration) {
      nextTrack(); // auto-advance
    }
    renderProgress();
  }
  lastTick = now;
  requestAnimationFrame(tick);
}

function setPlaying(value) {
  playing = value;
  playBtn.setAttribute("aria-pressed", String(playing));
  playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  if (playing) {
    lastTick = null;
    requestAnimationFrame(tick);
  }
}

playBtn.addEventListener("click", () => setPlaying(!playing));

function changeTrack(delta) {
  trackIndex = (trackIndex + delta + TRACKS.length) % TRACKS.length;
  position = 0;
  renderTrack();
}

function nextTrack() {
  changeTrack(1);
}

document.getElementById("prevBtn").addEventListener("click", () => {
  // standard behavior: restart if we're past 3s, otherwise go back
  if (position > 3) {
    position = 0;
    renderProgress();
  } else {
    changeTrack(-1);
  }
});

document.getElementById("nextBtn").addEventListener("click", nextTrack);

/* ---------- Scrubber: pointer drag + keyboard seek ---------- */
function seekFromPointer(e) {
  const rect = scrubber.querySelector(".scrub-track").getBoundingClientRect();
  const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
  position = ratio * current().duration;
  renderProgress();
}

scrubber.addEventListener("pointerdown", (e) => {
  scrubber.setPointerCapture(e.pointerId);
  seekFromPointer(e);
});

scrubber.addEventListener("pointermove", (e) => {
  if (scrubber.hasPointerCapture(e.pointerId)) seekFromPointer(e);
});

scrubber.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 30 : 5;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    position = Math.min(position + step, current().duration);
    renderProgress();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    position = Math.max(position - step, 0);
    renderProgress();
  }
});

/* ---------- Pointer-tracked specular shine ---------- */
player.addEventListener("pointermove", (e) => {
  const rect = player.getBoundingClientRect();
  player.style.setProperty("--shine-x", `${e.clientX - rect.left}px`);
  player.style.setProperty("--shine-y", `${e.clientY - rect.top}px`);
});

player.addEventListener("pointerleave", () => {
  player.style.setProperty("--shine-x", "30%");
  player.style.setProperty("--shine-y", "20%");
});

/* ---------- Boot ---------- */
renderTrack();
