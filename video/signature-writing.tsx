import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { buildTimeline } from "@/components/animated-signature";
import { SIGNATURE_FILL, SIGNATURE_VIEWBOX } from "@/lib/signature-paths";

/**
 * Prasanth's signature writing itself in white on Ezhupira red: the same animation as the
 * site's preloader (components/animated-signature.tsx). Pen strokes are drawn in signing
 * order, each with motion's "easeInOut", and reveal the ink shape below. Here it is driven
 * by the video frame instead of motion, so every frame renders exactly.
 */

export const RED = "#D51C39"; // --primary, app/globals.css
const INK = "#FFFFFF";

/** Seconds of pen movement, as in the preloader (AnimatedSignature's default). */
const DRAW_SECONDS = 1.3;
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1); // motion's "easeInOut"

const [VB_X, VB_Y, VB_W, VB_H] = SIGNATURE_VIEWBOX.split(" ").map(Number);

export function SignatureWriting({ width, startSeconds = 0.8 }: { width: number; startSeconds?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { strokes } = buildTimeline(DRAW_SECONDS, startSeconds);

  return (
    <AbsoluteFill style={{ background: RED, alignItems: "center", justifyContent: "center" }}>
      <svg viewBox={SIGNATURE_VIEWBOX} width={width} height={(width * VB_H) / VB_W} style={{ overflow: "visible" }}>
        <defs>
          <mask id="pen" maskUnits="userSpaceOnUse" x={VB_X - 10} y={VB_Y - 10} width={VB_W + 20} height={VB_H + 20}>
            {strokes.map((s, i) => {
              const progress = interpolate(t, [s.delay, s.delay + s.duration], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE_IN_OUT,
              });
              // As in the preloader: no width until its turn, so a round cap doesn't show early.
              if (t < s.delay) return null;
              return (
                <path
                  key={i}
                  d={s.d}
                  fill="none"
                  stroke="white"
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - progress}
                />
              );
            })}
          </mask>
        </defs>
        <path d={SIGNATURE_FILL} fill={INK} fillRule="evenodd" mask="url(#pen)" />
      </svg>
    </AbsoluteFill>
  );
}
