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
const LOGO_TEXT = "ACME";
const TAGLINE = "Build something great";
const BRAND_COLOR = "#6366f1";
const BG_COLOR = "#0a0a0f";

// ── Burst rings ───────────────────────────────────────────────────────
const BurstRing: React.FC<{ frame: number; delay: number; size: number }> = ({
  frame,
  delay,
  size,
}) => {
  const f = Math.max(0, frame - delay);
  const scale = interpolate(f, [0, 45], [0.3, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(f, [0, 10, 45], [0, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${BRAND_COLOR}`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    />
  );
};

// ── Logo mark ─────────────────────────────────────────────────────────
const LogoMark: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 9, stiffness: 160, mass: 0.7 },
  });

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -58%) scale(${scale})`,
        opacity,
      }}
    >
      {/* Circle mark */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          backgroundColor: BRAND_COLOR,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 900,
            fontSize: 52,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          {LOGO_TEXT[0]}
        </div>
      </div>

      {/* Logo wordmark */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 800,
          fontSize: 48,
          color: "#ffffff",
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        {LOGO_TEXT}
      </div>
    </div>
  );
};

// ── Tagline ───────────────────────────────────────────────────────────
const TaglineText: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const delayed = Math.max(0, frame - 40);
  const opacity = interpolate(delayed, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = spring({
    frame: delayed,
    fps,
    from: 10,
    to: 0,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, 90px) translateY(${translateY}px)`,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 400,
          fontSize: 18,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        {TAGLINE}
      </div>
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────
export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const globalOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: globalOpacity }}>
      <BurstRing frame={frame} delay={0} size={200} />
      <BurstRing frame={frame} delay={8} size={300} />
      <BurstRing frame={frame} delay={16} size={420} />
      <LogoMark frame={frame} fps={fps} />
      <TaglineText frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

// ── Remotion Root ─────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
  <Composition
    id="LogoReveal"
    component={LogoReveal}
    durationInFrames={90}
    fps={30}
    width={1280}
    height={720}
  />
);
