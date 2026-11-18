"use client";

import type { ReactNode } from "react";
import { setLanguage, useLanguage, type Language } from "@/lib/language";
import { cn } from "@/lib/utils";

/**
 * EN / தமிழ் switch. The choice is kept in the browser and shared with the pages that
 * have both languages (for now the author page); the rest of the copy isn't translated yet.
 */
export function LanguageSwitch() {
  const language = useLanguage();

  const option = (value: Language, label: ReactNode, srLabel: string) => (
    <button
      type="button"
      onClick={() => setLanguage(value)}
      aria-pressed={language === value}
      className={cn(
        "flex h-8 items-center px-3 text-sm transition-colors",
        language === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className="sr-only">{srLabel}</span>
    </button>
  );

  return (
    <div role="group" aria-label="Language" className="flex items-center border">
      {/* "jkpo;" draws தமிழ் in the Mallikai legacy font */}
      {option(
        "ta",
        <span aria-hidden className="font-mallikai text-lg leading-none">
          jkpo;
        </span>,
        "தமிழ்"
      )}
      {option("en", <span>EN</span>, "")}
    </div>
  );
}
