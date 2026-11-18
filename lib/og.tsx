// Shared pieces for the opengraph-image routes (components/og/* from @ogimagecn).
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

/** A public/ file as a data URI. Satori decodes PNG and JPEG only (no WebP/SVG). */
export async function publicDataUri(publicPath: string) {
  const ext = path.extname(publicPath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${(await readFile(path.join(process.cwd(), "public", publicPath))).toString("base64")}`;
}

/**
 * Geist (next/og's own default, copied to assets/fonts) for Latin text, listed first so it is
 * the default; passing any font replaces next/og's built-in one. Mallikai draws Tamil from
 * Latin key codes, already in visual order, so it needs no shaping. Use it via <Mallikai>.
 */
export async function ogFonts() {
  const [geist, mallikai] = await Promise.all([
    readFile(path.join(process.cwd(), "assets", "fonts", "Geist-Regular.ttf")),
    readFile(path.join(process.cwd(), "Mallikai Regular.ttf")),
  ]);
  return [
    { name: "Geist", data: geist, style: "normal" as const, weight: 400 as const },
    { name: "Mallikai", data: mallikai, style: "normal" as const, weight: 400 as const },
  ];
}

/** Tamil text typed in Mallikai's key code (see scripts/to-mallikai.py). */
export function Mallikai({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: "Mallikai", fontWeight: 400 }}>{children}</span>;
}

/** "எழுபிர · Ezhupira" brand line. */
export function OgBrand() {
  return (
    <span style={{ alignItems: "center", display: "flex", gap: "14px" }}>
      <Mallikai>vOgpu</Mallikai>
      <span>· Ezhupira</span>
    </span>
  );
}
