import {
  Background,
  BackgroundVariant,
  type Connection,
  ConnectionMode,
  Controls,
  type Edge,
  type EdgeMouseHandler,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  type OnConnect,
  Panel,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Node types ---
type NodeKind = "stack" | "tool" | "mcp" | "skill" | "infra" | "auth" | "db" | "deploy";

interface NodeData {
  label: string;
  kind: NodeKind;
  [key: string]: unknown;
}

interface ProjectUpdateDetail {
  title?: string;
  description?: string;
}

const DRAG_NODE_MIME = "application/x-stealthis-node";
const MIN_GRAPH_HEIGHT_PX = 360;
const LOW_GRAPH_HEIGHT_WARNING_PX = 420;

const KIND_COLORS: Record<NodeKind, { bg: string; border: string; text: string }> = {
  stack: { bg: "#1e3a5f", border: "#38bdf8", text: "#bae6fd" },
  tool: { bg: "#1a2f1a", border: "#4ade80", text: "#bbf7d0" },
  mcp: { bg: "#2d1f4a", border: "#a78bfa", text: "#ede9fe" },
  skill: { bg: "#3a2a12", border: "#fb923c", text: "#fed7aa" },
  infra: { bg: "#1e293b", border: "#94a3b8", text: "#cbd5e1" },
  auth: { bg: "#3b1a1a", border: "#f87171", text: "#fecaca" },
  db: { bg: "#1a2535", border: "#60a5fa", text: "#bfdbfe" },
  deploy: { bg: "#1c2a1a", border: "#34d399", text: "#a7f3d0" },
};

function StyledNode({ data }: { data: NodeData }) {
  const colors = KIND_COLORS[data.kind] ?? KIND_COLORS.stack;
  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "0.625rem",
        padding: "0.5rem 0.875rem",
        color: colors.text,
        fontSize: "0.8125rem",
        fontWeight: 500,
        minWidth: "80px",
        textAlign: "center",
      }}
    >
      <Handle
        id="top"
        style={handleStyle(colors.border)}
        type="source"
        position={Position.Top}
        isConnectableStart
        isConnectableEnd
      />
      <Handle
        id="left"
        style={handleStyle(colors.border)}
        type="source"
        position={Position.Left}
        isConnectableStart
        isConnectableEnd
      />
      <Handle
        id="right"
        style={handleStyle(colors.border)}
        type="source"
        position={Position.Right}
        isConnectableStart
        isConnectableEnd
      />
      <Handle
        id="bottom"
        style={handleStyle(colors.border)}
        type="source"
        position={Position.Bottom}
        isConnectableStart
        isConnectableEnd
      />
      <div
        style={{
          fontSize: "0.65rem",
          opacity: 0.6,
          marginBottom: "0.125rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {data.kind}
      </div>
      {data.label}
    </div>
  );
}

const nodeTypes = { styled: StyledNode };

// --- Palette ---
const PALETTE_ITEMS: { kind: NodeKind; label: string; example: string }[] = [
  { kind: "stack", label: "Stack", example: "Astro / Next.js" },
  { kind: "tool", label: "Tool", example: "TypeScript / Bun" },
  { kind: "mcp", label: "MCP", example: "StealThis MCP" },
  { kind: "skill", label: "Skill", example: "Authentication" },
  { kind: "infra", label: "Infra", example: "Cloudflare Pages" },
  { kind: "auth", label: "Auth", example: "GitHub OAuth" },
  { kind: "db", label: "DB", example: "PlanetScale" },
  { kind: "deploy", label: "Deploy", example: "Cloudflare Workers" },
];

