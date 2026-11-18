import { ImageResponse } from "next/og";
import { Profile } from "@/components/og/profile";
import { Mallikai, OG_SIZE, OgBrand, ogFonts, publicDataUri } from "@/lib/og";

export const alt = "Prasanth J (பிரசாந்த்.ஜெ) · Tamil poet and author · Ezhupira";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [avatar, logo, fonts] = await Promise.all([
    publicDataUri("/author-profile.png"),
    publicDataUri("/icon-192.png"),
    ogFonts(),
  ]);
  return new ImageResponse(
    (
      <Profile
        brand={<OgBrand />}
        logo={logo}
        nameTa={<Mallikai>gpurhe;j;.n[</Mallikai>}
        name="Prasanth J"
        role="Tamil poet & author"
        bio="Translating the inner world of the mind into words."
        highlight={
          <span style={{ alignItems: "center", display: "flex", gap: "12px" }}>
            <span>Author of</span>
            <Mallikai>ehd; ahu;?</Mallikai>
          </span>
        }
        avatar={avatar}
        website="ezhupira.in/author"
      />
    ),
    { ...size, fonts },
  );
}
