"use client";

import { useEffect, useRef } from "react";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  spin: number;
  wobble: number;
  color: string;
};

const DURATION = 3200; // ms

/**
 * One burst of paper confetti from both bottom corners, in the site's colours. Draws on a
 * full-screen canvas that ignores the pointer and removes itself when done. Skipped for
 * people who ask for reduced motion.
 */
export function Confetti({ onDone }: { onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone?.();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    // Mostly Ezhupira red, with ink and paper so it reads like torn paper, not a party store.
    const colors = [
      token("--primary", "#D51C39"),
      token("--primary", "#D51C39"),
      token("--foreground", "#222"),
      token("--muted-foreground", "#888"),
      "#F2C14E",
    ];

    const W = window.innerWidth;
    const H = window.innerHeight;
    const count = W < 640 ? 90 : 160;
    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      // Fire up and inward, roughly 55–80° from the ground.
      const angle = ((55 + Math.random() * 25) * Math.PI) / 180;
      const speed = (H / 55) * (0.75 + Math.random() * 0.5);
      return {
        x: fromLeft ? -10 : W + 10,
        y: H + 10,
        // Sideways throw scales with the screen width, so it reaches the middle on wide screens too.
        vx: (fromLeft ? 1 : -1) * (W / 75) * (0.35 + Math.random() * 0.85),
        vy: -Math.sin(angle) * speed,
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 5,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        wobble: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    const start = performance.now();
    let last = start;
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3); // in 60 fps frames
      last = now;
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = t > DURATION - 800 ? Math.max(0, (DURATION - t) / 800) : 1;

      for (const p of pieces) {
        p.vy += 0.32 * dt; // gravity
        p.vx *= 0.985 ** dt; // air
        p.vy *= 0.985 ** dt;
        p.wobble += 0.1 * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 0.6) * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        // Flip on one axis so pieces seem to tumble.
        ctx.scale(1, Math.cos(p.wobble));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (t < DURATION) frame = requestAnimationFrame(tick);
      else onDone?.();
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50 size-full" />;
}
