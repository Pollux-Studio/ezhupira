import { ImageResponse } from "next/og";
import { Profile } from "@/components/og/profile";
import { OG_SIZE, publicDataUri } from "@/lib/og";

export const alt = "Prasanth J (பிரசாந்த்.ஜெ) · Tamil poet and author";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <Profile
        name="Prasanth J"
        role="Tamil poet & author"
        bio="Translating the inner world of the mind into words. Naan Yaar? and more on Ezhupira."
        avatar={await publicDataUri("/author-profile.png")}
        website="ezhupira.in/author"
      />
    ),
    { ...size },
  );
}
