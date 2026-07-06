/* ============================================================
   LIQUID GLASS DOCK — cosine-falloff fisheye magnification
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const APPS = [
  { name: "Finder", glyph: "🙂", from: "#3b82f6", to: "#1e3a8a" },
  { name: "Mail", glyph: "✉", from: "#38bdf8", to: "#0369a1" },
  { name: "Photos", glyph: "🌸", from: "#f472b6", to: "#facc15" },
  { name: "Music", glyph: "♫", from: "#fb7185", to: "#be123c" },
  { name: "Notes", glyph: "✎", from: "#fde68a", to: "#d97706" },
  { name: "Terminal", glyph: ">_", from: "#334155", to: "#0f172a" },
  { name: "Maps", glyph: "➤", from: "#4ade80", to: "#15803d" },
  { name: "Settings", glyph: "⚙", from: "#94a3b8", to: "#475569" },
];

const RANGE = 130; // px of influence around the cursor
const BOOST = 0.65; // max extra scale at distance 0

const dock = document.getElementById("dock");
const row = document.getElementById("dockRow");
const tooltip = document.getElementById("tooltip");
const tooltipText = document.getElementById("tooltipText");

/* ---------- Build icons ---------- */
const icons = APPS.map((app) => {
  const btn = document.createElement("button");
  btn.className = "app";
  btn.type = "button";
  btn.setAttribute("aria-label", app.name);
  btn.dataset.name = app.name;
  btn.style.background = `linear-gradient(145deg, ${app.from}, ${app.to})`;
  btn.innerHTML = `<span aria-hidden="true">${app.glyph}</span><span class="dot" aria-hidden="true"></span>`;

  btn.addEventListener("click", () => {
    const running = btn.classList.toggle("is-running");
    if (running && !prefersReduced) {
      btn.classList.remove("bounce");
      void btn.offsetWidth; // restart animation
      btn.classList.add("bounce");
    }
  });

  btn.addEventListener("pointerenter", () => {
    const rect = btn.getBoundingClientRect();
    tooltipText.textContent = app.name;
    tooltip.hidden = false;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${dock.getBoundingClientRect().top - 14}px`;
  });

  btn.addEventListener("pointerleave", () => {
    tooltip.hidden = true;
  });

  row.appendChild(btn);
  return btn;
});

/* ---------- Fisheye ---------- */
function magnify(cursorX) {
  for (const icon of icons) {
    const rect = icon.getBoundingClientRect();
    // divide out the current scale so the measurement is stable mid-zoom
    const currentScale = rect.width / icon.offsetWidth;
    const centerX = rect.left + rect.width / 2;
    const dist = Math.abs(centerX - cursorX) / currentScale;

    const scale =
      dist > RANGE ? 1 : 1 + BOOST * Math.cos((dist / RANGE) * (Math.PI / 2)) ** 2;
    icon.style.transform = `scale(${scale.toFixed(3)})`;
  }
}

function reset() {
  icons.forEach((icon) => {
    icon.style.transform = "scale(1)";
  });
}

if (!prefersReduced) {
  dock.addEventListener("pointermove", (e) => magnify(e.clientX));
  dock.addEventListener("pointerleave", reset);
}
