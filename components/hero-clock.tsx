"use client";

import FlipClock from "@/components/8starlabs-ui/flip-clock";
import { RELEASE_AT } from "@/lib/release";

/** Flip-clock countdown to the release, sized for phones and for larger screens. */
export function HeroClock({ target }: { target?: string }) {
  const to = target ? new Date(target) : RELEASE_AT;
  return (
    <div className="flex flex-col items-center gap-2">
      <FlipClock countdown targetDate={to} showDays="always" size="xs" className="sm:hidden" />
      <FlipClock countdown targetDate={to} showDays="always" size="lg" className="hidden sm:flex" />
      <p className="bg-background px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Days : Hours : Minutes : Seconds
      </p>
    </div>
  );
}
