import { SideNoise } from "@/components/side-noise";

/**
 * The site's red dithered noise (BitmapNoise), placed by page type. One rule everywhere:
 *
 * - "top"  Single-column pages (login, support, an order…): a band right under the header,
 *          the same height as the author page's banner; the page's card rises into it.
 * - "side" Pages with a left column (book, pre-order, profile): a vertical strip from the left
 *          edge into that column on wide screens, and the "top" band on phones.
 *
 * Hero pages (home, author) put the noise behind their hero instead (HeroBackground).
 * The parent must be `relative isolate` so the noise sits behind the content.
 */
export function PageNoise({
  variant,
  container = "64rem",
  reach = "9rem",
}: {
  variant: "top" | "side";
  /** Max width of the page's content (for "side"), so the strip lines up with the layout. */
  container?: string;
  /** How far the strip reaches into the content from its left edge (for "side"). */
  reach?: string;
}) {
  const band = "pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 sm:h-48";
  if (variant === "top") return <SideNoise className={band} />;
  return (
    <>
      <SideNoise
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden md:block"
        style={{ width: `calc((100vw - min(100vw, ${container})) / 2 + 1rem + ${reach})` }}
      />
      <SideNoise className={`${band} md:hidden`} />
    </>
  );
}

/** Top padding that lets a page's first card overlap the "top" band (about two-thirds down it). */
export const TOP_NOISE_OFFSET = "pt-24 sm:pt-32";
