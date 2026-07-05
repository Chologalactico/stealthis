/* ============================================================
   FABRIC.JS STICKER STUDIO — a tiny design tool
   Fabric supplies selection, transform handles and stacking;
   this file only builds sticker objects and the toolbar.
   ============================================================ */

const PALETTE = ["#ff5c77", "#ffb454", "#5eead4", "#7c9cff", "#c084fc", "#f2f2ef"];
let colorIndex = 0;
function nextColor() {
  return PALETTE[colorIndex++ % PALETTE.length];
}

/* ---------- Canvas ---------- */
const board = document.getElementById("board");
const canvas = new fabric.Canvas("c", {
  preserveObjectStacking: true,
  selection: true,
});

/* selection handle styling */
fabric.Object.prototype.set({
  transparentCorners: false,
  cornerStyle: "circle",
  cornerColor: "#ffffff",
  cornerStrokeColor: "#c084fc",
  borderColor: "#c084fc",
  cornerSize: 10,
  padding: 4,
});

/* gradient backdrop (included in the PNG export) */
const backdrop = new fabric.Rect({ left: 0, top: 0, selectable: false, evented: false });
canvas.add(backdrop);

function fitCanvas() {
  const w = board.clientWidth;
  const h = board.clientHeight;
  canvas.setDimensions({ width: w, height: h });
  backdrop.set({
    width: w,
    height: h,
    fill: new fabric.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: w, y2: h },
      colorStops: [
        { offset: 0, color: "#241344" },
        { offset: 0.55, color: "#3d1257" },
        { offset: 1, color: "#611c53" },
      ],
    }),
  });
  canvas.sendToBack(backdrop);
  canvas.requestRenderAll();
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

/* ---------- Sticker anatomy ---------- */
function stickerOpts(fill) {
  return {
    fill,
    stroke: "#ffffff",
    strokeWidth: 7,
    strokeLineJoin: "round",
    paintFirst: "stroke", // fat outline behind the fill = die-cut vinyl
    shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.4)", blur: 16, offsetX: 0, offsetY: 8 }),
    left: canvas.getWidth() * (0.25 + Math.random() * 0.5),
    top: canvas.getHeight() * (0.22 + Math.random() * 0.5),
    angle: (Math.random() - 0.5) * 34,
    originX: "center",
    originY: "center",
  };
}

function place(obj) {
  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.requestRenderAll();
}

/* ---------- Shape factories ---------- */
function starPoints(spikes, outer, inner) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

const addStar = () => place(new fabric.Polygon(starPoints(5, 55, 24), stickerOpts(nextColor())));

const addBolt = () =>
  place(
    new fabric.Polygon(
      [
        { x: 20, y: 0 }, { x: 55, y: 0 }, { x: 32, y: 38 }, { x: 58, y: 38 },
        { x: 8, y: 100 }, { x: 24, y: 52 }, { x: 0, y: 52 },
      ],
      stickerOpts(nextColor())
    )
  );

const addHeart = () =>
  place(
    new fabric.Path(
      "M 50 28 C 38 2 0 8 0 36 C 0 62 50 92 50 92 C 50 92 100 62 100 36 C 100 8 62 2 50 28 Z",
      stickerOpts(nextColor())
    )
  );

const addBlob = () =>
  place(
    new fabric.Path(
      "M 60 8 C 92 4 116 30 110 60 C 104 92 74 112 44 102 C 14 92 2 62 14 36 C 22 18 38 11 60 8 Z",
      stickerOpts(nextColor())
    )
  );

const addText = () =>
  place(
    new fabric.IText("STICKER!", {
      ...stickerOpts(nextColor()),
      fontFamily: "Bungee, sans-serif",
      fontSize: 46,
      strokeWidth: 3,
    })
  );

/* ---------- Toolbar ---------- */
document.getElementById("addStar").addEventListener("click", addStar);
document.getElementById("addBolt").addEventListener("click", addBolt);
document.getElementById("addHeart").addEventListener("click", addHeart);
document.getElementById("addBlob").addEventListener("click", addBlob);
document.getElementById("addText").addEventListener("click", addText);

document.getElementById("dupeBtn").addEventListener("click", () => {
  const active = canvas.getActiveObject();
  if (!active) return;
  active.clone((cloned) => {
    cloned.set({ left: active.left + 26, top: active.top + 26 });
    place(cloned);
  });
});

function deleteSelection() {
  const active = canvas.getActiveObject();
  if (!active) return;
  if (active.isEditing) return; // don't nuke text mid-edit
  canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
document.getElementById("deleteBtn").addEventListener("click", deleteSelection);
window.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    const active = canvas.getActiveObject();
    if (active && !active.isEditing) {
      e.preventDefault();
      deleteSelection();
    }
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const link = document.createElement("a");
  link.href = canvas.toDataURL({ format: "png", multiplier: 2 });
  link.download = "sticker-sheet.png";
  link.click();
});

/* ---------- Seed the sheet (after the display font is ready) ---------- */
async function seed() {
  try {
    await document.fonts.load("46px Bungee");
  } catch {
    /* fall back silently */
  }
  addStar();
  addBolt();
  addHeart();
  addText();
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
seed();
