/* ============================================================
   LIQUID GLASS SPOTLIGHT SEARCH — grouped filtering + keyboard
   ============================================================ */

const ITEMS = [
  { section: "Apps", icon: "🎧", color: "#be123c", name: "Music", hint: "App", keywords: "songs audio player" },
  { section: "Apps", icon: "✉", color: "#0369a1", name: "Mail", hint: "App", keywords: "email inbox" },
  { section: "Apps", icon: "🌸", color: "#a21caf", name: "Photos", hint: "App", keywords: "pictures gallery" },
  { section: "Apps", icon: "🗺", color: "#15803d", name: "Maps", hint: "App", keywords: "navigation directions" },
  { section: "Apps", icon: "⚙", color: "#475569", name: "Settings", hint: "App", keywords: "preferences system" },
  { section: "Actions", icon: "✍", color: "#0e7490", name: "Compose message", hint: "Mail", keywords: "email write new mail" },
  { section: "Actions", icon: "⏱", color: "#b45309", name: "Start 25-minute focus", hint: "Clock", keywords: "timer pomodoro" },
  { section: "Actions", icon: "🌙", color: "#4338ca", name: "Toggle Do Not Disturb", hint: "Focus", keywords: "dnd silence notifications" },
  { section: "Actions", icon: "📸", color: "#7c3aed", name: "Take screenshot", hint: "System", keywords: "capture screen" },
  { section: "Files", icon: "📊", color: "#0f766e", name: "Q3-pricing-experiment.xlsx", hint: "Numbers · 2d ago", keywords: "spreadsheet revenue" },
  { section: "Files", icon: "🎨", color: "#c2410c", name: "liquid-glass-spec.fig", hint: "Figma · 5d ago", keywords: "design figma glass" },
  { section: "Files", icon: "📄", color: "#334155", name: "onboarding-notes.md", hint: "Notes · 1w ago", keywords: "markdown docs glass" },
];

const SECTIONS = ["Apps", "Actions", "Files"];

const overlay = document.getElementById("overlay");
const input = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const noResults = document.getElementById("noResults");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

let flat = []; // currently visible items, in DOM order
let selected = 0;

/* ---------- Open / close ---------- */
function openSpotlight() {
  overlay.hidden = false;
  input.value = "";
  renderResults("");
  input.focus();
}

function closeSpotlight() {
  overlay.hidden = true;
}

document.getElementById("summonBtn").addEventListener("click", openSpotlight);
document.getElementById("backdrop").addEventListener("click", closeSpotlight);

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    overlay.hidden ? openSpotlight() : closeSpotlight();
  }
  if (e.key === "Escape" && !overlay.hidden) closeSpotlight();
});

/* ---------- Filtering + rendering ---------- */
function matches(item, q) {
  return (item.name + " " + item.hint + " " + item.keywords).toLowerCase().includes(q);
}

function renderResults(query) {
  const q = query.trim().toLowerCase();
  flat = ITEMS.filter((item) => !q || matches(item, q));
  selected = 0;

  resultsEl.innerHTML = "";
  noResults.hidden = flat.length !== 0;

  for (const section of SECTIONS) {
    const group = flat.filter((item) => item.section === section);
    if (group.length === 0) continue;

    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = section;
    resultsEl.appendChild(label);

    for (const item of group) {
      const idx = flat.indexOf(item);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "result" + (idx === selected ? " is-selected" : "");
      btn.setAttribute("role", "option");
      btn.dataset.index = idx;
      btn.innerHTML = `
        <span class="result-icon" style="background:${item.color}" aria-hidden="true">${item.icon}</span>
        <span class="result-name">${item.name}</span>
        <span class="result-hint">${item.hint}</span>`;
      btn.addEventListener("click", () => launch(item));
      btn.addEventListener("pointerenter", () => setSelected(idx));
      resultsEl.appendChild(btn);
    }
  }
}

function setSelected(index) {
  selected = index;
  resultsEl.querySelectorAll(".result").forEach((el) => {
    el.classList.toggle("is-selected", Number(el.dataset.index) === selected);
  });
  const el = resultsEl.querySelector(`.result[data-index="${selected}"]`);
  if (el) el.scrollIntoView({ block: "nearest" });
}

input.addEventListener("input", () => renderResults(input.value));

input.addEventListener("keydown", (e) => {
  if (flat.length === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setSelected((selected + 1) % flat.length);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setSelected((selected - 1 + flat.length) % flat.length);
  } else if (e.key === "Enter") {
    e.preventDefault();
    launch(flat[selected]);
  }
});

/* ---------- Launch (demo toast) ---------- */
let toastTimer;

function launch(item) {
  closeSpotlight();
  toastText.textContent = `${item.icon} Opening ${item.name}…`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}
