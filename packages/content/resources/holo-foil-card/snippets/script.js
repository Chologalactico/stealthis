/* ============================================================
   HOLOGRAPHIC FOIL TRADING CARD — Three.js + custom GLSL + GSAP
   Card art painted on a CanvasTexture; a foil shader layers
   tilt-reactive rainbow bands, sparkles and edge shine on top.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Card face painted with the 2D canvas API ---------- */
function roundedPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeFrontTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 716;
  const ctx = c.getContext("2d");

  // base
  const bg = ctx.createLinearGradient(0, 0, 0, 716);
  bg.addColorStop(0, "#101433");
  bg.addColorStop(0.55, "#1b1040");
  bg.addColorStop(1, "#0a0820");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 716);

  // gold frame
  ctx.strokeStyle = "#d9b45c";
  ctx.lineWidth = 6;
  roundedPath(ctx, 14, 14, 484, 688, 22);
  ctx.stroke();
  ctx.strokeStyle = "rgba(217, 180, 92, 0.35)";
  ctx.lineWidth = 2;
  roundedPath(ctx, 26, 26, 460, 664, 16);
  ctx.stroke();

  // art window
  roundedPath(ctx, 44, 118, 424, 330, 12);
  const art = ctx.createLinearGradient(44, 118, 468, 448);
  art.addColorStop(0, "#241a52");
  art.addColorStop(1, "#0d1030");
  ctx.fillStyle = art;
  ctx.fill();
  ctx.strokeStyle = "#d9b45c";
  ctx.lineWidth = 3;
  ctx.stroke();

  // prism emblem — stacked rotated triangles + core
  ctx.save();
  ctx.translate(256, 283);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.lineTo(102, 60);
    ctx.lineTo(-102, 60);
    ctx.closePath();
    ctx.strokeStyle = `rgba(160, 140, 255, ${0.55 - i * 0.14})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  const core = ctx.createRadialGradient(0, 0, 4, 0, 0, 66);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.35, "#9f8cff");
  core.addColorStop(1, "rgba(159, 140, 255, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // title
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2ead2";
  ctx.font = "700 52px Cinzel, serif";
  ctx.fillText("AURELION", 256, 88);
  ctx.fillStyle = "rgba(242, 234, 210, 0.6)";
  ctx.font = "400 20px Inter, sans-serif";
  ctx.fillText("— PRISMATIC DRAKE —", 256, 490);

  // stat bars
  const stats = [
    ["POWER", 0.9],
    ["ARCANA", 0.75],
    ["VELOCITY", 0.6],
  ];
  stats.forEach(([label, v], i) => {
    const y = 530 + i * 46;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(242, 234, 210, 0.75)";
    ctx.font = "500 15px Inter, sans-serif";
    ctx.fillText(label, 56, y + 5);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundedPath(ctx, 170, y - 8, 286, 14, 7);
    ctx.fill();
    const bar = ctx.createLinearGradient(170, 0, 456, 0);
    bar.addColorStop(0, "#9f8cff");
    bar.addColorStop(1, "#e8c56a");
    ctx.fillStyle = bar;
    roundedPath(ctx, 170, y - 8, 286 * v, 14, 7);
    ctx.fill();
  });

  // serial
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(217, 180, 92, 0.85)";
  ctx.font = "500 16px Inter, sans-serif";
  ctx.fillText("No. 001 / 077  ★  SECRET RARE", 256, 682);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function makeBackTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 716;
  const ctx = c.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 512, 716);
  bg.addColorStop(0, "#160f38");
  bg.addColorStop(1, "#0a0722");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 716);

  // diamond lattice
  ctx.strokeStyle = "rgba(159, 140, 255, 0.16)";
  ctx.lineWidth = 1.5;
  for (let x = -716; x < 1228; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 716, 716);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 716, 0);
    ctx.lineTo(x, 716);
    ctx.stroke();
  }

  ctx.strokeStyle = "#d9b45c";
  ctx.lineWidth = 6;
  roundedPath(ctx, 14, 14, 484, 688, 22);
  ctx.stroke();

  // center sigil
  ctx.save();
  ctx.translate(256, 358);
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.strokeStyle = "#d9b45c";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#e8c56a";
  ctx.textAlign = "center";
  ctx.font = "700 44px Cinzel, serif";
  ctx.fillText("S", 0, 16);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

/* ---------- Scene ---------- */
const canvas = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
camera.position.set(0, 0, 6.4);

const cardGroup = new THREE.Group();
scene.add(cardGroup);

/* ---------- Foil shader (front face) ---------- */
const foilUniforms = {
  uMap: { value: makeFrontTexture() },
  uTime: { value: 0 },
  uTilt: { value: new THREE.Vector2(0, 0) },
  uHover: { value: 0 },
};

const foilMaterial = new THREE.ShaderMaterial({
  uniforms: foilUniforms,
  transparent: true,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uMap;
    uniform float uTime;
    uniform vec2 uTilt;
    uniform float uHover;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec3 hue2rgb(float h) {
      return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    }

    // signed distance to a rounded rectangle in uv space
    float roundedMask(vec2 uv) {
      vec2 p = (uv - 0.5) * vec2(2.5, 3.5); // card world size
      vec2 b = vec2(1.25, 1.75) - 0.09;     // half-size minus corner radius
      vec2 d = abs(p) - b;
      float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.09;
      return 1.0 - smoothstep(-0.005, 0.012, dist);
    }

    void main() {
      float mask = roundedMask(vUv);
      if (mask <= 0.0) discard;

      vec3 base = texture2D(uMap, vUv).rgb;

      // --- iridescent interference bands, phase driven by tilt ---
      float diag = vUv.x + vUv.y * 0.85;
      float phase = diag * 7.0 + uTilt.x * 5.0 - uTilt.y * 3.5 + uTime * 0.12;
      float band = sin(phase * 3.14159) * 0.5 + 0.5;
      vec3 rainbow = hue2rgb(fract(diag * 0.5 + uTilt.x * 0.35 + uTilt.y * 0.2));
      float lum = dot(base, vec3(0.299, 0.587, 0.114));
      float foilAmt = pow(band, 2.5) * (0.16 + uHover * 0.30) * (0.35 + lum);

      // --- sparkle glints that live in a hash-noise cell grid ---
      vec2 cell = floor(vUv * vec2(110.0, 154.0));
      float n = hash(cell);
      float tw = fract(n * 9.31 + uTime * 0.22 + (uTilt.x + uTilt.y) * 0.9);
      float sparkle = smoothstep(0.965, 1.0, tw) * step(0.62, n) * (0.5 + uHover * 0.6);

      // --- soft edge shine following the tilt direction ---
      vec2 centered = vUv - 0.5;
      float edge = smoothstep(0.30, 0.5, length(centered * vec2(1.0, 1.35)));
      float shine = edge * max(0.0, dot(normalize(centered + 0.0001), normalize(uTilt + vec2(0.0001)))) * 0.35;

      vec3 color = base + rainbow * foilAmt + vec3(1.0, 0.98, 0.92) * sparkle + rainbow * shine;
      gl_FragColor = vec4(color, mask);
    }
  `,
});

