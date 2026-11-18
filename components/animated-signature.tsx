"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SIGNATURE_FILL, SIGNATURE_PEN, SIGNATURE_STROKES, SIGNATURE_VIEWBOX } from "@/lib/signature-paths";

/** Pen lift between strokes of the same letter, and the slightly longer pause between letters. */
const LIFT_SECONDS = 0.015;
const LETTER_PAUSE_SECONDS = 0.05;

const TOTAL_LENGTH = SIGNATURE_STROKES.reduce((sum, s) => sum + s.len, 0);

// The mask must cover the whole signature. Without an explicit area, SVG defaults to a
// box that starts near the origin, which crops the top of அன்புடன் (it sits above y = 0).
const [VB_X, VB_Y, VB_W, VB_H] = SIGNATURE_VIEWBOX.split(" ").map(Number);

/** Lay every stroke on one timeline in signing order; returns the strokes and total seconds. */
function buildTimeline(drawSeconds: number, startDelay: number) {
  let cursor = startDelay;
  const strokes = SIGNATURE_STROKES.map((stroke, i) => {
    const prev = SIGNATURE_STROKES[i - 1];
    if (prev) cursor += prev.letter === stroke.letter ? LIFT_SECONDS : LETTER_PAUSE_SECONDS;
    const duration = Math.max(0.04, (stroke.len / TOTAL_LENGTH) * drawSeconds);
    const timed = {
      d: stroke.d,
      width: stroke.w * SIGNATURE_PEN.oversize + SIGNATURE_PEN.extra,
      delay: cursor,
      duration,
    };
    cursor += duration;
    return timed;
  });
  return { strokes, end: cursor };
}

type TimedStroke = ReturnType<typeof buildTimeline>["strokes"][number];

const PEN_VARIANTS = {
  // Zero width until its turn: a round-capped stroke of length 0 would otherwise
  // already show as a dot inside the mask.
  hidden: { pathLength: 0, strokeWidth: 0 },
  visible: (s: TimedStroke) => ({
    pathLength: 1,
    strokeWidth: s.width,
    transition: {
      pathLength: { delay: s.delay, duration: s.duration, ease: "easeInOut" as const },
      strokeWidth: { delay: s.delay, duration: 0.01 },
    },
  }),
};

/** Seconds the signature takes to write (for timing things around it). */
export function signatureDuration(drawSeconds = 1.3, delay = 0) {
  return buildTimeline(drawSeconds, delay).end;
}

export type AnimatedSignatureProps = {
  /** Size/colour via classes; the ink uses `currentColor` (e.g. `w-64 text-primary`). */
  className?: string;
  /** Seconds of pen movement for the whole signature. */
  drawSeconds?: number;
  /** Seconds to wait before the pen starts. */
  delay?: number;
  /** Start writing when scrolled into view instead of on mount. */
  inView?: boolean;
  /** With `inView`: write only the first time it appears. */
  once?: boolean;
  /** Called once the last stroke is written. */
  onComplete?: () => void;
  /** Accessible label; pass `null` to mark it decorative. */
  label?: string | null;
  /** Write it again and again: after each signature, hold for `holdSeconds`, then restart. */
  loop?: boolean;
  /** With `loop`: seconds the finished signature stays before it's written again. */
  holdSeconds?: number;
};

/**
 * Prasanth's signature (அன்புடன் / பிரசாந்த்), written letter by letter: each letter
 * finished before the next, pulli after its letter, ச before ா, underline last.
 *
 *   <AnimatedSignature className="w-56 text-primary" />
 *   <AnimatedSignature className="w-40" inView delay={0.3} onComplete={...} />
 *   <AnimatedSignature className="w-48" loop holdSeconds={3} />
 */
export function AnimatedSignature({ loop = false, holdSeconds = 2.5, onComplete, ...props }: AnimatedSignatureProps) {
  const reduceMotion = useReducedMotion();
  const [round, setRound] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleComplete = () => {
    onComplete?.();
    // Remounting with a new key starts the writing over (not with reduced motion, where
    // the signature is simply shown).
    if (loop && !reduceMotion) {
      timer.current = window.setTimeout(() => setRound((r) => r + 1), holdSeconds * 1000);
    }
  };

  return <SignatureWriting key={round} {...props} onComplete={handleComplete} />;
}

function SignatureWriting({
  className,
  drawSeconds = 1.3,
  delay = 0,
  inView = false,
  once = true,
  onComplete,
  label = "அன்புடன் பிரசாந்த்",
}: Omit<AnimatedSignatureProps, "loop" | "holdSeconds">) {
  const reduceMotion = useReducedMotion();
  const maskId = `signature-pen-${useId().replace(/:/g, "")}`;
  const { strokes } = useMemo(() => buildTimeline(drawSeconds, delay), [drawSeconds, delay]);

  // Keep the latest callback without re-running effects when the parent re-renders.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // With reduced motion the signature appears at once, so it's complete immediately.
  useEffect(() => {
    if (reduceMotion) onCompleteRef.current?.();
  }, [reduceMotion]);

  const trigger = reduceMotion
    ? { initial: false as const, animate: "visible" }
    : inView
      ? { initial: "hidden", whileInView: "visible", viewport: { once } }
      : { initial: "hidden", animate: "visible" };

  return (
    <motion.svg
      viewBox={SIGNATURE_VIEWBOX}
      className={cn("block h-auto w-64 overflow-visible", className)}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      {...trigger}
    >
      <defs>
        {/* The pen: centre-line strokes in signing order, revealing the ink below. */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={VB_X - 10}
          y={VB_Y - 10}
          width={VB_W + 20}
          height={VB_H + 20}
        >
          {strokes.map((stroke, i) => (
            <motion.path
              key={i}
              d={stroke.d}
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
              custom={stroke}
              variants={PEN_VARIANTS}
              onAnimationComplete={
                i === strokes.length - 1
                  ? (definition) => {
                      if (definition === "visible" && !reduceMotion) onCompleteRef.current?.();
                    }
                  : undefined
              }
            />
          ))}
        </mask>
      </defs>

      {/* The ink: smooth outlines from Figma, revealed as the pen writes. */}
      <path d={SIGNATURE_FILL} fill="currentColor" fillRule="evenodd" mask={`url(#${maskId})`} />
    </motion.svg>
  );
}
