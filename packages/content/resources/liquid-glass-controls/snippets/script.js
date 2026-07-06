/* ============================================================
   LIQUID GLASS FORM CONTROLS — switch, segmented, slider, stepper
   Every control writes into one state object + live readout.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = { wifi: true, view: "Monthly", brightness: 62, guests: 2 };

const readout = document.getElementById("readout");
function sync() {
  readout.textContent = JSON.stringify(state, null, 1).replace(/\n\s*/g, " ").replace(/[{}]/g, (m) => m);
}

/* ---------- Switch ---------- */
const wifiSwitch = document.getElementById("wifiSwitch");
wifiSwitch.addEventListener("click", () => {
  state.wifi = wifiSwitch.getAttribute("aria-checked") !== "true";
  wifiSwitch.setAttribute("aria-checked", String(state.wifi));
  sync();
});

/* ---------- Segmented control ---------- */
const segmented = document.getElementById("segmented");
const thumb = document.getElementById("segThumb");
const segs = Array.from(segmented.querySelectorAll(".seg"));

function moveThumb(seg, animate = true) {
  thumb.style.left = `${seg.offsetLeft}px`;
  thumb.style.width = `${seg.offsetWidth}px`;
  if (animate && !prefersReduced) {
    thumb.classList.remove("stretch");
    void thumb.offsetWidth;
    thumb.classList.add("stretch");
  }
}

function selectSeg(seg) {
  segs.forEach((s) => {
    s.classList.toggle("is-active", s === seg);
    s.setAttribute("aria-checked", String(s === seg));
  });
  moveThumb(seg);
  state.view = seg.dataset.value;
  sync();
}

segs.forEach((seg, i) => {
  seg.addEventListener("click", () => selectSeg(seg));
  seg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") selectSeg(segs[(i + 1) % segs.length]);
    if (e.key === "ArrowLeft") selectSeg(segs[(i - 1 + segs.length) % segs.length]);
  });
});

moveThumb(segmented.querySelector(".is-active"), false);
window.addEventListener("resize", () => moveThumb(segmented.querySelector(".is-active"), false));

/* ---------- Slider ---------- */
const slider = document.getElementById("brightness");
const fill = slider.querySelector(".gslider-fill");
const knob = slider.querySelector(".gslider-knob");

function setBrightness(value) {
  state.brightness = Math.round(Math.min(Math.max(value, 0), 100));
  fill.style.width = `${state.brightness}%`;
  knob.style.left = `${state.brightness}%`;
  slider.setAttribute("aria-valuenow", String(state.brightness));
  sync();
}

function sliderFromPointer(e) {
  const rect = slider.querySelector(".gslider-track").getBoundingClientRect();
  setBrightness(((e.clientX - rect.left) / rect.width) * 100);
}

slider.addEventListener("pointerdown", (e) => {
  slider.setPointerCapture(e.pointerId);
  sliderFromPointer(e);
});

slider.addEventListener("pointermove", (e) => {
  if (slider.hasPointerCapture(e.pointerId)) sliderFromPointer(e);
});

slider.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 10 : 2;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    setBrightness(state.brightness + step);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    setBrightness(state.brightness - step);
  }
});

/* ---------- Stepper (with hold-to-repeat) ---------- */
const guestValue = document.getElementById("guestValue");
const MIN_GUESTS = 1;
const MAX_GUESTS = 8;

function setGuests(next) {
  const clamped = Math.min(Math.max(next, MIN_GUESTS), MAX_GUESTS);
  if (clamped === state.guests) return;
  state.guests = clamped;
  guestValue.textContent = String(clamped);
  if (!prefersReduced) {
    guestValue.classList.remove("pop");
    void guestValue.offsetWidth;
    guestValue.classList.add("pop");
  }
  updateStepperBounds();
  sync();
}

function updateStepperBounds() {
  document.querySelectorAll(".step-btn").forEach((btn) => {
    const dir = Number(btn.dataset.dir);
    btn.disabled = (dir < 0 && state.guests <= MIN_GUESTS) || (dir > 0 && state.guests >= MAX_GUESTS);
  });
}

document.querySelectorAll(".step-btn").forEach((btn) => {
  const dir = Number(btn.dataset.dir);
  let holdTimer = null;
  let repeatTimer = null;

  btn.addEventListener("pointerdown", () => {
    setGuests(state.guests + dir);
    holdTimer = setTimeout(() => {
      repeatTimer = setInterval(() => setGuests(state.guests + dir), 140);
    }, 450);
  });

  const stop = () => {
    clearTimeout(holdTimer);
    clearInterval(repeatTimer);
  };
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
  btn.addEventListener("pointercancel", stop);
});

updateStepperBounds();
sync();
