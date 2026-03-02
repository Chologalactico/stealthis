import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Props ─────────────────────────────────────────────────────────────
interface SumbnailProps {
  title?: string;
  tag?: string;
  bg1?: string;
  bg2?: string;
  accentColor?: string;
}

const defaultProps: Required<SumbnailProps> = {
  title: "Build in Public",
  tag: "Tutorial",
  bg1: "#0f0c29",
  bg2: "#302b63",
  accentColor: "#f59e0b",
};

// ── Tag badge ─────────────────────────────────────────────────────────
const TagBadge: React.FC<{ tag: string; accentColor: string; frame: number; fps: number }> = ({
  tag,
  accentColor,
  frame,
  fps,
}) => {
  const scale = spring({ frame, fps, from: 0, to: 1, config: { damping: 12, stiffness: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 48,
        transform: `scale(${scale})`,
        transformOrigin: "left top",
      }}
    >
      <div
        style={{
          backgroundColor: accentColor,
          borderRadius: 6,
          padding: "8px 20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#000000",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {tag}
      </div>
    </div>
  );
};

// ── Title text ────────────────────────────────────────────────────────
const TitleText: React.FC<{ title: string; frame: number; fps: number }> = ({
  title,
  frame,
  fps,
}) => {
  const words = title.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 48,
        right: 320,
        display: "flex",
        flexWrap: "wrap",
        gap: "0 12px",
      }}
    >
      {words.map((word, i) => {
        const delay = 5 + i * 6;
        const f = Math.max(0, frame - delay);
        const opacity = interpolate(f, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateY = spring({
          frame: f,
          fps,
          from: 20,
          to: 0,
          config: { damping: 14, stiffness: 120 },
        });

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: 88,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── Image/face placeholder ────────────────────────────────────────────
const ImageSlot: React.FC<{ frame: number; fps: number; accentColor: string }> = ({
  frame,
  fps,
  accentColor,
}) => {
  const delayed = Math.max(0, frame - 8);
  const translateX = spring({
    frame: delayed,
    fps,
    from: 80,
    to: 0,
    config: { damping: 14, stiffness: 100 },
  });
  const opacity = interpolate(delayed, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 48,
        bottom: 0,
        width: 280,
        height: 520,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Placeholder silhouette */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, ${accentColor}40 0%, ${accentColor}10 100%)`,
          borderRadius: "140px 140px 0 0",
          border: `2px solid ${accentColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Face / Image
          <br />
          Slot
        </div>
      </div>
    </div>
  );
};

// ── Accent line ───────────────────────────────────────────────────────
const AccentLine: React.FC<{ frame: number; accentColor: string }> = ({ frame, accentColor }) => {
  const scaleX = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 140,
        left: 48,
        width: 160,
        height: 5,
        backgroundColor: accentColor,
        borderRadius: 3,
        transformOrigin: "left center",
        transform: `scaleX(${scaleX})`,
      }}
    />
  );
};

// ── Main composition ──────────────────────────────────────────────────
export const Sumbnail: React.FC<SumbnailProps> = (inputProps) => {
  const props = { ...defaultProps, ...inputProps };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${props.bg1} 0%, ${props.bg2} 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Diagonal noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
        }}
      />

      <TagBadge tag={props.tag} accentColor={props.accentColor} frame={frame} fps={fps} />
      <AccentLine frame={frame} accentColor={props.accentColor} />
      <TitleText title={props.title} frame={frame} fps={fps} />
      <ImageSlot frame={frame} fps={fps} accentColor={props.accentColor} />
    </AbsoluteFill>
  );
};

// ── Remotion Root ─────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Sumbnail"
    component={Sumbnail}
    durationInFrames={150}
    fps={30}
    width={1280}
    height={720}
    defaultProps={defaultProps}
  />
);
