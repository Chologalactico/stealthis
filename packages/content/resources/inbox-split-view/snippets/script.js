/* ============================================================
   INBOX SPLIT VIEW — master-detail with keyboard navigation
   j/k or arrows to move, e to archive, u to toggle unread.
   ============================================================ */

const MESSAGES = [
  {
    id: 1, from: "Priya Nair", time: "09:41", unread: true,
    subject: "Design review moved to Thursday",
    body: [
      "Hey — quick heads up that tomorrow's design review is moving to Thursday at 14:00 so the motion team can join.",
      "Same agenda: onboarding revisions, the new empty states, and fifteen minutes on the icon grid. Deck stays in the usual folder.",
      "If Thursday doesn't work for you, drop a note in #design and we'll record it.",
    ],
  },
  {
    id: 2, from: "Vercel", time: "09:12", unread: true,
    subject: "Deployment failed: stealthis-www (main)",
    body: [
      "Your deployment for stealthis-www on branch main failed during the build step.",
      "Error: catalog.json is empty — expected at least one resource. Exit code 1.",
      "Check the build logs for the full trace, or re-run the deploy after fixing the catalog generation step.",
    ],
  },
  {
    id: 3, from: "Marco Beltrán", time: "08:55", unread: true,
    subject: "Re: Q3 pricing experiment",
    body: [
      "Numbers from the first two weeks are in. The usage-based variant is converting 18% better on the landing page, but trial-to-paid is flat.",
      "My read: the calculator sells the idea, the paywall doesn't carry it through. Suggest we keep the calculator and rework the checkout copy before deciding.",
      "Full sheet attached in the thread. Can walk through it Friday.",
    ],
  },
  {
    id: 4, from: "GitHub", time: "Yesterday", unread: false,
    subject: "chologalactico/stealthis: PR #14 approved",
    body: [
      "Your pull request 'feat(content): add creative animation resources' was approved by 2 reviewers.",
      "All checks have passed. The branch has no conflicts with the base branch and is ready to merge.",
    ],
  },
  {
    id: 5, from: "Ana Sofía Ruiz", time: "Yesterday", unread: false,
    subject: "Contract for the illustration pack",
    body: [
      "Sending over the signed contract for the Q3 illustration pack — twelve spot illustrations plus the empty-state series.",
      "First drafts land on the 18th. I'll share a private board so the team can leave comments directly on each piece.",
    ],
  },
  {
    id: 6, from: "Linear", time: "Yesterday", unread: false,
    subject: "Weekly digest: 14 issues completed",
    body: [
      "Your team completed 14 issues this week across 3 projects. Velocity is up 12% over the four-week average.",
      "Top project: Content pipeline (8 issues). Longest-open issue closed: 'Lab iframe resize jank' at 41 days.",
    ],
  },
  {
    id: 7, from: "Tomás Herrera", time: "Mon", unread: false,
    subject: "Lunch next week + a wild idea",
    body: [
      "Overdue catch-up? Thinking Tuesday or Wednesday near the studio.",
      "Also I've been sketching an idea for a collaborative mood-board tool with live cursors and I can't stop thinking about it. Want to poke holes in it over noodles.",
    ],
  },
  {
    id: 8, from: "Stripe", time: "Mon", unread: false,
    subject: "Your July payout is on the way",
    body: [
      "A payout of $4,210.55 was initiated to your bank account ending in 4421.",
      "Expected arrival: 2 business days. View the full breakdown in your dashboard.",
    ],
  },
];

const AVATAR_COLORS = ["#7dd3fc", "#f9a8d4", "#fcd34d", "#86efac", "#c4b5fd", "#fda4af"];

let messages = [...MESSAGES];
let selectedId = null;
let query = "";

/* ---------- Elements ---------- */
const app = document.getElementById("app");
const listEl = document.getElementById("messageList");
const listEmpty = document.getElementById("listEmpty");
const unreadBadge = document.getElementById("unreadBadge");
const detail = document.getElementById("detail");
const detailEmpty = document.getElementById("detailEmpty");
const searchEl = document.getElementById("search");

