const nodes = [
    { name: "Search advertising", color: "#4285F4", val: "$48.5B", change: "+14% Y/Y", logo: "🔍" },
    { name: "YouTube", color: "#FF0000", val: "$8.7B", change: "+13% Y/Y", logo: "📺" },
    { name: "Google AdMob", color: "#FBBC05", val: "$7.4B", change: "-5% Y/Y", logo: "📱" },
    { name: "Google Play", color: "#34A853", val: "$9.3B", change: "+14% Y/Y", logo: "▶️" },
    { name: "Google Cloud", color: "#4285F4", val: "$10.3B", change: "+29% Y/Y", logo: "☁️" },
    { name: "Other", color: "#64748b", val: "$0.5B", change: "", logo: "➕" },
    { name: "Ad Revenue", color: "#4285F4", val: "$64.6B", change: "+11% Y/Y" },
    { name: "Revenue", color: "#4285F4", val: "$84.7B", change: "+14% Y/Y" },
    { name: "Gross profit", color: "#34A853", val: "$49.2B", change: "58% margin" },
    { name: "Cost of revenues", color: "#EA4335", val: "$35.5B", change: "" },
    { name: "Operating profit", color: "#34A853", val: "$27.4B", change: "32% margin" },
    { name: "Operating expenses", color: "#EA4335", val: "$21.8B", change: "" },
    { name: "Net profit", color: "#34A853", val: "$23.6B", change: "28% margin" },
    { name: "Tax", color: "#EA4335", val: "$3.9B", change: "" },
    { name: "Other (P/L)", color: "#1e293b", val: "$0.1B", change: "" },
    { name: "R&D", color: "#EA4335", val: "$11.9B", change: "14% of rev" },
    { name: "S&M", color: "#EA4335", val: "$6.8B", change: "8% of rev" },
    { name: "G&A", color: "#EA4335", val: "$3.1B", change: "4% of rev" }
];

const links = [
    { source: 0, target: 6, value: 48.5 },
    { source: 1, target: 6, value: 8.7 },
    { source: 2, target: 6, value: 7.4 },
    { source: 6, target: 7, value: 64.6 },
    { source: 3, target: 7, value: 9.3 },
    { source: 4, target: 7, value: 10.3 },
    { source: 5, target: 7, value: 0.5 },
    { source: 7, target: 8, value: 49.2 },
    { source: 7, target: 9, value: 35.5 },
    { source: 8, target: 10, value: 27.4 },
    { source: 8, target: 11, value: 21.8 },
    { source: 10, target: 12, value: 23.6 },
    { source: 10, target: 13, value: 3.7 }, // Adjusted slightly to balance
    { source: 10, target: 14, value: 0.1 },
    { source: 11, target: 15, value: 11.9 },
    { source: 11, target: 16, value: 6.8 },
    { source: 11, target: 17, value: 3.1 }
];

function initSankey() {
    const margin = { top: 60, right: 180, bottom: 60, left: 180 };
    const chartArea = document.querySelector('.sankey-wrapper');
    const width = chartArea.clientWidth - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const svg = d3.select("#sankey-svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const sankey = d3.sankey()
        .nodeWidth(16)
        .nodePadding(40)
        .size([width, height]);

    const graph = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    // Color gradient for links (from source node color)
    const link = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("stroke", d => d.source.color)
        .attr("opacity", 0.2)
        .on("mouseenter", (e, d) => {
            d3.select(e.target).attr("opacity", 0.5);
        })
        .on("mouseleave", (e, d) => {
            d3.select(e.target).attr("opacity", 0.2);
        });

    // Nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .attr("fill", d => d.color || "#666")
        .attr("rx", 3);

    // Labels and logos
    node.each(function(d) {
        const group = d3.select(this);
        const isLeft = d.x0 < width / 2;
        const xPos = isLeft ? -10 : sankey.nodeWidth() + 10;
        const align = isLeft ? "end" : "start";

        // Logo / Icon
        if (d.logo) {
            group.append("text")
                .attr("x", isLeft ? -130 : xPos + 100)
                .attr("y", (d.y1 - d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("font-size", "24px")
                .text(d.logo);
        }

        const labelGroup = group.append("g")
            .attr("transform", `translate(${xPos}, ${(d.y1 - d.y0) / 2})`);

        labelGroup.append("text")
            .attr("text-anchor", align)
            .attr("dy", "-1em")
            .attr("class", "node-label")
            .text(d.name);

        labelGroup.append("text")
            .attr("text-anchor", align)
            .attr("dy", "0.4em")
            .attr("class", "node-value")
            .attr("fill", d.color)
            .text(d.val);

        if (d.change) {
            labelGroup.append("text")
                .attr("text-anchor", align)
                .attr("dy", "1.6em")
                .attr("class", "node-change")
                .text(d.change);
        }
    });

}

window.addEventListener("resize", () => {
    d3.select("#sankey-svg").selectAll("*").remove();
    initSankey();
});

document.addEventListener("DOMContentLoaded", initSankey);
