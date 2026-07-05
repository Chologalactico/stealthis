/* ============================================================
   PHYSICS TAG PLAYGROUND — Matter.js
   Real DOM pills driven by rigid bodies. The engine owns the
   transforms; rAF copies them back onto the elements.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const arena = document.getElementById("arena");
const pills = Array.from(arena.querySelectorAll(".pill"));
const gravityBtn = document.getElementById("gravityBtn");
const shakeBtn = document.getElementById("shakeBtn");

/* Reduced motion: keep the calm flex layout, disable the toys */
if (prefersReduced) {
  gravityBtn.disabled = true;
  shakeBtn.disabled = true;
} else {
  initPhysics();
}

function initPhysics() {
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;

  /* Measure pills while they are still in flex layout */
  const sizes = pills.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));

  arena.classList.add("is-live");
  let bounds = arena.getBoundingClientRect();

  const engine = Engine.create();
  engine.gravity.y = 1;

  /* ---------- Bodies from measured pills ---------- */
  const bodies = pills.map((el, i) => {
    const { w, h } = sizes[i];
    const x = 40 + Math.random() * Math.max(bounds.width - 80, 80);
    const y = -60 - (i % 8) * 50 - Math.random() * 30; // staggered drop-in, never above the spawn ceiling
    const body = Bodies.rectangle(x, y, w, h, {
      restitution: 0.4,
      friction: 0.3,
      frictionAir: 0.012,
      chamfer: { radius: Math.min(h / 2, 24) },
      angle: (Math.random() - 0.5) * 0.6,
    });
    body.plugin = { el, w, h };
    return body;
  });
  Composite.add(engine.world, bodies);

  /* ---------- Walls (all four sides so nothing escapes) ----------
     The ceiling starts high so pills can drop in from above, then
     lowers to the arena's top edge once everything has landed —
     otherwise a gravity flip would pile the tags off-screen.      */
  const WALL = 240;
  let ceilingLowered = false;
  let walls = [];
  function buildWalls() {
    walls.forEach((w) => Composite.remove(engine.world, w));
    const bw = bounds.width;
    const bh = bounds.height;
    const ceilingY = ceilingLowered ? -WALL / 2 : -Math.max(bh, 620) - WALL / 2;
    walls = [
      Bodies.rectangle(bw / 2, bh + WALL / 2, bw + WALL * 2, WALL, { isStatic: true }), // floor
      Bodies.rectangle(bw / 2, ceilingY, bw + WALL * 2, WALL, { isStatic: true }), // ceiling
      Bodies.rectangle(-WALL / 2, 0, WALL, bh * 6, { isStatic: true }), // left
      Bodies.rectangle(bw + WALL / 2, 0, WALL, bh * 6, { isStatic: true }), // right
    ];
    Composite.add(engine.world, walls);
  }
  buildWalls();

  setTimeout(() => {
    ceilingLowered = true;
    buildWalls();
  }, 3000);

  /* ---------- Grab & throw ---------- */
  const mouse = Mouse.create(arena);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.18, damping: 0.08 },
  });
  Composite.add(engine.world, mouseConstraint);

  /* ---------- Controls ---------- */
  gravityBtn.addEventListener("click", () => {
    engine.gravity.y *= -1;
    gravityBtn.textContent = engine.gravity.y < 0 ? "Restore gravity" : "Flip gravity";
  });

  shakeBtn.addEventListener("click", () => {
    bodies.forEach((body) => {
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 22,
        y: -engine.gravity.y * (6 + Math.random() * 14),
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
    });
  });

  /* ---------- Resize ---------- */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      bounds = arena.getBoundingClientRect();
      buildWalls();
      // clamp strays back inside the new bounds
      bodies.forEach((body) => {
        const x = Math.min(Math.max(body.position.x, 40), bounds.width - 40);
        const y = Math.min(body.position.y, bounds.height - 40);
        Body.setPosition(body, { x, y });
      });
    }, 150);
  });

  /* ---------- Step + DOM sync ---------- */
  function tick() {
    Engine.update(engine, 1000 / 60);
    for (const body of bodies) {
      const { el, w, h } = body.plugin;
      el.style.transform =
        `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) ` +
        `rotate(${body.angle}rad)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