const CARD_W = 2.5;
const CARD_H = 3.5;

const front = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W, CARD_H), foilMaterial);
cardGroup.add(front);

const back = new THREE.Mesh(
  new THREE.PlaneGeometry(CARD_W, CARD_H),
  new THREE.MeshBasicMaterial({ map: makeBackTexture() })
);
back.rotation.y = Math.PI;
back.position.z = -0.012;
cardGroup.add(back);

/* ---------- Pointer tilt ---------- */
const tiltTarget = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  if (prefersReduced) return;
  tiltTarget.y = (e.clientX / window.innerWidth - 0.5) * 0.85;
  tiltTarget.x = (e.clientY / window.innerHeight - 0.5) * 0.6;
});

/* ---------- Flip on click ---------- */
let flipping = false;
canvas.addEventListener("click", () => {
  if (flipping) return;
  flipping = true;
  gsap.to(cardGroup.rotation, {
    y: cardGroup.rotation.y + Math.PI,
    duration: prefersReduced ? 0 : 0.9,
    ease: "power3.inOut",
    onComplete: () => (flipping = false),
  });
});

/* ---------- Entrance ---------- */
let entrancePlaying = false;
if (!prefersReduced) {
  entrancePlaying = true;
  cardGroup.position.y = -5;
  cardGroup.rotation.y = Math.PI * 2;
  gsap.to(cardGroup.position, { y: 0, duration: 1.5, ease: "power4.out", delay: 0.15 });
  gsap.to(cardGroup.rotation, {
    y: 0,
    duration: 1.5,
    ease: "power4.out",
    delay: 0.15,
    onComplete: () => (entrancePlaying = false),
  });
  gsap.fromTo(".hud", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, delay: 0.8 });
  gsap.to(foilUniforms.uHover, { value: 1, duration: 1.2, delay: 1.1 });
} else {
  foilUniforms.uHover.value = 0.7;
}

/* ---------- Resize ---------- */
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  // keep the card comfortably framed on narrow screens
  camera.position.z = w < 560 ? 8.2 : 6.4;
}
window.addEventListener("resize", resize);
resize();

/* ---------- Render loop ---------- */
const clock = new THREE.Clock();
const baseRotation = new THREE.Vector2(0, 0);

function render() {
  const t = clock.getElapsedTime();
  foilUniforms.uTime.value = t;

  // lerped tilt + idle float (paused while GSAP owns the transform)
  baseRotation.x += (tiltTarget.x - baseRotation.x) * 0.06;
  baseRotation.y += (tiltTarget.y - baseRotation.y) * 0.06;
  if (!entrancePlaying) {
    cardGroup.rotation.x = baseRotation.x + (prefersReduced ? 0 : Math.sin(t * 0.7) * 0.03);
    if (!flipping) {
      const spins = Math.round(cardGroup.rotation.y / Math.PI) * Math.PI;
      cardGroup.rotation.y = spins + baseRotation.y + (prefersReduced ? 0 : Math.sin(t * 0.5) * 0.04);
    }
    cardGroup.position.y = prefersReduced ? 0 : Math.sin(t * 0.9) * 0.06;
  }

  foilUniforms.uTilt.value.set(baseRotation.y, baseRotation.x);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
