import typewriterCode from "@remotion-app/animations/01-Typewriter.tsx?raw";
import springBounceCode from "@remotion-app/animations/02-SpringBounce.tsx?raw";
import barChartCode from "@remotion-app/animations/03-BarChart.tsx?raw";
import slideshowCode from "@remotion-app/animations/04-Slideshow.tsx?raw";
import counterCode from "@remotion-app/animations/05-Counter.tsx?raw";
import fadeSlideCode from "@remotion-app/animations/06-FadeSlide.tsx?raw";
import pieChartCode from "@remotion-app/animations/07-PieChart.tsx?raw";
import skillsPresentationCode from "@remotion-app/animations/08-SkillsPresentation.tsx?raw";

export const remotionCodeById = {
  "01-Typewriter": { file: "01-Typewriter.tsx", code: typewriterCode },
  "02-SpringBounce": { file: "02-SpringBounce.tsx", code: springBounceCode },
  "03-BarChart": { file: "03-BarChart.tsx", code: barChartCode },
  "04-Slideshow": { file: "04-Slideshow.tsx", code: slideshowCode },
  "05-Counter": { file: "05-Counter.tsx", code: counterCode },
  "06-EasingCurves": { file: "06-FadeSlide.tsx", code: fadeSlideCode },
  "07-PieChart": { file: "07-PieChart.tsx", code: pieChartCode },
  "08-SkillsPresentation": { file: "08-SkillsPresentation.tsx", code: skillsPresentationCode },
} as const;
