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
const HANDLE = "@youraccount";
const HEADLINE_WORDS = ["Big", "News.", "Coming", "Soon!"];
const SUBTITLE = "Stay tuned for our big announcement this week.";
const CTA_TEXT = "Swipe Up to Learn More";
const BG_TOP = "#667eea";
const BG_BOTTOM = "#764ba2";
const DURATION = 450; // 15 s × 30 fps

// ── Progress bar ──────────────────────────────────────────────────────
const ProgressBar: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = interpolate(frame, [0, DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "rgba(255,255,255,0.3)",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      />
    </div>
  );
};

// ── Account handle ────────────────────────────────────────────────────
const AccountHandle: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        left: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.25)",
          border: "2px solid rgba(255,255,255,0.7)",
        }}
      />
      <div
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 600,
          fontSize: 16,
          color: "#ffffff",
        }}
      >
        {HANDLE}
      </div>
    </div>
  );
};

// ── Stagger headline ──────────────────────────────────────────────────
const HeadlineWords: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        paddingLeft: 40,
        paddingRight: 40,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {HEADLINE_WORDS.map((word, i) => {
        const delay = 20 + i * 14;
        const f = Math.max(0, frame - delay);
        const opacity = interpolate(f, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateY = spring({
          frame: f,
          fps,
          from: 24,
          to: 0,
          config: { damping: 14, stiffness: 100 },
        });

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 800,
              fontSize: 64,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
};

// ── Subtitle ──────────────────────────────────────────────────────────
const SubtitleText: React.FC<{ frame: number }> = ({ frame }) => {
  const delayed = Math.max(0, frame - 80);
  const opacity = interpolate(delayed, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "62%",
        left: 40,
        right: 40,
        opacity,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 400,
        fontSize: 24,
        color: "rgba(255,255,255,0.75)",
        lineHeight: 1.5,
      }}
    >
      {SUBTITLE}
    </div>
  );
};

// ── CTA ───────────────────────────────────────────────────────────────
const CTAButton: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const delayed = Math.max(0, frame - 120);
  const translateY = spring({
    frame: delayed,
    fps,
    from: 40,
    to: 0,
    config: { damping: 14, stiffness: 80 },
  });
  const opacity = interpolate(delayed, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(8px)",
          border: "2px solid rgba(255,255,255,0.5)",
          borderRadius: 50,
          padding: "18px 40px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#ffffff",
          whiteSpace: "nowrap",
        }}
      >
        ↑ {CTA_TEXT}
      </div>
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────
export const InstagramStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
      }}
    >
      <ProgressBar frame={frame} />
      <AccountHandle frame={frame} fps={fps} />
      <HeadlineWords frame={frame} fps={fps} />
      <SubtitleText frame={frame} />
      <CTAButton frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

// ── Remotion Root ─────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => (
  <Composition
    id="InstagramStory"
    component={InstagramStory}
    durationInFrames={450}
    fps={30}
    width={1080}
    height={1920}
  />
);
