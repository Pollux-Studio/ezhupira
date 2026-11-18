"use client";

import { useLanguage } from "@/lib/language";

/** Short text in the language picked in the header (Tamil by default). */
export function LocalizedText({ ta, en }: { ta: string; en: string }) {
  const language = useLanguage();
  return language === "en" ? <span lang="en">{en}</span> : <span lang="ta">{ta}</span>;
}
