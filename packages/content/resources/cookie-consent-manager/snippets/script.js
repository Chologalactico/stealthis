/* ============================================================
   COOKIE CONSENT MANAGER — banner, prefs dialog, persistence
   One versioned storage key; integrations subscribe to the
   `consentchange` CustomEvent and never touch this module.
   ============================================================ */

const STORAGE_KEY = "cookie-consent-v1"; // bump the version to legally re-prompt

const DEFAULTS = { necessary: true, analytics: false, marketing: false, personalization: false };

/* ---------- Storage ---------- */
function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function saveConsent(consent) {
  const full = { ...DEFAULTS, ...consent, necessary: true, ts: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    /* private mode: consent lives for the session only */
  }
  window.dispatchEvent(new CustomEvent("consentchange", { detail: full }));
  return full;
}

/* ---------- Elements ---------- */
const banner = document.getElementById("banner");
const dialog = document.getElementById("prefsDialog");
const fab = document.getElementById("cookieFab");

const prefInputs = {
  analytics: document.getElementById("prefAnalytics"),
  marketing: document.getElementById("prefMarketing"),
  personalization: document.getElementById("prefPersonalization"),
};

/* ---------- UI state ---------- */
function showBanner() {
  banner.hidden = false;
  fab.hidden = true;
}

function hideBanner() {
  banner.hidden = true;
  fab.hidden = false;
}

function openPrefs(current) {
  for (const [key, input] of Object.entries(prefInputs)) {
    input.checked = Boolean(current?.[key]);
  }
  dialog.showModal();
}

/* ---------- Banner actions ---------- */
document.getElementById("acceptBtn").addEventListener("click", () => {
  saveConsent({ analytics: true, marketing: true, personalization: true });
  hideBanner();
});

document.getElementById("rejectBtn").addEventListener("click", () => {
  saveConsent({ analytics: false, marketing: false, personalization: false });
  hideBanner();
});

document.getElementById("customizeBtn").addEventListener("click", () => {
  openPrefs(loadConsent() ?? DEFAULTS);
});

/* ---------- Dialog actions ---------- */
dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "save") return;
  saveConsent({
    analytics: prefInputs.analytics.checked,
    marketing: prefInputs.marketing.checked,
    personalization: prefInputs.personalization.checked,
  });
  hideBanner();
});

fab.addEventListener("click", () => openPrefs(loadConsent() ?? DEFAULTS));

/* ---------- Demo: integration monitor ---------- */
function paintMonitor(consent) {
  document.querySelectorAll("#monitorList li").forEach((li) => {
    li.classList.toggle("is-on", Boolean(consent?.[li.dataset.cat]));
  });
}

window.addEventListener("consentchange", (e) => paintMonitor(e.detail));

document.getElementById("resetBtn").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  paintMonitor({ necessary: true });
  showBanner();
});

/* ---------- Boot ---------- */
const stored = loadConsent();
if (stored) {
  hideBanner();
  paintMonitor(stored);
} else {
  showBanner();
  paintMonitor({ necessary: true });
}