// --- Initial nodes ---
const INITIAL_NODES: Node<NodeData>[] = [
  {
    id: "1",
    type: "styled",
    position: { x: 200, y: 150 },
    data: { label: "Astro 5", kind: "stack" },
  },
  {
    id: "2",
    type: "styled",
    position: { x: 450, y: 80 },
    data: { label: "Cloudflare Pages", kind: "deploy" },
  },
  {
    id: "3",
    type: "styled",
    position: { x: 450, y: 220 },
    data: { label: "Tailwind CSS", kind: "tool" },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3" },
];

function hasExactConnection(connection: Connection, edges: Edge[]) {
  return edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
      (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
  );
}

function createNodeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// --- Export helpers ---
function exportProjectJSON(
  title: string,
  description: string,
  nodes: Node<NodeData>[],
  edges: Edge[]
) {
  const data = {
    title,
    description,
    exportedAt: new Date().toISOString(),
    graph: {
      nodes: nodes.map((n) => ({ id: n.id, kind: n.data.kind, label: n.data.label })),
      edges: edges.map((edge) => ({
        ...edge,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
      })),
    },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project.json";
  a.click();
  URL.revokeObjectURL(url);
}

function exportMarkdown(title: string, description: string, nodes: Node<NodeData>[]) {
  const sections: Record<NodeKind, string[]> = {
    stack: [],
    tool: [],
    mcp: [],
    skill: [],
    infra: [],
    auth: [],
    db: [],
    deploy: [],
  };

  for (const node of nodes) {
    sections[node.data.kind]?.push(node.data.label);
  }

  const lines = [
    `# ${title}`,
    "",
    description ? `> ${description}` : "",
    "",
    "## Implementation Plan",
    "",
  ];

  const SECTION_LABELS: Partial<Record<NodeKind, string>> = {
    stack: "### Tech Stack",
    tool: "### Tools",
    mcp: "### MCP Servers",
    auth: "### Authentication",
    db: "### Database",
    infra: "### Infrastructure",
    deploy: "### Deployment",
    skill: "### Skills & Features",
  };

  for (const [kind, items] of Object.entries(sections) as [NodeKind, string[]][]) {
    if (!items.length) continue;
    lines.push(SECTION_LABELS[kind] ?? `### ${kind}`);
    for (const item of items) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "IMPLEMENTATION.md";
  a.click();
  URL.revokeObjectURL(url);
}

function exportMCP(nodes: Node<NodeData>[]) {
  const mcpNodes = nodes.filter((n) => n.data.kind === "mcp");
  const skillNodes = nodes.filter((n) => n.data.kind === "skill");

  const lines = [
    "# MCP Manifest",
    "",
    "## MCP Servers",
    "",
    ...(mcpNodes.length ? mcpNodes.map((n) => `- ${n.data.label}`) : ["_No MCP servers defined_"]),
    "",
    "## Skills",
    "",
    ...(skillNodes.length ? skillNodes.map((n) => `- ${n.data.label}`) : ["_No skills defined_"]),
    "",
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MCP.md";
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main component ---
export default function ProjectGraph({
  title = "My Project",
  description = "",
}: {
  title?: string;
  description?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(INITIAL_EDGES);
  const [projectMeta, setProjectMeta] = useState({ title, description });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [showGraphHelp, setShowGraphHelp] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const [graphViewportHeight, setGraphViewportHeight] = useState(0);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<NodeData>, Edge> | null>(
    null
  );
  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedEdges = edges.filter((edge) => edge.selected);
  const selectedNode =
    selectedNodes.find((node) => node.id === selectedNodeId) ??
    (selectedNodeId ? (nodes.find((node) => node.id === selectedNodeId) ?? null) : null) ??
    selectedNodes[0] ??
    null;
  const selectedEdge =
    selectedEdges.find((edge) => edge.id === selectedEdgeId) ??
    (selectedEdgeId ? (edges.find((edge) => edge.id === selectedEdgeId) ?? null) : null) ??
    selectedEdges[0] ??
    null;
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const isGraphHeightTight =
    graphViewportHeight > 0 && graphViewportHeight < LOW_GRAPH_HEIGHT_WARNING_PX;

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;
      return !hasExactConnection(connection, edges);
    },
    [edges]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;
      if (hasExactConnection(params, edges)) return;

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.35)" },
          },
          eds
        )
      );
    },
    [edges, setEdges]
  );

  const addNode = useCallback(
    (kind: NodeKind, label: string, position?: { x: number; y: number }) => {
      const id = createNodeId();
      setNodes((nds) => [
        ...nds.map((node) => (node.selected ? { ...node, selected: false } : node)),
        {
          id,
          type: "styled",
          position: position ?? { x: 140 + Math.random() * 320, y: 120 + Math.random() * 260 },
          data: { label, kind },
          selected: true,
        },
      ]);
      setEdges((eds) => eds.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)));
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
    },
    [setEdges, setNodes]
  );

  useEffect(() => {
    setProjectMeta({ title, description });
  }, [title, description]);

  useEffect(() => {
    const handleProjectUpdate = (event: Event) => {
      const detail = (event as CustomEvent<ProjectUpdateDetail>).detail ?? {};
      setProjectMeta({
        title: detail.title?.trim() || "My Project",
        description: detail.description?.trim() ?? "",
      });
    };

    window.addEventListener("stealthis:project-update", handleProjectUpdate as EventListener);
    return () => {
      window.removeEventListener("stealthis:project-update", handleProjectUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1180px)");
    const syncLayout = () => {
      setIsCompactLayout(mediaQuery.matches);
    };

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);
    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    const updateHeight = () => {
      const nextHeight = Math.round(container.getBoundingClientRect().height);
      setGraphViewportHeight(nextHeight);
    };

    updateHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateHeight();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (selectedNodeId && !nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (selectedEdgeId && !edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  }, [edges, selectedEdgeId]);

  const onNodeClick: NodeMouseHandler<Node<NodeData>> = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler<Edge> = useCallback((_event, edge) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(edge.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes: nextNodes, edges: nextEdges }: { nodes: Node<NodeData>[]; edges: Edge[] }) => {
      setSelectedNodeId((current) => {
        if (current && nextNodes.some((node) => node.id === current)) return current;
        return nextNodes[0]?.id ?? null;
      });

      setSelectedEdgeId((current) => {
        if (current && nextEdges.some((edge) => edge.id === current)) return current;
        return nextEdges[0]?.id ?? null;
      });
    },
    []
  );

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, kind: NodeKind, label: string) => {
      event.dataTransfer.setData(DRAG_NODE_MIME, JSON.stringify({ kind, label }));
      event.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!flowInstance) return;

      const rawPayload = event.dataTransfer.getData(DRAG_NODE_MIME);
      if (!rawPayload) return;

      let payload: { kind: NodeKind; label: string } | null = null;

      try {
        payload = JSON.parse(rawPayload) as { kind: NodeKind; label: string };
      } catch {
        payload = null;
      }

      if (!payload?.kind || !payload.label) return;

      const position = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(payload.kind, payload.label, position);
    },
    [addNode, flowInstance]
  );

  function updateSelectedNodeLabel(nextLabel: string) {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, label: nextLabel } } : node
      )
    );
  }

  const clearSelection = useCallback(() => {
    setNodes((nds) => nds.map((node) => (node.selected ? { ...node, selected: false } : node)));
    setEdges((eds) => eds.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setEdges, setNodes]);

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    const duplicatedNodeId = createNodeId();
    const duplicatedNode: Node<NodeData> = {
      id: duplicatedNodeId,
      type: selectedNode.type ?? "styled",
      position: {
        x: selectedNode.position.x + 40,
        y: selectedNode.position.y + 40,
      },
      data: { ...selectedNode.data },
      selected: true,
    };

    setNodes((nds) => [
      ...nds.map((node) => (node.selected ? { ...node, selected: false } : node)),
      duplicatedNode,
    ]);
    setEdges((eds) => eds.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)));
    setSelectedNodeId(duplicatedNodeId);
    setSelectedEdgeId(null);
  }, [selectedNode, setEdges, setNodes]);

  const removeSelectedEdges = useCallback(() => {
    const edgeIdsToDelete = new Set(selectedEdges.map((edge) => edge.id));
    if (!edgeIdsToDelete.size && selectedEdge) {
      edgeIdsToDelete.add(selectedEdge.id);
    }
    if (!edgeIdsToDelete.size) return;

    setEdges((eds) => eds.filter((edge) => !edgeIdsToDelete.has(edge.id)));
    setSelectedEdgeId(null);
  }, [selectedEdge, selectedEdges, setEdges]);

  const deleteSelection = useCallback(() => {
    const nodeIdsToDelete = new Set(selectedNodes.map((node) => node.id));
    const edgeIdsToDelete = new Set(selectedEdges.map((edge) => edge.id));

    if (!nodeIdsToDelete.size && selectedNode) {
      nodeIdsToDelete.add(selectedNode.id);
    }
    if (!edgeIdsToDelete.size && selectedEdge) {
      edgeIdsToDelete.add(selectedEdge.id);
    }
    if (!nodeIdsToDelete.size && !edgeIdsToDelete.size) return;

    if (nodeIdsToDelete.size) {
      setNodes((nds) => nds.filter((node) => !nodeIdsToDelete.has(node.id)));
    }
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !edgeIdsToDelete.has(edge.id) &&
          !nodeIdsToDelete.has(edge.source) &&
          !nodeIdsToDelete.has(edge.target)
      )
    );
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [selectedEdge, selectedEdges, selectedNode, selectedNodes, setEdges, setNodes]);

  const resetView = useCallback(() => {
    if (!flowInstance) return;
    void flowInstance.fitView({ padding: 0.2, duration: 250 });
  }, [flowInstance]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      const lowerKey = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && lowerKey === "d") {
        event.preventDefault();
        duplicateSelectedNode();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteSelection();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [clearSelection, deleteSelection, duplicateSelectedNode]);

  const layoutContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isCompactLayout ? "column" : "row",
    height: isCompactLayout ? "auto" : "calc(100vh - 260px)",
    minHeight: isCompactLayout ? "unset" : "560px",
    gap: "1rem",
  };

  const sidebarBaseStyle: React.CSSProperties = {
    flexShrink: 0,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1rem",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const paletteSidebarStyle: React.CSSProperties = {
    ...sidebarBaseStyle,
    width: isCompactLayout ? "100%" : "180px",
    maxHeight: isCompactLayout ? "unset" : "100%",
    overflowY: "auto",
  };

  const paletteGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isCompactLayout ? "repeat(2, minmax(0, 1fr))" : "1fr",
    gap: "0.5rem",
  };

  const graphContainerStyle: React.CSSProperties = {
    flex: 1,
    width: "100%",
    height: isCompactLayout ? `clamp(${MIN_GRAPH_HEIGHT_PX}px, 62vh, 560px)` : "100%",
    minHeight: isCompactLayout ? `${MIN_GRAPH_HEIGHT_PX}px` : "100%",
    position: "relative",
    borderRadius: "1rem",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const exportSidebarStyle: React.CSSProperties = {
    ...sidebarBaseStyle,
    width: isCompactLayout ? "100%" : "260px",
  };

  return (
    <div style={layoutContainerStyle}>
      {/* Palette sidebar */}
      <aside style={paletteSidebarStyle}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.25rem",
          }}
        >
          Add Node
        </p>
        <div style={paletteGridStyle}>
          {PALETTE_ITEMS.map((item) => {
            const colors = KIND_COLORS[item.kind];
            return (
              <button
                key={item.kind}
                type="button"
                draggable
                onDragStart={(event) => onDragStart(event, item.kind, item.example)}
                onClick={() => addNode(item.kind, item.example)}
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.625rem",
                  color: colors.text,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "opacity 0.15s ease",
                }}
                title={`Add ${item.example} (click or drag to canvas)`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div
          style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45 }}
        >
          Click to add quickly, or drag into the canvas for exact position.
        </div>
      </aside>

      {/* Graph canvas */}
      <div
        ref={graphContainerRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={graphContainerStyle}
      >
        {isGraphHeightTight ? (
          <div style={graphSizeWarningStyle}>
            Alto limitado detectado ({graphViewportHeight}px). En vertical puede ser dificil
            conectar nodos. Aumenta el alto de la ventana o rota el dispositivo.
          </div>
        ) : null}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          onInit={setFlowInstance}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={28}
          connectionDragThreshold={1}
          isValidConnection={isValidConnection}
          selectionOnDrag
          selectionKeyCode="Shift"
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.05)"
          />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const data = n.data as NodeData;
              return KIND_COLORS[data.kind]?.border ?? "#94a3b8";
            }}
            maskColor="rgba(3,7,18,0.8)"
          />
          <Panel position="top-right">
            <div style={graphHelpWrapperStyle}>
              <button
                type="button"
                onClick={() => setShowGraphHelp((current) => !current)}
                aria-expanded={showGraphHelp}
                style={graphHelpToggleBtnStyle}
                title={showGraphHelp ? "Hide in-canvas help" : "Show in-canvas help"}
              >
                ?
              </button>
              {showGraphHelp ? (
                <div style={graphHelpPanelStyle}>
                  <p style={graphHelpTitleStyle}>Help (Beta)</p>
                  <p style={graphHelpTextStyle}>1. Add nodes from the left palette.</p>
                  <p style={graphHelpTextStyle}>2. Connect handles to map dependencies.</p>
                  <p style={graphHelpTextStyle}>3. Edit selection in the right panel.</p>
                </div>
              ) : null}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Export panel */}
      <aside style={exportSidebarStyle}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.25rem",
          }}
        >
          Export
        </p>

        <button
          type="button"
          onClick={() =>
            exportProjectJSON(projectMeta.title, projectMeta.description, nodes, edges)
          }
          style={exportBtnStyle("#1e3a5f", "#38bdf8")}
        >
          project.json
        </button>

        <button
          type="button"
          onClick={() => exportMarkdown(projectMeta.title, projectMeta.description, nodes)}
          style={exportBtnStyle("#1a2f1a", "#4ade80")}
        >
          IMPLEMENTATION.md
        </button>

        <button
          type="button"
          onClick={() => exportMCP(nodes)}
          style={exportBtnStyle("#2d1f4a", "#a78bfa")}
        >
          MCP.md
        </button>

        <div
          style={{
            marginTop: "0.5rem",
            paddingTop: "0.6rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.35rem",
            }}
          >
            Quick Actions
          </p>
          <button
            type="button"
            onClick={duplicateSelectedNode}
            disabled={!selectedNode}
            style={quickActionBtnStyle(!selectedNode)}
          >
            Duplicate node
          </button>
          <button
            type="button"
            onClick={deleteSelection}
            disabled={!hasSelection && !selectedNode && !selectedEdge}
            style={dangerActionBtnStyle(!hasSelection && !selectedNode && !selectedEdge)}
          >
            Delete selection
          </button>
          <button type="button" onClick={resetView} style={quickActionBtnStyle(false)}>
            Reset view
          </button>
        </div>

        <div
          style={{
            marginTop: "0.25rem",
            paddingTop: "0.6rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.35rem",
            }}
          >
            Selection
          </p>

          {selectedNode && selectedNodes.length <= 1 ? (
            <>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: KIND_COLORS[selectedNode.data.kind].text,
                  marginBottom: "0.35rem",
                }}
              >
                {selectedNode.data.kind.toUpperCase()}
              </p>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(event) => updateSelectedNodeLabel(event.target.value)}
                style={inspectorInputStyle}
              />
              <button type="button" onClick={deleteSelection} style={dangerBtnStyle}>
                Delete node
              </button>
            </>
          ) : null}

          {selectedNodes.length > 1 ? (
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.45 }}>
              {selectedNodes.length} nodes selected.
            </p>
          ) : null}

          {selectedEdges.length > 0 && selectedNodes.length === 0 ? (
            <>
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.45 }}>
                {selectedEdges.length} edge{selectedEdges.length > 1 ? "s" : ""} selected.
              </p>
              <button type="button" onClick={removeSelectedEdges} style={dangerBtnStyle}>
                Delete selected edge{selectedEdges.length > 1 ? "s" : ""}
              </button>
            </>
          ) : null}

          {!hasSelection && !selectedNode && !selectedEdge ? (
            <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.45 }}>
              No selection yet. Click a node or edge to edit it.
            </p>
          ) : null}

          {!hasSelection && (selectedNode || selectedEdge) ? (
            <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.45 }}>
              Shift + drag to multi-select nodes.
            </p>
          ) : (
            <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.45 }}>
              Tip: use Delete to remove selection quickly.
            </p>
          )}
        </div>

        <div style={{ marginTop: "auto", fontSize: "0.7rem", color: "#334155", lineHeight: 1.4 }}>
          Project: <strong style={{ color: "#94a3b8" }}>{projectMeta.title}</strong>
          <br />
          Connect nodes by dragging from any handle to another node.
          <br />
          Shortcuts: Cmd/Ctrl + D, Delete, Escape.
        </div>
      </aside>
    </div>
  );
}

