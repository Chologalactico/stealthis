if (!window.MotionPreference) {
  const __mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  const __listeners = new Set();

  const MotionPreference = {
    prefersReducedMotion() {
      return __mql.matches;
    },
    setOverride(value) {
      const reduced = Boolean(value);
      document.documentElement.classList.toggle("reduced-motion", reduced);
      window.dispatchEvent(new CustomEvent("motion-preference", { detail: { reduced } }));
      for (const listener of __listeners) {
        try {
          listener({ reduced, override: reduced, systemReduced: __mql.matches });
        } catch {}
      }
    },
    onChange(listener) {
      __listeners.add(listener);
      try {
        listener({
          reduced: __mql.matches,
          override: null,
          systemReduced: __mql.matches,
        });
      } catch {}
      return () => __listeners.delete(listener);
    },
    getState() {
      return { reduced: __mql.matches, override: null, systemReduced: __mql.matches };
    },
  };

  window.MotionPreference = MotionPreference;
}

const themes = ["neon", "paper", "noir"];
const root = document.documentElement;
const modes = document.getElementById("modes");
const support = document.getElementById("support");
const reduced = window.MotionPreference.prefersReducedMotion();

const state = { theme: root.dataset.theme || "neon" };

function applyTheme(next) {
  root.dataset.theme = next;
  state.theme = next;
  renderButtons();
}

function transition(update) {
  if (!reduced && document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

function renderButtons() {
  modes.innerHTML = "";
  themes.forEach((theme) => {
    const btn = document.createElement("button");
    btn.className = `mode-btn ${state.theme === theme ? "active" : ""}`;
    btn.textContent = theme;
    btn.addEventListener("click", () => {
      if (theme === state.theme) return;
      transition(() => applyTheme(theme));
    });
    modes.appendChild(btn);
  });
}

function renderSupport() {
  if (document.startViewTransition && !reduced) {
    support.textContent = "Animated mode switch enabled with shared title/CTA continuity.";
    support.classList.add("ok");
  } else {
    support.textContent = "Fallback mode: theme updates are instant and fully usable.";
    support.classList.add("warn");
  }
}

renderButtons();
renderSupport();
