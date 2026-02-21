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

const freqInput = document.getElementById("freq");
const intensityInput = document.getElementById("intensity");
const hueInput = document.getElementById("hue");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function render() {
  const freq = Number(freqInput.value);
  const intensity = Number(intensityInput.value);
  const hue = Number(hueInput.value);

  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      const nx = x / canvas.width;
      const ny = y / canvas.height;
      const wave = Math.sin(nx * freq * Math.PI + ny * 6) * 0.5 + 0.5;
      const tone = Math.floor((hue + wave * 120) % 360);
      const c = `hsl(${tone} 75% ${30 + intensity * 45}%)`;

      const m = c.match(/hsl\((\d+)\s+\d+%\s+(\d+)%\)/);
      const light = Number(m[2]) / 100;
      const base = light * 255;

      data[i] = Math.min(255, base + wave * 60);
      data[i + 1] = Math.min(255, base + (1 - wave) * 70);
      data[i + 2] = Math.min(255, base + intensity * 90);
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
}

[freqInput, intensityInput, hueInput].forEach((input) => {
  input.addEventListener("input", render);
});

render();
