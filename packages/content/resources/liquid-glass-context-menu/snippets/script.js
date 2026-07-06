/* ============================================================
   LIQUID GLASS CONTEXT MENU — press-and-hold, reactions, menu
   ============================================================ */

const HOLD_MS = 380;
const MOVE_CANCEL = 8; // px of drift that cancels the hold

const scene = document.getElementById("scene");
const menuLayer = document.getElementById("menuLayer");
const menu = document.getElementById("menu");
const reactions = document.getElementById("reactions");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

let activeBubble = null;

/* ---------- Open / close ---------- */
function openMenu(bubble) {
  activeBubble = bubble;
  bubble.classList.add("lifted");
  scene.classList.add("menu-open");
  menuLayer.hidden = false;

  // measure after unhide so widths are real
  const rect = bubble.getBoundingClientRect();
  const menuH = 240;
  const openBelow = rect.bottom + menuH + 20 < window.innerHeight;

  const reactW = reactions.offsetWidth;
  const menuW = menu.offsetWidth;
  const centerX = rect.left + rect.width / 2;

  const clampX = (x, w) => Math.min(Math.max(x, 10), window.innerWidth - w - 10);

  reactions.style.left = `${clampX(centerX - reactW / 2, reactW)}px`;
  reactions.style.top = `${rect.top - reactions.offsetHeight - 10}px`;

  menu.style.left = `${clampX(centerX - menuW / 2, menuW)}px`;
  menu.style.top = openBelow
    ? `${rect.bottom + 10}px`
    : `${rect.top - menuH - reactions.offsetHeight - 26}px`;
}

function closeMenu() {
  if (activeBubble) activeBubble.classList.remove("lifted");
  activeBubble = null;
  scene.classList.remove("menu-open");
  menuLayer.hidden = true;
}

/* dismiss on backdrop click or Escape */
menuLayer.addEventListener("click", (e) => {
  if (!e.target.closest(".menu") && !e.target.closest(".reactions")) closeMenu();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeBubble) closeMenu();
});

/* ---------- Press-and-hold on bubbles ---------- */
document.querySelectorAll(".bubble").forEach((bubble) => {
  let holdTimer = null;
  let startX = 0;
  let startY = 0;

  bubble.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    holdTimer = setTimeout(() => openMenu(bubble), HOLD_MS);
  });

  bubble.addEventListener("pointermove", (e) => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_CANCEL) {
      clearTimeout(holdTimer);
    }
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((type) =>
    bubble.addEventListener(type, () => clearTimeout(holdTimer))
  );

  // desktop shortcut
  bubble.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openMenu(bubble);
  });

  // keyboard access
  bubble.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(bubble);
    }
  });
});

/* ---------- Reactions ---------- */
document.querySelectorAll(".react").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!activeBubble) return;
    const emoji = btn.dataset.emoji;
    const existing = activeBubble.querySelector(".badge");

    if (existing && existing.textContent === emoji) {
      existing.remove(); // tap the same one to remove
    } else {
      if (existing) existing.remove();
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = emoji;
      activeBubble.appendChild(badge);
    }
    closeMenu();
  });
});

/* ---------- Menu actions ---------- */
let toastTimer;

function showToast(text) {
  toastText.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}

document.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", () => {
    const action = item.dataset.action;
    const bubble = activeBubble;

    if (action === "Copy" && bubble) {
      const text = bubble.childNodes[0].textContent.trim();
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      showToast("⧉ Copied to clipboard");
    } else if (action === "Delete" && bubble) {
      const msg = bubble.closest(".msg");
      closeMenu();
      msg.style.transition = "opacity 0.25s, transform 0.25s";
      msg.style.opacity = "0";
      msg.style.transform = "scale(0.9)";
      setTimeout(() => msg.remove(), 250);
      showToast("🗑 Message deleted");
      return;
    } else {
      showToast(`${action} — coming right up`);
    }
    closeMenu();
  });
});
