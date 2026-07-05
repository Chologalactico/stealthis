/* ============================================================
   FEATURE FLAG PANEL — env tabs, rollout, dirty-state save bar
   Working copy is diffed against a baseline; Save commits it.
   ============================================================ */

const ENVS = ["dev", "staging", "prod"];

const SEED = [
  {
    key: "new-checkout",
    name: "New checkout flow",
    desc: "Single-page checkout with wallet support.",
    tags: ["payments"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: true, rollout: 50 }, prod: { enabled: false, rollout: 0 } },
  },
  {
    key: "ai-summaries",
    name: "AI thread summaries",
    desc: "LLM-generated summaries on long comment threads.",
    tags: ["ai", "beta"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: true, rollout: 100 }, prod: { enabled: true, rollout: 10 } },
  },
  {
    key: "dark-mode-v2",
    name: "Dark mode v2",
    desc: "Re-tokenized dark palette with contrast fixes.",
    tags: ["ui"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: true, rollout: 100 }, prod: { enabled: true, rollout: 100 } },
  },
  {
    key: "bulk-export",
    name: "Bulk data export",
    desc: "Async CSV/Parquet exports for workspaces over 10k rows.",
    tags: ["data"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: false, rollout: 0 }, prod: { enabled: false, rollout: 0 } },
  },
  {
    key: "realtime-cursors",
    name: "Realtime cursors",
    desc: "Live presence cursors in shared documents.",
    tags: ["collab", "beta"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: true, rollout: 25 }, prod: { enabled: false, rollout: 0 } },
  },
  {
    key: "usage-alerts",
    name: "Usage alerts",
    desc: "Email + in-app alerts at 80% of plan quotas.",
    tags: ["billing"],
    env: { dev: { enabled: true, rollout: 100 }, staging: { enabled: true, rollout: 100 }, prod: { enabled: true, rollout: 60 } },
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

let baseline = clone(SEED);
let flags = clone(SEED);
let currentEnv = "prod";
let query = "";
let confirmingKey = null; // prod enable confirmation

/* ---------- Elements ---------- */
const listEl = document.getElementById("flagList");
const emptyEl = document.getElementById("emptyMsg");
const saveBar = document.getElementById("saveBar");
const dirtyCountEl = document.getElementById("dirtyCount");
const toastEl = document.getElementById("toast");

/* ---------- Dirty diff ---------- */
function dirtyEntries() {
  const changes = [];
  flags.forEach((flag, i) => {
    for (const env of ENVS) {
      const a = flag.env[env];
      const b = baseline[i].env[env];
      if (a.enabled !== b.enabled || a.rollout !== b.rollout) changes.push(`${flag.key}:${env}`);
    }
  });
  return changes;
}

function isFlagDirty(flag, i) {
  return ENVS.some(
    (env) =>
      flag.env[env].enabled !== baseline[i].env[env].enabled ||
      flag.env[env].rollout !== baseline[i].env[env].rollout
  );
}

/* ---------- Render ---------- */
function render() {
  // tab counts
  for (const env of ENVS) {
    document.querySelector(`[data-count="${env}"]`).textContent = flags.filter((f) => f.env[env].enabled).length;
  }
  document.getElementById("pauseEnvName").textContent =
    currentEnv === "prod" ? "production" : currentEnv;

  const q = query.trim().toLowerCase();
  const visible = flags.filter(
    (f) =>
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.key.includes(q) ||
      f.tags.some((t) => t.includes(q))
  );

  emptyEl.hidden = visible.length !== 0;
  listEl.innerHTML = "";

  visible.forEach((flag) => {
    const i = flags.indexOf(flag);
    const state = flag.env[currentEnv];
    const row = document.createElement("article");
    row.className = "flag" + (isFlagDirty(flag, i) ? " is-dirty" : "");

    row.innerHTML = `
      <div class="flag-name">
        ${flag.name}
        <code class="flag-key">${flag.key}</code>
        ${flag.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
      <label class="switch">
        <input type="checkbox" ${state.enabled ? "checked" : ""} aria-label="Enable ${flag.name} in ${currentEnv}" />
        <span class="knob"></span>
      </label>
      <p class="flag-desc">${flag.desc}</p>
      ${
        state.enabled
          ? `<div class="rollout">
               <input type="range" min="1" max="100" step="1" value="${state.rollout}"
                      aria-label="Rollout percentage for ${flag.name}" />
               <span class="rollout-value">${state.rollout === 100 ? "everyone" : state.rollout + "% of users"}</span>
             </div>`
          : ""
      }
      ${
        confirmingKey === flag.key
          ? `<div class="confirm">⚠ Enable in production?
               <button type="button" data-confirm>Yes, enable</button>
               <button type="button" data-cancel>Cancel</button>
             </div>`
          : ""
      }`;

    /* toggle */
    row.querySelector(".switch input").addEventListener("change", (e) => {
      const turningOn = e.target.checked;
      if (turningOn && currentEnv === "prod") {
        e.target.checked = false; // hold until confirmed
        confirmingKey = flag.key;
        render();
        return;
      }
      state.enabled = turningOn;
      if (turningOn && state.rollout === 0) state.rollout = 100;
      confirmingKey = null;
      render();
    });

    /* rollout slider */
    const slider = row.querySelector('input[type="range"]');
    if (slider) {
      slider.addEventListener("input", () => {
        state.rollout = Number(slider.value);
        row.querySelector(".rollout-value").textContent =
          state.rollout === 100 ? "everyone" : `${state.rollout}% of users`;
      });
      slider.addEventListener("change", render); // refresh dirty highlight on release
    }

    /* prod confirmation */
    const confirmBtn = row.querySelector("[data-confirm]");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        state.enabled = true;
        if (state.rollout === 0) state.rollout = 100;
        confirmingKey = null;
        render();
      });
      row.querySelector("[data-cancel]").addEventListener("click", () => {
        confirmingKey = null;
        render();
      });
    }

    listEl.appendChild(row);
  });

  /* save bar */
  const changes = dirtyEntries();
  saveBar.hidden = changes.length === 0;
  dirtyCountEl.textContent = `${changes.length} unsaved change${changes.length === 1 ? "" : "s"}`;
}

/* ---------- Toolbar wiring ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("is-active");
      t.removeAttribute("aria-selected");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    currentEnv = tab.dataset.env;
    confirmingKey = null;
    render();
  });
});

document.getElementById("search").addEventListener("input", (e) => {
  query = e.target.value;
  render();
});

document.getElementById("pauseAllBtn").addEventListener("click", () => {
  flags.forEach((flag) => {
    flag.env[currentEnv].enabled = false;
  });
  confirmingKey = null;
  render();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const count = dirtyEntries().length;
  baseline = clone(flags);
  render();
  toast(`✓ ${count} change${count === 1 ? "" : "s"} deployed`);
});

document.getElementById("discardBtn").addEventListener("click", () => {
  flags = clone(baseline);
  confirmingKey = null;
  render();
});

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

render();
