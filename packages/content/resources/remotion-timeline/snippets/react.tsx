import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ── Config ────────────────────────────────────────────────────────────
const BG_COLOR = "#0a0a0f";
const LINE_COLOR = "#6366f1";
const STAGGER_FRAMES = 48; // frames between each event reveal
const TITLE = "Our Journey";

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

const EVENTS: TimelineEvent[] = [
  { year: "2022", title: "Founded", description: "Company started in a garage" },
  { year: "2023", title: "Launch", description: "v1.0 shipped to 100 users" },
  { year: "2024", title: "Scale", description: "1 million users milestone" },
  { year: "2025", title: "Global", description: "Expanded to 10 countries" },
];

// ── Page title ────────────────────────────────────────────────────────
const PageTitle: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const translateY = interpolate(frame, [0, 20], [-12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 800,
          fontSize: 36,
          color: "#ffffff",
          letterSpacing: -1,
        }}
      >
        {TITLE}
      </div>
      <div
        style={{
          width: 40,
          height: 3,
          backgroundColor: LINE_COLOR,
          borderRadius: 2,
          margin: "10px auto 0",
        }}
      />
    </div>
  );
};

// ── Connecting line (SVG stroke reveal) ───────────────────────────────
const ConnectingLine: React.FC<{
  frame: number;
  fromX: number;
  toX: number;
  y: number;
  eventIndex: number;
}> = ({ frame, fromX, toX, y, eventIndex }) => {
  const delay = (eventIndex + 1) * STAGGER_FRAMES - STAGGER_FRAMES / 2;
  const f = Math.max(0, frame - delay);
  const progress = interpolate(f, [0, STAGGER_FRAMES / 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const drawnX = fromX + (toX - fromX) * progress;

  return (
    <line
      x1={fromX}
      y1={y}
      x2={drawnX}
      y2={y}
      stroke={LINE_COLOR}
      strokeWidth={2}
      strokeDasharray="none"
      opacity={0.4}
    />
  );
};

// ── Event node ────────────────────────────────────────────────────────
const EventNode: React.FC<{
  event: TimelineEvent;
  index: number;
  x: number;
  frame: number;
  fps: number;
}> = ({ event, index, x, frame, fps }) => {
  const delay = index * STAGGER_FRAMES;
  const f = Math.max(0, frame - delay);

  // Dot scale
  const dotScale = spring({
    frame: f,
    fps,
    from: 0,
    to: 1,
    config: { damping: 8, stiffness: 220, mass: 0.5 },
  });

  // Content fade
  const contentOpacity = interpolate(f, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentY = spring({
    frame: Math.max(0, f - 10),
    fps,
    from: 16,
    to: 0,
    config: { damping: 14, stiffness: 80 },
  });

  const CENTER_Y = 360; // vertical center of timeline
  const isAbove = index % 2 === 0; // alternate above/below
  const contentOffsetY = isAbove ? -140 : 60;

  return (
    <g>
      {/* Vertical stem */}
      <line
        x1={x}
        y1={CENTER_Y}
        x2={x}
        y2={CENTER_Y + (isAbove ? -40 : 40)}
        stroke={LINE_COLOR}
        strokeWidth={1.5}
        opacity={contentOpacity as unknown as number}
      />

      {/* Dot */}
      <circle
        cx={x}
        cy={CENTER_Y}
        r={12 * dotScale}
        fill={LINE_COLOR}
        style={{ filter: `drop-shadow(0 0 8px ${LINE_COLOR})` }}
      />
      <circle cx={x} cy={CENTER_Y} r={5 * dotScale} fill="#ffffff" />
    </g>
  );
};

// ── Event label (rendered as HTML for text wrapping) ──────────────────
const EventLabel: React.FC<{
  event: TimelineEvent;
  index: number;
  x: number;
  frame: number;
  fps: number;
  totalWidth: number;
}> = ({ event, index, x, frame, fps, totalWidth }) => {
  const delay = index * STAGGER_FRAMES + 10;
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = spring({
    frame: f,
    fps,
    from: index % 2 === 0 ? -12 : 12,
    to: 0,
    config: { damping: 14, stiffness: 80 },
  });

  const CENTER_Y = 360;
  const isAbove = index % 2 === 0;
  const topPx = isAbove ? CENTER_Y - 180 : CENTER_Y + 70;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 70,
        top: topPx,
        width: 140,
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: LINE_COLOR,
          marginBottom: 4,
        }}
      >
        {event.year}
      </div>
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: "#ffffff",
          marginBottom: 4,
        }}
      >
        {event.title}
      </div>
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 400,
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.4,
        }}
      >
        {event.description}
      </div>
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────
export const AnimatedTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const CENTER_Y = height / 2;
  const PADDING_X = 140;
  const nodeCount = EVENTS.length;
  const spacing = (width - PADDING_X * 2) / (nodeCount - 1);
  const nodeXs = EVENTS.map((_, i) => PADDING_X + i * spacing);

  // Axis line reveal
  const axisProgress = interpolate(frame, [5, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 900,
          height: 400,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse, ${LINE_COLOR}12 0%, transparent 70%)`,
        }}
      />

      <PageTitle frame={frame} />

      {/* SVG for lines and dots */}
      <svg
        style={{ position: "absolute", inset: 0 }}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Main axis */}
        <line
          x1={PADDING_X}
          y1={CENTER_Y}
          x2={PADDING_X + (width - PADDING_X * 2) * axisProgress}
          y2={CENTER_Y}
          stroke={LINE_COLOR}
          strokeWidth={2}
          opacity={0.3}
        />

        {/* Connecting lines between dots */}
        {EVENTS.slice(0, -1).map((_, i) => (
          <ConnectingLine
            key={i}
            frame={frame}
            fromX={nodeXs[i]}
            toX={nodeXs[i + 1]}
            y={CENTER_Y}
            eventIndex={i}
          />
        ))}

        {/* Event nodes */}
        {EVENTS.map((event, i) => (
          <EventNode
            key={event.year}
            event={event}
            index={i}
            x={nodeXs[i]}
            frame={frame}
            fps={fps}
          />
        ))}
      </svg>

      {/* HTML labels (for text wrapping) */}
      {EVENTS.map((event, i) => (
        <EventLabel
          key={event.year}
          event={event}
          index={i}
          x={nodeXs[i]}
          frame={frame}
          fps={fps}
          totalWidth={width}
        />
      ))}
    </AbsoluteFill>
  );
};

// ── Remotion Root ─────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
  <Composition
    id="AnimatedTimeline"
    component={AnimatedTimeline}
    durationInFrames={240}
    fps={30}
    width={1280}
    height={720}
  />
);
