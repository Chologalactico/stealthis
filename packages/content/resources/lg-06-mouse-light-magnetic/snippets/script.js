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

const reduced = window.MotionPreference.prefersReducedMotion();
const spot = document.getElementById("spot");
const magnet = document.getElementById("magnet");

if (reduced) {
  spot.style.display = "none";
} else {
  window.addEventListener("pointermove", (e) => {
    spot.style.left = `${e.clientX}px`;
    spot.style.top = `${e.clientY}px`;
  });

  magnet.addEventListener("pointermove", (e) => {
    const r = magnet.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    magnet.style.transform = `translate(${dx * 0.18}px, ${dy * 0.18}px)`;
  });

  magnet.addEventListener("pointerleave", () => {
    magnet.style.transform = "translate(0px, 0px)";
  });
}
