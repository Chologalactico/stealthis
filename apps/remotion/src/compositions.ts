import { TypewriterAnimation } from "./animations/01-Typewriter";
import { SpringBounceAnimation } from "./animations/02-SpringBounce";
import { BarChartAnimation } from "./animations/03-BarChart";
import { SlideshowAnimation } from "./animations/04-Slideshow";
import { CounterAnimation } from "./animations/05-Counter";
import { FadeSlideAnimation } from "./animations/06-FadeSlide";
import { PieChartAnimation } from "./animations/07-PieChart";
import { SkillsPresentationAnimation } from "./animations/08-SkillsPresentation";

export const COMPOSITION_WIDTH = 1280;
export const COMPOSITION_HEIGHT = 720;
export const COMPOSITION_FPS = 30;

export const remotionCompositions = [
  {
    id: "01-Typewriter",
    title: "Typewriter",
    component: TypewriterAnimation,
    durationInFrames: 5 * COMPOSITION_FPS,
  },
  {
    id: "02-SpringBounce",
    title: "Spring Bounce",
    component: SpringBounceAnimation,
    durationInFrames: 4 * COMPOSITION_FPS,
  },
  {
    id: "03-BarChart",
    title: "Bar Chart",
    component: BarChartAnimation,
    durationInFrames: 4 * COMPOSITION_FPS,
  },
  {
    id: "04-Slideshow",
    title: "Slideshow",
    component: SlideshowAnimation,
    durationInFrames: Math.round((2.5 + 3 + 3.5) * COMPOSITION_FPS),
  },
  {
    id: "05-Counter",
    title: "Counter",
    component: CounterAnimation,
    durationInFrames: 5 * COMPOSITION_FPS,
  },
  {
    id: "06-EasingCurves",
    title: "Easing Curves",
    component: FadeSlideAnimation,
    durationInFrames: 6 * COMPOSITION_FPS,
  },
  {
    id: "07-PieChart",
    title: "Pie Chart",
    component: PieChartAnimation,
    durationInFrames: 4 * COMPOSITION_FPS,
  },
  {
    id: "08-SkillsPresentation",
    title: "Skills Presentation",
    component: SkillsPresentationAnimation,
    durationInFrames: Math.round((3 + 3.5 + 4 + 4 + 3.5 + 4) * COMPOSITION_FPS),
  },
];
