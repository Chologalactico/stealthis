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
const CHART_TITLE = "Monthly Revenue";
const UNIT = "$K";
const STAGGER = 10; // frames between each bar
const BG_COLOR = "#0a0a0f";
const AXIS_COLOR = "rgba(255,255,255,0.15)";

interface BarDatum {
  label: string;
  value: number;
  color: string;
}

const DATA: BarDatum[] = [
  { label: "Jan", value: 42, color: "#6366f1" },
  { label: "Feb", value: 78, color: "#8b5cf6" },
  { label: "Mar", value: 55, color: "#06b6d4" },
  { label: "Apr", value: 91, color: "#10b981" },
  { label: "May", value: 67, color: "#f59e0b" },
  { label: "Jun", value: 84, color: "#ef4444" },
];

const MAX_VALUE = Math.max(...DATA.map((d) => d.value));

// ── Chart title ───────────────────────────────────────────────────────
const ChartTitle: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 20], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 700,
        fontSize: 32,
        color: "#ffffff",
        marginBottom: 8,
      }}
    >
      {CHART_TITLE}
    </div>
  );
};

// ── Single bar ────────────────────────────────────────────────────────
const Bar: React.FC<{
  datum: BarDatum;
  index: number;
  frame: number;
  fps: number;
  chartHeight: number;
}> = ({ datum, index, frame, fps, chartHeight }) => {
  const delay = 20 + index * STAGGER;
  const f = Math.max(0, frame - delay);

  const heightPct = spring({
    frame: f,
    fps,
    from: 0,
    to: datum.value / MAX_VALUE,
    config: { damping: 14, stiffness: 100, mass: 0.7 },
  });

  const barHeight = heightPct * chartHeight * 0.85;

  // Value label count-up
  const displayValue = Math.round(
    interpolate(f, [0, 30], [0, datum.value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  const labelOpacity = interpolate(f, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        gap: 8,
      }}
    >
      {/* Value label */}
      <div
        style={{
          opacity: labelOpacity,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 600,
          fontSize: 16,
          color: datum.color,
          height: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        {displayValue}
        {UNIT}
      </div>

      {/* Bar */}
      <div
        style={{
          width: "60%",
          height: barHeight,
          backgroundColor: datum.color,
          borderRadius: "4px 4px 0 0",
          alignSelf: "flex-end",
          boxShadow: `0 0 20px ${datum.color}60`,
        }}
      />

      {/* X label */}
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          opacity: labelOpacity,
        }}
      >
        {datum.label}
      </div>
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────
export const ChartBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const PADDING = { top: 80, right: 80, bottom: 80, left: 80 };
  const chartHeight = height - PADDING.top - PADDING.bottom - 60; // 60 for title

  // Axis opacity
  const axisOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      {/* Background grid glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 800,
          height: 600,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: PADDING.top,
          left: PADDING.left,
          right: PADDING.right,
          bottom: PADDING.bottom,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChartTitle frame={frame} />

        {/* Chart area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
          }}
        >
          {/* Y-axis */}
          <div
            style={{
              position: "absolute",
              left: -24,
              top: 0,
              bottom: 48,
              width: 1,
              backgroundColor: AXIS_COLOR,
              opacity: axisOpacity,
            }}
          />

          {/* X-axis */}
          <div
            style={{
              position: "absolute",
              left: -24,
              right: 0,
              bottom: 47,
              height: 1,
              backgroundColor: AXIS_COLOR,
              opacity: axisOpacity,
            }}
          />

          {/* Bars */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              paddingBottom: 0,
            }}
          >
            {DATA.map((datum, i) => (
              <Bar
                key={datum.label}
                datum={datum}
                index={i}
                frame={frame}
                fps={fps}
                chartHeight={chartHeight}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Remotion Root ─────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
  <Composition
    id="ChartBar"
    component={ChartBar}
    durationInFrames={150}
    fps={30}
    width={1280}
    height={720}
  />
);
