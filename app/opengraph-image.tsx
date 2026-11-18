import { ImageResponse } from "next/og";
import { Product } from "@/components/og/product";
import { books } from "@/lib/books";
import { Mallikai, OG_SIZE, OgBrand, ogFonts, publicDataUri } from "@/lib/og";

export const alt = "Ezhupira (எழுபிர) · Tamil books & poetry by Prasanth J";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const cover = books.find((b) => b.status === "published" && b.cover)?.cover;
  return new ImageResponse(
    (
      <Product
        brand={<OgBrand />}
        logo={await publicDataUri("/icon-192.png")}
        title={
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span>Tamil books &amp; poetry</span>
            <Mallikai>gpurhe;j;.n[</Mallikai>
          </span>
        }
        titleSize={68}
        description="Read previews, pre-order new releases and buy Tamil poetry by Prasanth J."
        footer="ezhupira.in"
        image={cover ? await publicDataUri(cover) : undefined}
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
