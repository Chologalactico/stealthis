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
const device = document.getElementById("device");
let noMotion = window.MotionPreference.prefersReducedMotion();

function applyMode() {
  document.body.classList.toggle("no-motion", noMotion);
  toggle.textContent = noMotion ? "Enable motion" : "Disable motion";
}

window.addEventListener("pointermove", (event) => {
  if (noMotion) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 14;
  const y = (event.clientY / window.innerHeight - 0.5) * 12;
  device.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
});

toggle.addEventListener("click", () => {
  noMotion = !noMotion;
  if (noMotion) device.style.transform = "rotateY(0deg) rotateX(0deg)";
  applyMode();
});

applyMode();
