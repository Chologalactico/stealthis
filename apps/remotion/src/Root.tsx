/**
 * Root.tsx — Registers all compositions in Remotion Studio
 *
 * Each <Composition> entry defines:
 *   id              — unique name shown in the Studio sidebar
 *   component       — the React component to render
 *   durationInFrames — total length = seconds × fps
 *   fps             — frames per second (30 = cinematic, 60 = smooth UI)
 *   width / height  — canvas dimensions in pixels
 *
 * To add a new animation:
 *   1. Create your component in src/animations/
 *   2. Import it here
 *   3. Add a <Composition> entry below
 */

import "./index.css";
import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  remotionCompositions,
} from "./compositions";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {remotionCompositions.map((composition) => (
        <Composition
          key={composition.id}
          id={composition.id}
          component={composition.component}
          durationInFrames={composition.durationInFrames}
          fps={COMPOSITION_FPS}
          width={COMPOSITION_WIDTH}
          height={COMPOSITION_HEIGHT}
        />
      ))}
    </>
  );
};
