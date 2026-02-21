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

const toggle = document.getElementById("motionToggle");
const bars = document.getElementById("bars");
let noMotion = window.MotionPreference.prefersReducedMotion();

for (let i = 0; i < 14; i += 1) {
  const bar = document.createElement("span");
  bar.className = "bar";
  bar.style.height = `${24 + Math.random() * 68}px`;
  bar.style.animationDelay = `${i * 0.06}s`;
  bars.appendChild(bar);
}

function applyMode() {
  document.body.classList.toggle("no-motion", noMotion);
  toggle.textContent = noMotion ? "Enable motion" : "Disable motion";
}

toggle.addEventListener("click", () => {
  noMotion = !noMotion;
  applyMode();
});

applyMode();
