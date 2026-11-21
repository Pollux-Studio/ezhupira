"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { AnimatedSignature } from "@/components/animated-signature";

/** How long the finished signature stays before the site appears. */
const HOLD_SECONDS = 0.25;

const PRELOADED_EVENT = "ezhupira:preloaded";

function markPreloaded() {
  document.documentElement.dataset.preloaded = "true";
  window.dispatchEvent(new Event(PRELOADED_EVENT));
}

/**
 * Runs `fn` once the preloader has faded out (at once if it's already gone or not on the
 * page), so things like the order page's confetti aren't hidden behind it. Returns a cleanup.
 */
export function afterPreloader(fn: () => void) {
  if (document.documentElement.dataset.preloaded || !document.querySelector(".signature-preloader")) {
    fn();
    return () => {};
  }
  window.addEventListener(PRELOADED_EVENT, fn, { once: true });
  return () => window.removeEventListener(PRELOADED_EVENT, fn);
}

/**
 * Full-screen preloader: the signature writes itself, then the site fades in once the
 * page has loaded too.
 */
export function SignaturePreloader() {
  const [written, setWritten] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const visible = !(written && loaded);

  const handleComplete = useCallback(() => {
    window.setTimeout(() => setWritten(true), HOLD_SECONDS * 1000);
  }, []);

  useEffect(() => {
    const done = () => setLoaded(true);
    if (document.readyState === "complete") {
      const id = window.setTimeout(done, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", done, { once: true });
    return () => window.removeEventListener("load", done);
  }, []);

  // Keep the page from scrolling underneath while the signature is on screen.
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={markPreloaded}>
      {visible && (
        <motion.div
          key="signature-preloader"
          className="signature-preloader fixed inset-0 z-[100] flex items-center justify-center bg-background text-primary"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          role="status"
          aria-label="Loading — அன்புடன் பிரசாந்த்"
        >
          <AnimatedSignature className="w-[min(56vw,260px)]" label={null} onComplete={handleComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
