/* ============================================================
   LENIS ZOOM PORTAL — Lenis + GSAP ScrollTrigger
   A pinned hero where a small framed scene scales by exactly
   the factor needed to swallow the viewport.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!prefersReduced && typeof Lenis !== "undefined") {
  lenis = new Lenis({ duration: 1.25, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Cover-scale math ----------
   offsetWidth/offsetHeight ignore transforms, so this is safe
   to read even while the portal is mid-scale. The 1.12 margin
   pushes the rounded corners past the viewport edges.        */
function coverScale() {
  const el = document.getElementById("portal");
  return Math.max(window.innerWidth / el.offsetWidth, window.innerHeight / el.offsetHeight) * 1.12;
}

/* ---------- Pinned zoom sequence ---------- */
if (!prefersReduced) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=170%",
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  /* fromTo everywhere: explicit start values keep the scrub timeline
     honest even if the user scrolls while the entrance is still playing */
  tl.fromTo(
    ".hero-title .word",
    { yPercent: 0, opacity: 1 },
    { yPercent: -130, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power2.in", immediateRender: false },
    0
  )
    .fromTo(".hero-sub", { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, 0)
    .fromTo(
      "#portal",
      { scale: 1, borderRadius: 26 },
      { scale: () => coverScale(), borderRadius: 2, duration: 1.3, ease: "power2.inOut", immediateRender: false },
      0.15
    )
    .fromTo(".portal-frame", { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, 0.55)
    .fromTo(
      "#enterLine",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      1.2
    );

  /* ---------- Chapter reveals ---------- */
  gsap.utils.toArray(".chapter").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 70 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 80%" },
      }
    );
  });

  /* ---------- Parallax orbs ---------- */
  gsap.utils.toArray(".orb").forEach((orb) => {
    gsap.to(orb, {
      yPercent: parseFloat(orb.dataset.speed) * 140,
      ease: "none",
      scrollTrigger: {
        trigger: ".inside",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  /* ---------- Hero entrance ---------- */
  gsap.from(".hero-title .word", {
    yPercent: 110,
    opacity: 0,
    stagger: 0.09,
    duration: 1,
    ease: "power4.out",
    delay: 0.15,
  });
  // animate the wrapper, not #portal itself — the scrub timeline owns #portal's scale
  gsap.from(".portal-wrap", { scale: 0.86, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.4 });
  gsap.from(".hero-sub", { opacity: 0, duration: 0.8, delay: 0.9 });
}

/* ---------- Return to top ---------- */
document.getElementById("returnBtn").addEventListener("click", () => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.6 });
  } else {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }
});
