/* ============================================================
   DNA HELIX SCROLL — Three.js + Lenis + GSAP ScrollTrigger
   A double helix of instanced spheres that spins, unwinds,
   splits and recombines as the page scrolls.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!prefersReduced && typeof Lenis !== "undefined") {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Renderer / scene ---------- */
const canvas = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.042);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 0, 13);

const helixGroup = new THREE.Group();
scene.add(helixGroup);

/* ---------- Helix parameters (tweened by scroll) ---------- */
const POINTS = 110;   // spheres per strand
const HEIGHT = 16;    // world-space height of the helix
const RUNG_EVERY = 4; // one base-pair rung every N points

const params = {
  twist: 3.2,      // full turns across the helix
  radius: 1.6,     // backbone radius
  separation: 0,   // 0 = paired, 1 = fully split strands
  hue: 0.52,       // base hue (cyan)
  spin: 0,         // extra rotation driven by scroll
};

const strands = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.1, 12, 12),
  new THREE.MeshBasicMaterial(),
  POINTS * 2
);
helixGroup.add(strands);

const RUNGS = Math.floor(POINTS / RUNG_EVERY);
const rungMat = new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.35 });
const rungs = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.024, 0.024, 1, 6, 1, true),
  rungMat,
  RUNGS
);
helixGroup.add(rungs);

/* Ambient drifting particles */
const starCount = 320;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3 + 0] = (Math.random() - 0.5) * 44;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 34;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0x8899ff, size: 0.055, transparent: true, opacity: 0.55 })
);
scene.add(stars);

/* ---------- Per-frame helix layout ---------- */
const dummy = new THREE.Object3D();
const colA = new THREE.Color();
const colB = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const dir = new THREE.Vector3();
const mid = new THREE.Vector3();
const quat = new THREE.Quaternion();

function strandPos(i, phase, out) {
  const t = i / (POINTS - 1);
  const y = (t - 0.5) * HEIGHT;
  const angle = t * Math.PI * 2 * params.twist + phase + params.spin;
  const split = params.separation * 1.9 * (phase === 0 ? -1 : 1);
  out.set(Math.cos(angle) * params.radius + split, y, Math.sin(angle) * params.radius);
  return out;
}

function updateHelix(time) {
  colA.setHSL(params.hue, 0.85, 0.62);
  colB.setHSL((params.hue + 0.12) % 1, 0.85, 0.52);

  dummy.quaternion.identity();
  for (let i = 0; i < POINTS; i++) {
    const pulse = 1 + Math.sin(time * 2 + i * 0.35) * 0.12;

    strandPos(i, 0, vA);
    dummy.position.copy(vA);
    dummy.scale.setScalar(pulse);
    dummy.updateMatrix();
    strands.setMatrixAt(i, dummy.matrix);
    strands.setColorAt(i, colA);

    strandPos(i, Math.PI, vB);
    dummy.position.copy(vB);
    dummy.scale.setScalar(pulse);
    dummy.updateMatrix();
    strands.setMatrixAt(POINTS + i, dummy.matrix);
    strands.setColorAt(POINTS + i, colB);
  }
  strands.instanceMatrix.needsUpdate = true;
  if (strands.instanceColor) strands.instanceColor.needsUpdate = true;

  for (let r = 0; r < RUNGS; r++) {
    const i = Math.min(r * RUNG_EVERY, POINTS - 1);
    strandPos(i, 0, vA);
    strandPos(i, Math.PI, vB);
    dir.subVectors(vB, vA);
    const len = Math.max(dir.length(), 0.001);
    mid.addVectors(vA, vB).multiplyScalar(0.5);
    quat.setFromUnitVectors(UP, dir.normalize());
    dummy.position.copy(mid);
    dummy.quaternion.copy(quat);
    dummy.scale.set(1, len, 1);
    dummy.updateMatrix();
    rungs.setMatrixAt(r, dummy.matrix);
  }
  dummy.quaternion.identity();
  rungs.instanceMatrix.needsUpdate = true;
  rungMat.opacity = 0.38 * (1 - params.separation);
}

/* ---------- Scroll choreography ---------- */
if (!prefersReduced) {
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: "#story",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
    },
  });

  // continuous rotation across the whole story
  tl.to(params, { spin: Math.PI * 3, duration: 3 }, 0);

  // chapter 01 → 02 : unwind
  tl.to(params, { twist: 0.9, radius: 2.6, hue: 0.72, duration: 1, ease: "power1.inOut" }, 0);
  // chapter 02 → 03 : split
  tl.to(params, { separation: 1, hue: 0.88, duration: 1, ease: "power1.inOut" }, 1);
  // chapter 03 → 04 : recombine
  tl.to(params, { separation: 0, twist: 4.2, radius: 1.35, hue: 0.36, duration: 1, ease: "power2.inOut" }, 2);

  // panel reveals
  gsap.utils.toArray(".panel-inner").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 78%" },
      }
    );
  });

  // hide the hint once the user commits
  gsap.to("#scrollHint", {
    opacity: 0,
    scrollTrigger: { trigger: "#story", start: "top top-=1", end: "+=300", scrub: true },
  });
}

/* ---------- Pointer parallax ---------- */
let pointerX = 0;
let pointerY = 0;
window.addEventListener("pointermove", (e) => {
  pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ---------- Resize ---------- */
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener("resize", resize);
resize();

/* ---------- Render loop ---------- */
const clock = new THREE.Clock();

function render() {
  const t = prefersReduced ? 0 : clock.getElapsedTime();

  updateHelix(t);
  helixGroup.rotation.y = prefersReduced ? 0.5 : t * 0.07;
  stars.rotation.y = t * 0.012;

  camera.position.x += (pointerX * 1.2 - camera.position.x) * 0.045;
  camera.position.y += (-pointerY * 0.8 - camera.position.y) * 0.045;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
