/* ============================================================
   LIQUID GLASS TAB BAR — jelly pill + minimize on scroll
   The glass itself is pure CSS layers; JS moves the pill,
   themes the page per tab and drives the scroll behavior.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const screen = document.getElementById("screen");
const feed = document.getElementById("feed");
const feedTitle = document.getElementById("feedTitle");
const tabbar = document.getElementById("tabbar");
const pill = document.getElementById("pill");
const tabs = Array.from(document.querySelectorAll(".tab"));

/* ---------- Demo feed cards (vibrant, so the glass has something to refract) ---------- */
const cardsHost = document.getElementById("cards");
const CARD_SEEDS = [
  ["Morning mix", "Six new drops picked for you"],
  ["Glass, explained", "Why lensing sells the material"],
  ["Weekend build", "A tab bar in four layers"],
  ["Now trending", "Squash and stretch is back"],
  ["Deep focus", "90 minutes, zero notifications"],
  ["Colour lab", "Hue-shifting ambient scenes"],
  ["Night shift", "Late replies, soft launches"],
  ["Archive", "Everything you saved in June"],
];

CARD_SEEDS.forEach(([title, sub], i) => {
  const card = document.createElement("article");
  card.className = "card";
  const hue = (i * 47 + 190) % 360;
  card.style.background =
    `linear-gradient(135deg, hsl(${hue} 75% 45% / 0.85), hsl(${(hue + 50) % 360} 80% 38% / 0.85))`;
  card.innerHTML = `<strong>${title}</strong><span>${sub}</span>`;
  cardsHost.appendChild(card);
});

/* ---------- Jelly pill ---------- */
function movePill(tab, animate = true) {
  pill.style.left = `${tab.offsetLeft}px`;
  pill.style.width = `${tab.offsetWidth}px`;
  if (animate && !prefersReduced) {
    pill.classList.remove("stretch");
    void pill.offsetWidth; // restart the squash animation
    pill.classList.add("stretch");
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("is-active");
      t.removeAttribute("aria-current");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-current", "page");

    movePill(tab);
    feedTitle.textContent = tab.dataset.title;
    screen.style.setProperty("--hue", tab.dataset.hue);
    feed.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });
});

/* position the pill under the initial tab, and re-seat on resize */
movePill(tabs[0], false);
window.addEventListener("resize", () => {
  movePill(document.querySelector(".tab.is-active"), false);
});

/* ---------- Minimize on scroll (iOS 26 behavior) ---------- */
let lastY = 0;

feed.addEventListener(
  "scroll",
  () => {
    const y = feed.scrollTop;
    const goingDown = y > lastY;
    if (goingDown && y > 90) {
      tabbar.classList.add("mini");
    } else if (!goingDown || y <= 90) {
      tabbar.classList.remove("mini");
    }
    lastY = y;
    // pill geometry changes when labels collapse
    requestAnimationFrame(() => movePill(document.querySelector(".tab.is-active"), false));
  },
  { passive: true }
);
