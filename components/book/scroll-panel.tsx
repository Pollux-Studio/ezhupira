"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The scrolling right-hand column of the book page (tablets and up).
 *
 * The page itself never scrolls there, so a mouse wheel anywhere on the page scrolls this
 * column instead — it feels like a normal page while the left side stays put. Wheel events
 * are also kept from reaching the site's stretchy footer, which would otherwise lift the
 * whole (deliberately static) page.
 */
export function ScrollPanel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");

    const onWheel = (event: WheelEvent) => {
      const panel = ref.current;
      if (!panel || !desktop.matches || event.ctrlKey) return;
      // Capture phase on window: runs before the stretchy footer's listener.
      event.stopPropagation();
      if (!panel.contains(event.target as Node)) {
        event.preventDefault();
        const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        panel.scrollBy({ top: dy });
      }
    };

    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  return (
    <div ref={ref} className={cn("md:no-scrollbar md:overflow-y-auto md:overscroll-contain", className)}>
      {children}
    </div>
  );
}
