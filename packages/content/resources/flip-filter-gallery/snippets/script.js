/* ============================================================
   FLIP FILTER GALLERY — GSAP Flip
   Record layout → mutate the DOM → animate from the old state.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.registerPlugin(Flip);

const grid = document.getElementById("grid");
const cards = gsap.utils.toArray(".card");
const filterButtons = gsap.utils.toArray(".filter");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");
const layoutToggle = document.getElementById("layoutToggle");

const DUR = prefersReduced ? 0 : 0.65;

/* ---------- Filtering ---------- */
function applyFilter(cat) {
  const state = Flip.getState(cards);

  let shown = 0;
  cards.forEach((card) => {
    const match = cat === "all" || card.dataset.cat === cat;
    card.classList.toggle("is-hidden", !match);
    if (match) shown++;
  });

  countEl.textContent = `${shown} project${shown === 1 ? "" : "s"}`;
  emptyEl.hidden = shown !== 0;

  Flip.from(state, {
    duration: DUR,
    ease: "power3.inOut",
    stagger: 0.028,
    absolute: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { opacity: 0, scale: 0.82 },
        { opacity: 1, scale: 1, duration: DUR * 0.85, ease: "power3.out" }
      ),
    onLeave: (els) =>
      gsap.to(els, { opacity: 0, scale: 0.82, duration: DUR * 0.55, ease: "power2.in" }),
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("is-active")) return;
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilter(btn.dataset.cat);
  });
});

/* ---------- Grid ↔ list toggle ---------- */
layoutToggle.addEventListener("click", () => {
  const state = Flip.getState(cards, { props: "borderRadius" });

  const isList = grid.classList.toggle("list");
  layoutToggle.setAttribute("aria-pressed", String(isList));
  layoutToggle.querySelector(".lt-label").textContent = isList ? "Grid view" : "List view";

  Flip.from(state, {
    duration: DUR,
    ease: "power3.inOut",
    stagger: 0.02,
    absolute: true,
    nested: true,
  });
});

/* ---------- Entrance ---------- */
if (!prefersReduced) {
  gsap.from(cards, {
    opacity: 0,
    y: 34,
    duration: 0.7,
    ease: "power3.out",
    stagger: 0.045,
    clearProps: "all", // leave no inline transforms behind for Flip to fight with
  });
  gsap.from(".head", { opacity: 0, y: -16, duration: 0.6, ease: "power2.out" });
}
