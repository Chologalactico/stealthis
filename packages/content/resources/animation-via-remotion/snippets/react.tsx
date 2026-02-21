import "./index.css";
import { Composition } from "remotion";

import { TypewriterAnimation } from "./animations/01-Typewriter";
import { SpringBounceAnimation } from "./animations/02-SpringBounce";
import { BarChartAnimation } from "./animations/03-BarChart";
import { SlideshowAnimation } from "./animations/04-Slideshow";
import { CounterAnimation } from "./animations/05-Counter";
import { FadeSlideAnimation } from "./animations/06-FadeSlide";
import { PieChartAnimation } from "./animations/07-PieChart";
import { SkillsPresentationAnimation } from "./animations/08-SkillsPresentation";

const W = 1280;
const H = 720;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="01-Typewriter"
        component={TypewriterAnimation}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="02-SpringBounce"
        component={SpringBounceAnimation}
        durationInFrames={4 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="03-BarChart"
        component={BarChartAnimation}
        durationInFrames={4 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="04-Slideshow"
        component={SlideshowAnimation}
        durationInFrames={Math.round((2.5 + 3 + 3.5) * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="05-Counter"
        component={CounterAnimation}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="06-EasingCurves"
        component={FadeSlideAnimation}
        durationInFrames={6 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="07-PieChart"
        component={PieChartAnimation}
        durationInFrames={4 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      <Composition
        id="08-SkillsPresentation"
        component={SkillsPresentationAnimation}
        durationInFrames={Math.round((3 + 3.5 + 4 + 4 + 3.5 + 4) * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