function handleStyle(color: string): React.CSSProperties {
  return {
    width: "12px",
    height: "12px",
    background: color,
    border: "1px solid #0b1220",
  };
}

function exportBtnStyle(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: "0.5rem",
    padding: "0.5rem 0.625rem",
    color: "#f1f5f9",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  };
}

const inspectorInputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "0.5rem",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#0b1220",
  color: "#e2e8f0",
  fontSize: "0.78rem",
  padding: "0.42rem 0.55rem",
  marginBottom: "0.45rem",
};

const dangerBtnStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "0.5rem",
  border: "1px solid rgba(248,113,113,0.45)",
  background: "rgba(127,29,29,0.3)",
  color: "#fecaca",
  fontSize: "0.74rem",
  fontWeight: 500,
  padding: "0.42rem 0.55rem",
  cursor: "pointer",
  textAlign: "left",
};

function quickActionBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    borderRadius: "0.5rem",
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(30,41,59,0.65)",
    color: "#cbd5e1",
    fontSize: "0.74rem",
    fontWeight: 500,
    padding: "0.42rem 0.55rem",
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left",
    opacity: disabled ? 0.5 : 1,
    marginBottom: "0.4rem",
  };
}

function dangerActionBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    ...dangerBtnStyle,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    marginBottom: "0.4rem",
  };
}

