/* ============================================================
   D3 FORCE CONSTELLATION — a physics-settled star chart
   link + charge + cluster anchors + collide; SVG rendering.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Data ---------- */
const CLUSTERS = [
  { id: "design", label: "Design", color: "#e8c56a", ax: 600, ay: 180 },
  { id: "motion", label: "Motion", color: "#ff7ad9", ax: 950, ay: 350 },
  { id: "code", label: "Code", color: "#7ce0ff", ax: 820, ay: 650 },
  { id: "three", label: "3-D", color: "#b9a7ff", ax: 380, ay: 650 },
  { id: "sound", label: "Sound", color: "#9dffb0", ax: 250, ay: 350 },
];

const SATELLITES = {
  design: ["grids", "kerning", "contrast", "tokens", "rhythm", "icons"],
  motion: ["easing", "springs", "scrub", "stagger", "flip", "parallax"],
  code: ["astro", "react", "bun", "workers", "zod", "vite"],
  three: ["shaders", "meshes", "cameras", "fog", "instancing"],
  sound: ["synths", "midi", "fft", "reverb", "tempo"],
};

const nodes = [];
const links = [];

for (const c of CLUSTERS) {
  nodes.push({ id: c.id, label: c.label, cluster: c.id, hub: true, x: c.ax, y: c.ay });
  for (const s of SATELLITES[c.id]) {
    const id = `${c.id}-${s}`;
    nodes.push({
      id,
      label: s,
      cluster: c.id,
      hub: false,
      x: c.ax + (Math.random() - 0.5) * 120,
      y: c.ay + (Math.random() - 0.5) * 120,
    });
    links.push({ source: c.id, target: id, kind: "spoke" });
  }
}

/* hub ring */
for (let i = 0; i < CLUSTERS.length; i++) {
  links.push({ source: CLUSTERS[i].id, target: CLUSTERS[(i + 1) % CLUSTERS.length].id, kind: "ring" });
}

/* a few cross-constellation bridges */
[
  ["design-tokens", "code-zod"],
  ["motion-springs", "three-cameras"],
  ["sound-fft", "three-shaders"],
  ["motion-flip", "design-grids"],
  ["code-workers", "sound-midi"],
].forEach(([a, b]) => links.push({ source: a, target: b, kind: "bridge" }));

const clusterById = new Map(CLUSTERS.map((c) => [c.id, c]));

/* adjacency for hover highlighting */
const neighbors = new Map(nodes.map((n) => [n.id, new Set([n.id])]));
for (const l of links) {
  neighbors.get(l.source).add(l.target);
  neighbors.get(l.target).add(l.source);
}

/* ---------- Simulation ---------- */
const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3
      .forceLink(links)
      .id((d) => d.id)
      .distance((l) => (l.kind === "spoke" ? 62 + Math.random() * 26 : l.kind === "ring" ? 300 : 200))
      .strength((l) => (l.kind === "spoke" ? 0.9 : l.kind === "ring" ? 0.06 : 0.03))
  )
  .force("charge", d3.forceManyBody().strength((d) => (d.hub ? -320 : -70)))
  .force("x", d3.forceX((d) => clusterById.get(d.cluster).ax).strength(0.05))
  .force("y", d3.forceY((d) => clusterById.get(d.cluster).ay).strength(0.05))
  .force("collide", d3.forceCollide((d) => (d.hub ? 26 : 12)));

/* ---------- Rendering ---------- */
const svg = d3.select("#constellation");

/* soft glow filter for hub stars */
const defs = svg.append("defs");
const glow = defs.append("filter").attr("id", "star-glow").attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
glow.append("feGaussianBlur").attr("stdDeviation", 5).attr("result", "blur");
const merge = glow.append("feMerge");
merge.append("feMergeNode").attr("in", "blur");
merge.append("feMergeNode").attr("in", "SourceGraphic");

const linkSel = svg
  .append("g")
  .selectAll("line")
  .data(links)
  .join("line")
  .attr("class", "link");

const nodeSel = svg
  .append("g")
  .selectAll("g")
  .data(nodes)
  .join("g")
  .attr("class", "node");

nodeSel
  .append("circle")
  .attr("r", (d) => (d.hub ? 9 : 3.2 + Math.random() * 1.6))
  .attr("fill", (d) => clusterById.get(d.cluster).color)
  .attr("filter", (d) => (d.hub ? "url(#star-glow)" : null));

nodeSel
  .filter((d) => d.hub)
  .append("text")
  .attr("class", "hub-label")
  .attr("text-anchor", "middle")
  .attr("dy", -18)
  .text((d) => d.label);

nodeSel
  .filter((d) => !d.hub)
  .append("text")
  .attr("class", "sat-label")
  .attr("text-anchor", "middle")
  .attr("dy", -9)
  .text((d) => d.label);

function updatePositions() {
  linkSel
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
  nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
}

simulation.on("tick", updatePositions);

if (prefersReduced) {
  /* settle synchronously and present a still chart */
  simulation.stop();
  simulation.tick(300);
  updatePositions();
}

/* ---------- Hover highlighting ---------- */
nodeSel
  .on("mouseenter", (event, d) => {
    const hood = neighbors.get(d.id);
    svg.classed("has-focus", true);
    nodeSel.classed("is-active", (n) => hood.has(n.id));
    linkSel.classed("is-active", (l) => l.source.id === d.id || l.target.id === d.id);
  })
  .on("mouseleave", () => {
    svg.classed("has-focus", false);
    nodeSel.classed("is-active", false);
    linkSel.classed("is-active", false);
  });

/* ---------- Drag ---------- */
nodeSel.call(
  d3
    .drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.25).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    })
);

/* ---------- Legend ---------- */
const legend = document.getElementById("legend");
for (const c of CLUSTERS) {
  const item = document.createElement("span");
  item.className = "legend-item";
  item.innerHTML = `<span class="legend-dot" style="background:${c.color};color:${c.color}"></span>${c.label.toUpperCase()}`;
  legend.appendChild(item);
}
