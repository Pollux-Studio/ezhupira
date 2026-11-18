import type { ReactNode } from "react";
import { Avatar } from "@/components/og/avatar";
import { Badge } from "@/components/og/badge";
import { BrandMark } from "@/components/og/brand-mark";
import { OG_COLORS } from "@/components/og/product";

// From @ogimagecn/profile, adapted to Ezhupira's author card: brand row on top, a large
// portrait with a red ring, the name in Tamil (Mallikai) and English, a short bio, and a
// "known for" pill.

export interface ProfileProps {
  /** Name in Tamil, drawn with Mallikai by the caller. */
  nameTa: ReactNode;
  name: string;
  role: string;
  bio: ReactNode;
  avatar?: string;
  website: string;
  brand?: ReactNode;
  logo?: string;
  /** Pill under the bio, e.g. the author's book. */
  highlight?: ReactNode;
}

export const Profile = ({ nameTa, name, role, bio, avatar, website, brand, logo, highlight }: ProfileProps) => (
  <div
    style={{
      backgroundColor: OG_COLORS.paper,
      backgroundImage: "radial-gradient(circle at 18% 60%, rgba(213,28,57,0.14), transparent 45%)",
      borderBottom: `16px solid ${OG_COLORS.red}`,
      color: OG_COLORS.ink,
      display: "flex",
      flexDirection: "column",
      fontFamily: "Geist",
      height: "100%",
      padding: "52px 72px 40px",
      width: "100%",
    }}
  >
    <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
      <div style={{ alignItems: "center", display: "flex", gap: "16px" }}>
        <BrandMark background={OG_COLORS.red} radius={8} size={56} src={logo} />
        <div style={{ display: "flex", fontSize: "28px" }}>{brand}</div>
      </div>
      <div style={{ color: OG_COLORS.red, display: "flex", fontSize: "26px", fontWeight: 600 }}>{website}</div>
    </div>

    <div style={{ alignItems: "center", display: "flex", flex: 1, gap: "64px" }}>
      <Avatar
        background={OG_COLORS.red}
        name={name}
        size={340}
        src={avatar}
        style={{ border: `6px solid ${OG_COLORS.red}`, fontSize: "120px" }}
      />

      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: "84px", lineHeight: 1.05 }}>{nameTa}</div>
        <div style={{ display: "flex", fontSize: "44px", marginTop: "8px" }}>{name}</div>
        <div style={{ color: OG_COLORS.red, display: "flex", fontSize: "32px", fontWeight: 600, marginTop: "14px" }}>{role}</div>
        <div style={{ color: OG_COLORS.muted, display: "flex", fontSize: "27px", lineHeight: 1.4, marginTop: "18px", maxWidth: "600px" }}>
          {bio}
        </div>
        {highlight ? (
          <Badge
            background="#ffffff"
            borderColor="rgba(26,26,26,0.15)"
            color={OG_COLORS.ink}
            style={{ alignSelf: "flex-start", fontWeight: 400, marginTop: "26px", padding: "10px 24px" }}
          >
            {highlight}
          </Badge>
        ) : null}
      </div>
    </div>
  </div>
);
