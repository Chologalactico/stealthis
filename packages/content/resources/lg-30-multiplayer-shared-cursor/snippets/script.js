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

const statusEl = document.getElementById("status");
const channelName = "libs-gen-shared-cursor";
const id = Math.random().toString(36).slice(2, 8);
const color = `hsl(${Math.floor(Math.random() * 360)} 90% 65%)`;

let channel;
const remotes = new Map();

function createRemote(idKey, colorKey) {
  const el = document.createElement("span");
  el.className = "remote-cursor";
  el.style.background = colorKey;
  document.body.appendChild(el);
  remotes.set(idKey, { el, lastSeen: Date.now() });
  return remotes.get(idKey);
}

function touchRemote(idKey, payload) {
  const remote = remotes.get(idKey) || createRemote(idKey, payload.color);
  remote.lastSeen = Date.now();
  remote.el.style.transform = `translate(${payload.x}px, ${payload.y}px)`;
}

function cleanupStale() {
  const now = Date.now();
  remotes.forEach((remote, key) => {
    if (now - remote.lastSeen > 3000) {
      remote.el.remove();
      remotes.delete(key);
    }
  });
}

if (window.BroadcastChannel) {
  channel = new BroadcastChannel(channelName);
  statusEl.textContent = `Connected as ${id}. Open multiple tabs to see shared cursors.`;

  channel.onmessage = (event) => {
    const payload = event.data;
    if (!payload || payload.id === id) return;
    touchRemote(payload.id, payload);
  };

  window.addEventListener("pointermove", (event) => {
    channel.postMessage({ id, color, x: event.clientX, y: event.clientY });
  });

  setInterval(cleanupStale, 500);
} else {
  statusEl.textContent = "BroadcastChannel unsupported in this browser.";
}

window.addEventListener("beforeunload", () => {
  if (channel) channel.close();
  remotes.forEach((r) => r.el.remove());
});
