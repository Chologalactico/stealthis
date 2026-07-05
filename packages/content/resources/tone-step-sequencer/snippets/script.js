/* ============================================================
   TONE.JS STEP SEQUENCER — a sample-free drum machine
   Audio-clock scheduling via Transport; UI sync via Tone.Draw.
   ============================================================ */

const STEPS = 16;

/* ---------- Voices (all synthesized) ---------- */
Tone.Destination.volume.value = -4;

const kick = new Tone.MembraneSynth({
  octaves: 6,
  pitchDecay: 0.045,
  envelope: { attack: 0.001, decay: 0.32, sustain: 0 },
}).toDestination();

const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.17, sustain: 0 },
}).connect(new Tone.Filter(1800, "bandpass").toDestination());
snare.volume.value = -6;

const hat = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
}).connect(new Tone.Filter(8000, "highpass").toDestination());
hat.volume.value = -14;

const bass = new Tone.FMSynth({
  harmonicity: 1.5,
  modulationIndex: 6,
  envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.2 },
}).toDestination();
bass.volume.value = -7;

const TRACKS = [
  { name: "Kick", trigger: (time) => kick.triggerAttackRelease("C1", "8n", time) },
  { name: "Snare", trigger: (time) => snare.triggerAttackRelease("16n", time) },
  { name: "Hat", trigger: (time) => hat.triggerAttackRelease("32n", time) },
  {
    name: "Bass",
    trigger: (time, step) => bass.triggerAttackRelease(step < 8 ? "C2" : "D#2", "16n", time),
  },
];

/* ---------- Pattern ---------- */
const PRESET = [
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], // kick
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1], // hat
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], // bass
];

let pattern = PRESET.map((row) => [...row]);

/* ---------- Grid DOM ---------- */
const grid = document.getElementById("grid");
const cellRefs = [];

TRACKS.forEach((track, r) => {
  const label = document.createElement("span");
  label.className = "track-label";
  label.textContent = track.name;
  grid.appendChild(label);

  cellRefs[r] = [];
  for (let s = 0; s < STEPS; s++) {
    const cell = document.createElement("button");
    cell.className = "cell";
    if (s % 4 === 0 && s !== 0) cell.classList.add("bar-start");
    cell.dataset.step = s;
    cell.setAttribute("aria-label", `${track.name} step ${s + 1}`);
    cell.addEventListener("click", () => {
      pattern[r][s] = pattern[r][s] ? 0 : 1;
      cell.classList.toggle("on", Boolean(pattern[r][s]));
      cell.setAttribute("aria-pressed", String(Boolean(pattern[r][s])));
    });
    grid.appendChild(cell);
    cellRefs[r][s] = cell;
  }
});

function paintPattern() {
  TRACKS.forEach((_, r) => {
    for (let s = 0; s < STEPS; s++) {
      cellRefs[r][s].classList.toggle("on", Boolean(pattern[r][s]));
      cellRefs[r][s].setAttribute("aria-pressed", String(Boolean(pattern[r][s])));
    }
  });
}
paintPattern();

/* ---------- Sequencer loop (audio clock, not setInterval) ---------- */
let stepCounter = 0;

Tone.Transport.bpm.value = 112;
Tone.Transport.scheduleRepeat((time) => {
  const step = stepCounter % STEPS;
  TRACKS.forEach((track, r) => {
    if (pattern[r][step]) track.trigger(time, step);
  });
  // paint in sync with what the ear hears
  Tone.Draw.schedule(() => paintPlayhead(step), time);
  stepCounter++;
}, "16n");

function paintPlayhead(step) {
  document.querySelectorAll(".cell.playing").forEach((c) => c.classList.remove("playing"));
  document.querySelectorAll(`.cell[data-step="${step}"]`).forEach((c) => c.classList.add("playing"));
}

function clearPlayhead() {
  document.querySelectorAll(".cell.playing").forEach((c) => c.classList.remove("playing"));
}

/* ---------- Transport controls ---------- */
const playBtn = document.getElementById("playBtn");

playBtn.addEventListener("click", async () => {
  await Tone.start(); // AudioContext must start inside a user gesture
  if (Tone.Transport.state === "started") {
    Tone.Transport.stop();
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-pressed", "false");
    clearPlayhead();
    stepCounter = 0;
  } else {
    stepCounter = 0;
    Tone.Transport.start("+0.05");
    playBtn.textContent = "■ Stop";
    playBtn.setAttribute("aria-pressed", "true");
  }
});

const bpmSlider = document.getElementById("bpmSlider");
const bpmValue = document.getElementById("bpmValue");
bpmSlider.addEventListener("input", () => {
  Tone.Transport.bpm.value = Number(bpmSlider.value);
  bpmValue.textContent = bpmSlider.value;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  pattern = pattern.map((row) => row.map(() => 0));
  paintPattern();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  pattern = PRESET.map((row) => [...row]);
  paintPattern();
});
