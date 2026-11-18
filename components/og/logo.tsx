import type { ReactNode } from "react";
import { BrandMark } from "@/components/og/brand-mark";
import { OG_COLORS } from "@/components/og/product";

// From @ogimagecn/logo, adapted to Ezhupira: paper background with a soft red glow, the
// red logo tile, a wordmark slot that takes Mallikai-drawn Tamil, and the site URL.

export interface LogoProps {
  brand: ReactNode;
  tagline?: ReactNode;
  /** Bottom text, e.g. the domain. */
  footer?: string;
  /** Logo PNG/JPEG URL or data URI. */
  logo?: string;
}

export const Logo = ({ brand, tagline, footer, logo = "" }: LogoProps) => (
  <div
    style={{
      alignItems: "center",
      backgroundColor: OG_COLORS.paper,
      backgroundImage: "radial-gradient(circle at 50% 38%, rgba(213,28,57,0.16), transparent 58%)",
      borderBottom: `16px solid ${OG_COLORS.red}`,
      color: OG_COLORS.ink,
      display: "flex",
      flexDirection: "column",
      fontFamily: "Geist",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    }}
  >
    <BrandMark
      background={OG_COLORS.red}
      radius={16}
      size={190}
      src={logo}
      style={{ boxShadow: "0 24px 70px rgba(213,28,57,0.35)" }}
    />

    <div style={{ alignItems: "center", display: "flex", fontSize: "88px", gap: "28px", marginTop: "40px" }}>{brand}</div>

    {tagline ? (
      <div style={{ color: OG_COLORS.muted, display: "flex", fontSize: "36px", marginTop: "14px" }}>{tagline}</div>
    ) : null}

    {footer ? (
      <div style={{ color: OG_COLORS.red, display: "flex", fontSize: "30px", fontWeight: 600, marginTop: "36px" }}>{footer}</div>
    ) : null}
  </div>
);
