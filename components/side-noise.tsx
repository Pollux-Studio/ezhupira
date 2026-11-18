"use client";

import type { CSSProperties } from "react";
import BitmapNoise from "@/components/bitmap-noise";

/**
 * The hero's red dithered noise as a vertical strip, for placing behind content.
 * Decorative; pauses off screen and redraws only 15 times a second.
 */
export function SideNoise({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden className={className} style={style}>
      <BitmapNoise
        scale={1.2}
        speed={0.4}
        patch={0.42}
        density={0.36}
        cell={6}
        fps={15}
        dither="bayer8"
        color="#D51C39"
        background={null}
      />
    </div>
  );
}