const graphHelpPanelStyle: React.CSSProperties = {
  borderRadius: "0.75rem",
  border: "1px solid rgba(148,163,184,0.3)",
  background: "rgba(15,23,42,0.9)",
  backdropFilter: "blur(4px)",
  padding: "0.55rem 0.65rem",
  width: "200px",
};

const graphHelpTitleStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 600,
  marginBottom: "0.3rem",
};

const graphHelpTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.72rem",
  color: "#cbd5e1",
  lineHeight: 1.45,
};

const graphHelpWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "0.5rem",
};

const graphHelpToggleBtnStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "9999px",
  border: "1px solid rgba(148,163,184,0.45)",
  background: "rgba(15,23,42,0.85)",
  color: "#e2e8f0",
  fontWeight: 700,
  cursor: "pointer",
  lineHeight: 1,
};

const graphSizeWarningStyle: React.CSSProperties = {
  position: "absolute",
  top: "0.6rem",
  left: "0.6rem",
  right: "0.6rem",
  zIndex: 8,
  borderRadius: "0.625rem",
  border: "1px solid rgba(251,191,36,0.45)",
  background: "rgba(120,53,15,0.65)",
  color: "#fde68a",
  fontSize: "0.72rem",
  lineHeight: 1.35,
  padding: "0.45rem 0.55rem",
  pointerEvents: "none",
};
