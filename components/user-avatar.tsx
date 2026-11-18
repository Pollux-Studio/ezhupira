"use client";

import { Avatar, Style } from "@dicebear/core";
import glyphs from "@dicebear/styles/glyphs.json";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// One Style instance, reused for every avatar (DiceBear's recommendation).
const style = new Style(glyphs);

/** A DiceBear "glyphs" avatar drawn from the seed saved on the account (same seed, same avatar). */
export function UserAvatar({ seed, name, className }: { seed: string; name?: string; className?: string }) {
  const src = useMemo(() => new Avatar(style, { seed, size: 64, borderRadius: 50 }).toDataUri(), [seed]);
  return (
    // A data: URI SVG; next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name ? `${name}'s avatar` : ""} width={32} height={32} className={cn("size-8 shrink-0 rounded-full", className)} />
  );
}
