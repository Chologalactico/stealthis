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
let noMotion = window.MotionPreference.prefersReducedMotion();

function formatValue(rawTarget, value) {
  const hasDecimal = String(rawTarget).includes(".");
  if (hasDecimal) return value.toFixed(2);
  return Math.round(value).toString();
}

function animateCounters() {
  document.querySelectorAll(".value").forEach((node) => {
    const target = Number(node.dataset.target);
    if (Number.isNaN(target)) return;
    const start = performance.now();
    const duration = noMotion ? 0 : 900;

    const step = (now) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = formatValue(target, target * eased);
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

function applyMode() {
  document.body.classList.toggle("no-motion", noMotion);
  toggle.textContent = noMotion ? "Enable motion" : "Disable motion";
  animateCounters();
}

toggle.addEventListener("click", () => {
  noMotion = !noMotion;
  applyMode();
});

applyMode();