const isMobile = () => window.matchMedia("(max-width: 760px)").matches;

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function visibleMessages() {
  const q = query.trim().toLowerCase();
  return messages.filter(
    (m) =>
      !q ||
      m.from.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.body.join(" ").toLowerCase().includes(q)
  );
}

/* ---------- Render ---------- */
function renderList() {
  const visible = visibleMessages();
  listEl.innerHTML = "";
  listEmpty.hidden = visible.length !== 0;
  listEmpty.textContent = messages.length === 0 ? "Inbox zero. Beautiful." : "No messages match your search.";

  for (const msg of visible) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "msg" + (msg.unread ? " is-unread" : "") + (msg.id === selectedId ? " is-selected" : "");
    btn.innerHTML = `
      <span class="avatar" style="background:${avatarColor(msg.from)}">${initials(msg.from)}</span>
      <span class="msg-from"><span class="dot" aria-hidden="true"></span><span>${msg.from}</span></span>
      <span class="msg-time">${msg.time}</span>
      <span class="msg-subject">${msg.subject}</span>`;
    btn.addEventListener("click", () => select(msg.id));
    listEl.appendChild(btn);
  }

  unreadBadge.textContent = String(messages.filter((m) => m.unread).length);
}

function renderDetail() {
  const msg = messages.find((m) => m.id === selectedId);
  if (!msg) {
    detail.hidden = true;
    detailEmpty.hidden = false;
    return;
  }
  detail.hidden = false;
  detailEmpty.hidden = true;
  document.getElementById("detailSubject").textContent = msg.subject;
  document.getElementById("detailFrom").textContent = msg.from;
  document.getElementById("detailTime").textContent = msg.time;
  const avatar = document.getElementById("detailAvatar");
  avatar.textContent = initials(msg.from);
  avatar.style.background = avatarColor(msg.from);
  document.getElementById("detailBody").innerHTML = msg.body.map((p) => `<p>${p}</p>`).join("");
}

function render() {
  renderList();
  renderDetail();
}

/* ---------- Actions ---------- */
function select(id, { keepUnread = false } = {}) {
  selectedId = id;
  const msg = messages.find((m) => m.id === id);
  if (msg && !keepUnread) msg.unread = false;
  if (isMobile()) app.classList.add("show-detail");
  render();
}

function move(delta) {
  const visible = visibleMessages();
  if (visible.length === 0) return;
  const index = visible.findIndex((m) => m.id === selectedId);
  const next = index === -1 ? 0 : Math.min(Math.max(index + delta, 0), visible.length - 1);
  select(visible[next].id);
  const row = listEl.children[next];
  if (row) row.scrollIntoView({ block: "nearest" });
}

function archiveSelected() {
  const visible = visibleMessages();
  const index = visible.findIndex((m) => m.id === selectedId);
  if (index === -1) return;
  messages = messages.filter((m) => m.id !== selectedId);
  const remaining = visibleMessages();
  selectedId = remaining.length ? remaining[Math.min(index, remaining.length - 1)].id : null;
  if (!selectedId) app.classList.remove("show-detail");
  render();
}

function toggleUnread() {
  const msg = messages.find((m) => m.id === selectedId);
  if (!msg) return;
  msg.unread = !msg.unread;
  render();
}

/* ---------- Wiring ---------- */
searchEl.addEventListener("input", () => {
  query = searchEl.value;
  renderList();
});

document.getElementById("archiveBtn").addEventListener("click", archiveSelected);
document.getElementById("unreadBtn").addEventListener("click", toggleUnread);
document.getElementById("backBtn").addEventListener("click", () => {
  app.classList.remove("show-detail");
});

window.addEventListener("keydown", (e) => {
  if (e.target === searchEl) return; // don't hijack typing
  switch (e.key) {
    case "j":
    case "ArrowDown":
      e.preventDefault();
      move(1);
      break;
    case "k":
    case "ArrowUp":
      e.preventDefault();
      move(-1);
      break;
    case "e":
      archiveSelected();
      break;
    case "u":
      toggleUnread();
      break;
  }
});

/* start with the first message open on desktop */
if (!isMobile()) select(messages[0].id, { keepUnread: true });
render();
