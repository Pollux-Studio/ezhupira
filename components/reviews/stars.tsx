"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Read-only star rating. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn("size-4", n <= value ? "fill-primary text-primary" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

const LABELS = ["", "Didn't like it", "It was okay", "Liked it", "Really liked it", "Loved it"];

/** Star picker with hover preview and a word for the chosen rating. */
export function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}: ${LABELS[n]}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star aria-hidden className={cn("size-7 transition-colors", n <= shown ? "fill-primary text-primary" : "text-muted-foreground/50")} />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground" aria-hidden>
        {LABELS[shown]}
      </span>
    </div>
  );
}
