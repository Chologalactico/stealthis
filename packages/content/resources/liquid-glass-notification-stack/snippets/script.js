/* ============================================================
   LIQUID GLASS NOTIFICATION STACK — expand + swipe to dismiss
   ============================================================ */

const NOTIFS = [
  { app: "Messages", glyph: "💬", from: "#4ade80", to: "#15803d", time: "now", title: "Priya Nair", body: "The review moved to Thursday — same deck, same room." },
  { app: "Calendar", glyph: "📅", from: "#f87171", to: "#b91c1c", time: "9m ago", title: "Standup in 15 minutes", body: "Daily sync · Room 4 · 10:00" },
  { app: "Mail", glyph: "✉", from: "#38bdf8", to: "#0369a1", time: "32m ago", title: "Stripe", body: "Your July payout of $4,210.55 is on the way." },
  { app: "Photos", glyph: "🌸", from: "#f472b6", to: "#a21caf", time: "1h ago", title: "New memory", body: "\"Lisbon, last spring\" is ready to view." },
];

const stack = document.getElementById("stack");
const groupHead = document.getElementById("groupHead");
const groupCount = document.getElementById("groupCount");
const empty = document.getElementById("empty");

let expanded = false;

/* ---------- Build cards ---------- */
function buildCard(data) {
  const card = document.createElement("article");
  card.className = "notif lg";
  card.innerHTML = `
    <span class="lg-effect"></span><span class="lg-tint"></span><span class="lg-shine"></span>
    <div class="lg-content notif-inner">
      <span class="app-badge" style="background:linear-gradient(145deg, ${data.from}, ${data.to})" aria-hidden="true">${data.glyph}</span>
      <div class="notif-text">
        <div class="notif-top"><span>${data.app}</span><span>${data.time}</span></div>
        <div class="notif-title">${data.title}</div>
        <div class="notif-body">${data.body}</div>
      </div>
    </div>`;
  attachSwipe(card);
  return card;
}

function populate() {
  stack.innerHTML = "";
  NOTIFS.forEach((n) => stack.appendChild(buildCard(n)));
  expanded = false;
  update();
}

/* ---------- State rendering ---------- */
function cards() {
  return Array.from(stack.querySelectorAll(".notif"));
}

function update() {
  const count = cards().length;
  stack.classList.toggle("collapsed", !expanded);
  stack.classList.toggle("expanded", expanded);
  groupHead.hidden = !expanded || count === 0;
  groupCount.textContent = `${count} notification${count === 1 ? "" : "s"}`;
  empty.hidden = count !== 0;

  // collapsed pile needs explicit height (children are absolute)
  if (!expanded && count > 0) {
    const front = cards()[0];
    stack.style.height = `${front.offsetHeight + 26}px`;
  } else {
    stack.style.height = "";
  }
}

/* expand on tap of the pile */
stack.addEventListener("click", () => {
  if (!expanded && cards().length > 1) {
    expanded = true;
    update();
  }
});

document.getElementById("lessBtn").addEventListener("click", () => {
  expanded = false;
  update();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  cards().forEach((card, i) => setTimeout(() => dismiss(card, 1), i * 60));
});

document.getElementById("restoreBtn").addEventListener("click", populate);

/* ---------- Swipe to dismiss ---------- */
function dismiss(card, direction) {
  card.classList.add("dismissing");
  card.style.transform = `translateX(${direction * (card.offsetWidth + 80)}px)`;
  card.style.opacity = "0";
  setTimeout(() => {
    card.remove();
    update();
  }, 300);
}

function attachSwipe(card) {
  let startX = null;
  let dx = 0;

  card.addEventListener("pointerdown", (e) => {
    if (!expanded) return; // pile taps expand instead
    startX = e.clientX;
    dx = 0;
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", (e) => {
    if (startX === null || !card.hasPointerCapture(e.pointerId)) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px)`;
    card.style.opacity = String(Math.max(1 - Math.abs(dx) / (card.offsetWidth * 0.9), 0.2));
  });

  function release() {
    if (startX === null) return;
    card.style.transition = "";
    if (Math.abs(dx) > card.offsetWidth * 0.38) {
      dismiss(card, Math.sign(dx) || 1);
    } else {
      card.style.transform = "";
      card.style.opacity = "";
    }
    startX = null;
  }

  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
}

/* ---------- Boot ---------- */
populate();
window.addEventListener("resize", update);
