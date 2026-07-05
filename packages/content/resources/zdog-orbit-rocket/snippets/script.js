/* ============================================================
   ZDOG ORBIT ROCKET — pseudo-3D designer-toy space scene
   ~20 primitives, nested orbit anchors, drag-to-spin.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TAU = Zdog.TAU;

const COLORS = {
  planet: "#ff8f6b",
  spot: "#f0704f",
  ring: "#ffe4b8",
  hull: "#fff6ec",
  accent: "#ff5c77",
  flame: "#ffb454",
  moon: "#cfd8ff",
  star: "#ffe9a8",
};

let isDragging = false;

const illo = new Zdog.Illustration({
  element: "#zdog-canvas",
  zoom: 1.5,
  rotate: { x: -0.32, y: 0.5 },
  dragRotate: true,
  onDragStart() {
    isDragging = true;
  },
  onDragEnd() {
    isDragging = false;
  },
  onDragMove() {
    if (prefersReduced) illo.updateRenderGraph(); // re-render on demand when orbits are frozen
  },
});

/* ---------- System (tilted so the ring reads as 3D) ---------- */
const system = new Zdog.Anchor({ addTo: illo, rotate: { x: 0.28 } });

/* Planet: one fat-stroked point */
const planetSpin = new Zdog.Anchor({ addTo: system });
new Zdog.Shape({ addTo: planetSpin, stroke: 112, color: COLORS.planet });

/* Surface spots hug the sphere via rotated anchors */
[
  { x: 0.5, y: 0.4, d: 22 },
  { x: -0.4, y: 1.4, d: 14 },
  { x: 0.9, y: 2.6, d: 18 },
  { x: -1.1, y: -0.9, d: 12 },
].forEach(({ x, y, d }) => {
  const holder = new Zdog.Anchor({ addTo: planetSpin, rotate: { x, y } });
  new Zdog.Ellipse({
    addTo: holder,
    diameter: d,
    stroke: 4,
    fill: true,
    color: COLORS.spot,
    translate: { z: 56 },
  });
});

/* Ring */
new Zdog.Ellipse({
  addTo: system,
  diameter: 236,
  stroke: 6,
  color: COLORS.ring,
});

/* ---------- Rocket on an orbiting anchor ---------- */
const orbit = new Zdog.Anchor({ addTo: system });

/* rocket is built along +z, then rotated so the nose points along
   its direction of travel (tangent to the orbit) */
const rocket = new Zdog.Anchor({
  addTo: orbit,
  translate: { x: 118 },
  rotate: { x: -TAU / 4 },
});

new Zdog.Cylinder({
  addTo: rocket,
  diameter: 20,
  length: 30,
  stroke: false,
  color: COLORS.hull,
  frontFace: COLORS.hull,
  backface: COLORS.accent,
});

new Zdog.Cone({
  addTo: rocket,
  diameter: 20,
  length: 16,
  translate: { z: 15 },
  stroke: false,
  color: COLORS.accent,
  backface: COLORS.accent,
});

/* stripe */
new Zdog.Ellipse({
  addTo: rocket,
  diameter: 21,
  stroke: 4,
  color: COLORS.accent,
  translate: { z: 8 },
});

/* three radial fins */
for (let i = 0; i < 3; i++) {
  new Zdog.Shape({
    addTo: rocket,
    path: [
      { x: 10, z: -6 },
      { x: 21, z: -18 },
      { x: 10, z: -16 },
    ],
    closed: true,
    fill: true,
    stroke: 4,
    color: COLORS.accent,
    rotate: { z: (i * TAU) / 3 },
  });
}

/* flame (rendered scale is animated each frame) */
const flame = new Zdog.Cone({
  addTo: rocket,
  diameter: 13,
  length: 20,
  translate: { z: -17 },
  rotate: { y: TAU / 2 },
  stroke: false,
  color: COLORS.flame,
  backface: COLORS.flame,
});

/* ---------- Moon on a counter-orbit ---------- */
const moonOrbit = new Zdog.Anchor({ addTo: system, rotate: { x: 0.5 } });
new Zdog.Shape({
  addTo: moonOrbit,
  translate: { x: 168 },
  stroke: 20,
  color: COLORS.moon,
});

/* ---------- Stars scattered on a far shell ---------- */
for (let i = 0; i < 26; i++) {
  const holder = new Zdog.Anchor({
    addTo: illo,
    rotate: { x: Math.random() * TAU, y: Math.random() * TAU, z: Math.random() * TAU },
  });
  new Zdog.Shape({
    addTo: holder,
    translate: { z: 200 + Math.random() * 40 },
    stroke: 1.5 + Math.random() * 2.5,
    color: COLORS.star,
  });
}

/* ---------- Animate ---------- */
let t = 0;

function animate() {
  t += 1 / 60;
  if (!isDragging) illo.rotate.y += 0.0035;
  orbit.rotate.z += 0.016;
  moonOrbit.rotate.z -= 0.007;
  planetSpin.rotate.y += 0.004;
  flame.scale = 0.8 + Math.sin(t * 14) * 0.25;
  illo.updateRenderGraph();
  requestAnimationFrame(animate);
}

if (prefersReduced) {
  /* single static render; onDragMove re-renders while spinning */
  orbit.rotate.z = 0.9;
  moonOrbit.rotate.z = -2.1;
  illo.updateRenderGraph();
} else {
  animate();
}
