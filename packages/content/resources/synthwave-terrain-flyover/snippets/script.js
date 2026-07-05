/* ============================================================
   SYNTHWAVE TERRAIN FLYOVER — Three.js + GSAP
   A single subdivided plane re-sampled every frame from a
   scrolling value-noise field. No assets, no geometry swaps.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Value noise ---------- */
function hash2(ix, iz) {
  const s = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z) {
  return valueNoise(x, z) * 0.65 + valueNoise(x * 2.1, z * 2.1) * 0.35;
}

function smoothstep(e0, e1, v) {
  const t = Math.min(Math.max((v - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
}

/* valley mask keeps a flat road under the camera */
function heightAt(x, worldZ) {
  const n = fbm(x * 0.055, worldZ * 0.055);
  const ridge = Math.pow(n, 1.6) * 15;
  return ridge * smoothstep(3.2, 14, Math.abs(x));
}

/* ---------- Scene ---------- */
const canvas = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0d0221);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d0221, 26, 92);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
camera.position.set(0, 3.4, 42);

/* ---------- Terrain: fill + wireframe sharing one geometry ---------- */
const geo = new THREE.PlaneGeometry(64, 96, 100, 68);

const fillMat = new THREE.MeshBasicMaterial({
  color: 0x08031a,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const wireMat = new THREE.MeshBasicMaterial({ color: 0xff2ea6, wireframe: true });

const fillMesh = new THREE.Mesh(geo, fillMat);
const wireMesh = new THREE.Mesh(geo, wireMat);
fillMesh.rotation.x = -Math.PI / 2;
wireMesh.rotation.x = -Math.PI / 2;
scene.add(fillMesh, wireMesh);

/* local plane coords: x stays x, local y maps to world -z, local z maps to world +y */
const positions = geo.attributes.position;
function updateTerrain(offset) {
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const worldZ = -positions.getY(i);
    positions.setZ(i, heightAt(x, worldZ - offset));
  }
  positions.needsUpdate = true;
}

/* ---------- Striped retro sun ---------- */
function makeSunTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 40, 0, 472);
  g.addColorStop(0, "#ffd319");
  g.addColorStop(0.55, "#ff8a2a");
  g.addColorStop(1, "#ff2975");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 256, 216, 0, Math.PI * 2);
  ctx.fill();

  // horizontal cut stripes, thicker toward the bottom
  ctx.globalCompositeOperation = "destination-out";
  let y = 276;
  let gap = 6;
  while (y < 480) {
    ctx.fillRect(0, y, 512, gap);
    y += gap + 26;
    gap += 5;
  }
  return new THREE.CanvasTexture(c);
}

const sun = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 38),
  new THREE.MeshBasicMaterial({ map: makeSunTexture(), transparent: true, fog: false })
);
sun.position.set(0, 11, -82);
scene.add(sun);

/* ---------- Stars ---------- */
const STAR_COUNT = 380;
const starPos = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  starPos[i * 3 + 0] = (Math.random() - 0.5) * 200;
  starPos[i * 3 + 1] = 6 + Math.random() * 70;
  starPos[i * 3 + 2] = -60 - Math.random() * 120;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xcdd6ff, size: 0.5, fog: false, transparent: true, opacity: 0.8 })
);
scene.add(stars);

/* ---------- Flight state ---------- */
const flight = { speed: prefersReduced ? 0 : 16 };
let offset = 0;
let boosting = false;

const speedReadout = document.getElementById("speedReadout");
const boostBtn = document.getElementById("boostBtn");

boostBtn.addEventListener("click", () => {
  if (boosting || prefersReduced) return;
  boosting = true;
  boostBtn.disabled = true;

  const cyan = new THREE.Color(0x37e2ff);
  const magenta = new THREE.Color(0xff2ea6);

  gsap
    .timeline({
      onComplete: () => {
        boosting = false;
        boostBtn.disabled = false;
      },
    })
    .to(flight, { speed: 54, duration: 0.7, ease: "power3.out" }, 0)
    .to(camera, { fov: 76, duration: 0.7, ease: "power3.out", onUpdate: () => camera.updateProjectionMatrix() }, 0)
    .to(wireMat.color, { r: cyan.r, g: cyan.g, b: cyan.b, duration: 0.5 }, 0)
    .to(flight, { speed: 16, duration: 1.4, ease: "power2.inOut" }, 1.6)
    .to(camera, { fov: 58, duration: 1.4, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix() }, 1.6)
    .to(wireMat.color, { r: magenta.r, g: magenta.g, b: magenta.b, duration: 1.2 }, 1.6);
});

/* ---------- Pointer banking ---------- */
let pointerX = 0;
window.addEventListener("pointermove", (e) => {
  pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
});

/* ---------- Intro ---------- */
if (!prefersReduced) {
  camera.position.set(0, 26, 64);
  gsap.to(camera.position, { y: 3.4, z: 42, duration: 2.6, ease: "power3.inOut" });
  gsap.fromTo(".hud", { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 1.4, stagger: 0.2 });
}

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
let smoothX = 0;

function render() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  offset += flight.speed * dt;
  updateTerrain(offset);

  smoothX += (pointerX - smoothX) * 0.04;
  camera.position.x = smoothX * 5;
  camera.lookAt(smoothX * 2.4, 4.2, -34);
  camera.rotation.z = -smoothX * 0.09;

  sun.position.y = 11 + Math.sin(t * 0.3) * 0.4;
  speedReadout.textContent = String(Math.round(flight.speed * 8));

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
