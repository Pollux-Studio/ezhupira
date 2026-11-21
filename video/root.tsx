import { Composition } from "remotion";
import { SignatureWriting } from "./signature-writing";

const FPS = 60;
const SECONDS = 6;

/** 4K, 60 fps: landscape (16:9) and vertical (9:16, reels/stories). */
export function Root() {
  return (
    <>
      <Composition
        id="signature-16x9"
        component={SignatureWriting}
        width={3840}
        height={2160}
        fps={FPS}
        durationInFrames={FPS * SECONDS}
        defaultProps={{ width: 1350 }}
      />
      <Composition
        id="signature-9x16"
        component={SignatureWriting}
        width={2160}
        height={3840}
        fps={FPS}
        durationInFrames={FPS * SECONDS}
        defaultProps={{ width: 1150 }}
      />
    </>
  );
}
