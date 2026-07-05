/* ============================================================
   BILLING USAGE METER — data-driven plan & quota card
   Swap the USAGE array and call renderUsage() to update.
   ============================================================ */

const USAGE = [
  { id: "api", label: "API requests", used: 8420000, limit: 10000000 },
  { id: "storage", label: "Storage", used: 74.2, limit: 100, unit: "GB" },
  { id: "seats", label: "Team seats", used: 9, limit: 10 },
  { id: "builds", label: "CI minutes", used: 1780, limit: 3000, unit: "min" },
];

const CYCLE = { day: 21, days: 30 }; // billing-cycle progress

const WARN_AT = 0.7;
const CRIT_AT = 0.9;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function fmt(value, unit) {
  const text = value >= 10000 ? compact.format(value) : String(value);
  return unit ? `${text} ${unit}` : text;
}

function levelOf(ratio) {
  if (ratio >= CRIT_AT) return "crit";
  if (ratio >= WARN_AT) return "warn";
  return "ok";
}

/* ---------- Meters ---------- */
function renderUsage(usage) {
  const host = document.getElementById("meters");
  host.innerHTML = "";

  for (const item of usage) {
    const ratio = Math.min(item.used / item.limit, 1);
    const level = levelOf(ratio);

    const row = document.createElement("div");
    row.className = "meter";
    row.innerHTML = `
      <div class="meter-head">
        <span class="meter-label">
          ${item.label}
          ${level === "crit" ? '<span class="pill crit">At limit</span>' : ""}
          ${level === "warn" ? '<span class="pill warn">Approaching</span>' : ""}
        </span>
        <span class="meter-value"><strong>${fmt(item.used, item.unit)}</strong> / ${fmt(item.limit, item.unit)}</span>
      </div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${item.limit}"
           aria-valuenow="${item.used}" aria-label="${item.label} usage">
        <div class="bar-fill ${level}" data-target="${(ratio * 100).toFixed(1)}"></div>
      </div>`;
    host.appendChild(row);
  }

  // sweep bars in on the next frame so the width transition runs
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      host.querySelectorAll(".bar-fill").forEach((fill) => {
        fill.style.width = `${fill.dataset.target}%`;
      });
    });
  });

  renderCta(usage);
}

/* ---------- Upgrade CTA (only when something is hot) ---------- */
function renderCta(usage) {
  const hot = usage.filter((item) => item.used / item.limit >= WARN_AT);
  const row = document.getElementById("ctaRow");
  if (hot.length === 0) {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  document.getElementById("ctaTitle").textContent =
    hot.some((item) => item.used / item.limit >= CRIT_AT)
      ? "You're about to hit a limit"
      : "You're close to your limits";
  document.getElementById("ctaDetail").textContent =
    hot.map((item) => item.label).join(", ") + " — Growth raises every quota 5×.";
}

/* ---------- Billing-cycle ring ---------- */
function renderCycle() {
  const ring = document.getElementById("cycleRing");
  const circumference = 2 * Math.PI * 19;
  const progress = CYCLE.day / CYCLE.days;
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = String(circumference * (1 - progress));
  });
  document.getElementById("cycleDays").textContent = String(CYCLE.days - CYCLE.day);
}

renderUsage(USAGE);
renderCycle();
