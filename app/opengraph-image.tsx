import { ImageResponse } from "next/og";
import { Logo } from "@/components/og/logo";
import { Mallikai, OG_SIZE, ogFonts, publicDataUri } from "@/lib/og";

export const alt = "Ezhupira (எழுபிர) · Tamil books & poetry by Prasanth J";
export const size = OG_SIZE;
export const contentType = "image/png";

// Site-wide card: the brand logo, not a book. Book pages have their own card with the cover.
export default async function Image() {
  const [logo, fonts] = await Promise.all([publicDataUri("/icon-512.png"), ogFonts()]);
  return new ImageResponse(
    (
      <Logo
        logo={logo}
        brand={
          <>
            {/* Separate flex items with explicit margins: Satori ignores gap here. */}
            <span style={{ display: "flex" }}>
              <Mallikai>vOgpu</Mallikai>
            </span>
            <span style={{ color: "#D51C39", display: "flex", margin: "0 28px" }}>·</span>
            <span style={{ display: "flex" }}>Ezhupira</span>
          </>
        }
        tagline="Tamil books & poetry by Prasanth J"
        footer="ezhupira.in"
      />
    ),
    { ...size, fonts },
  );
}
