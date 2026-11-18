"use client";

import BitmapNoise from "@/components/bitmap-noise";

/**
 * Full-width red dithered noise behind the hero. Purely decorative.
 * Transparent between the dots.
 */
export function HeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
    >
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
