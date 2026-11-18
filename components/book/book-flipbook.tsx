"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Flip-through preview of a book: cover, the first few pages, and an "end of preview" page.
 *
 * Only pre-rendered preview images are ever sent to the browser (see
 * scripts/render-preview.py) — the full book is never served. Pages are drawn on a canvas
 * (no <img> elements to right-click → "save image"), and the context menu and dragging are
 * disabled. Nothing on a screen can be fully protected from screenshots, but the rest of
 * the book cannot be reached through the site at all.
 */
export function BookFlipbook({
  pages,
  title,
  endAction,
  className,
}: {
  /** Image URLs: cover first, then preview pages, then the end-of-preview page. */
  pages: string[];
  title: string;
  /** Clickable button shown on the end-of-preview page (e.g. buy link). */
  endAction?: { href: string; label: string };
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [page, setPage] = useState(0);
  const [settled, setSettled] = useState(true);
  const last = pages.length - 1;
  // Re-initialise only when the actual list of pages changes, not on every re-render.
  const pagesKey = pages.join("|");

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;
    // page-flip's destroy() removes the element it was given, so give it a fresh child
    // every time — never the React-owned box (that's what made the flipbook vanish).
    const mount = document.createElement("div");
    mount.style.cssText = "width:100%;height:100%";
    box.appendChild(mount);

    import("page-flip/dist/js/page-flip.module.js").then(({ PageFlip }) => {
      if (cancelled) return;
      const flip = new PageFlip(mount, {
        width: 450,
        height: 720,
        size: "stretch",
        // page-flip shows one page when the box is narrower than 2 × minWidth; this box is
        // always single-page, so keep that threshold above any width it can have.
        minWidth: 800,
        maxWidth: 900,
        minHeight: 200,
        maxHeight: 1440,
        usePortrait: true,
        showCover: true,
        maxShadowOpacity: 0.35,
        flippingTime: 650,
        mobileScrollSupport: true,
      });
      flip.on("init", () => setPage(0));
      flip.on("flip", (e) => setPage(e.data));
      // At rest ("read", or just hovering a corner) vs. mid-turn: hide the end-page
      // button while a page is moving.
      flip.on("changeState", (e) => setSettled(e.data === "read" || e.data === "fold_corner"));
      flip.loadFromImages(pagesKey.split("|"));
      flipRef.current = flip;
    });

    return () => {
      cancelled = true;
      flipRef.current?.destroy();
      flipRef.current = null;
      mount.remove();
    };
  }, [pagesKey]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") flipRef.current?.flipNext();
    if (e.key === "ArrowLeft") flipRef.current?.flipPrev();
  }

  const atEnd = page === last;
  const label = page === 0 ? "Cover" : atEnd ? "End of preview" : `Page ${page} of ${last - 1}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="region"
        aria-roledescription="flipbook"
        aria-label={`Preview of ${title}. Use the arrow keys or the buttons to turn pages.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        // Discourage saving the preview pages.
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="relative rounded-lg outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* page-flip draws the pages into a canvas inside this box (5:8, one page).
            Its forced min-width/height is reset in globals.css. */}
        <div
          ref={boxRef}
          className="aspect-[5/8] w-full overflow-hidden rounded-lg bg-muted shadow-xl ring-1 ring-foreground/10"
        />

        {/* The end page leaves room at the bottom for a real, clickable button. */}
        {endAction && atEnd && settled && (
          <div className="absolute inset-x-0 bottom-[13%] flex justify-center px-[12%]">
            <a
              href={endAction.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "w-full gap-1.5 shadow-lg")}
            >
              {endAction.label}
              <ArrowUpRight aria-hidden />
            </a>
          </div>
        )}
      </div>

      {/* Grouped at the book's right edge (clear of the red strip on the book page) */}
      <div className="flex items-center justify-between gap-2 md:justify-end">
        <p aria-live="polite" className="order-2 text-xs text-muted-foreground tabular-nums md:order-none md:mr-1">
          {label}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => flipRef.current?.flipPrev()}
          className="order-1 bg-background md:order-none"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          className="order-3 bg-background md:order-none"
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Next page"
          disabled={atEnd}
          onClick={() => flipRef.current?.flipNext()}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
