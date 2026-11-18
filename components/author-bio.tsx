"use client";

import { AUTHOR_BIO_EN, AUTHOR_BIO_TA } from "@/lib/author";
import { useLanguage } from "@/lib/language";

/** The author's own words, in the language picked in the header (Tamil by default). */
export function AuthorBio() {
  const language = useLanguage();

  if (language === "en") {
    return (
      <div lang="en" className="space-y-4 text-base leading-loose">
        {AUTHOR_BIO_EN.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    );
  }

  // JF Devadas draws Tamil from its own codes: show those, and give screen readers and
  // search the real Unicode text.
  return (
    <div lang="ta" className="space-y-3 text-xl leading-snug sm:text-2xl sm:leading-snug">
      {AUTHOR_BIO_TA.map((paragraph, i) => (
        <p key={i}>
          <span aria-hidden className="font-devadas">
            {paragraph.devadas}
          </span>
          <span className="sr-only">{paragraph.unicode}</span>
        </p>
      ))}
    </div>
  );
}
