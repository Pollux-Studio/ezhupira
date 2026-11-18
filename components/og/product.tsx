import type { ReactNode } from "react";
import { Badge } from "@/components/og/badge";
import { BrandMark } from "@/components/og/brand-mark";

// From @ogimagecn/product, adapted to Ezhupira: paper background with the brand red, a
// title slot that takes Mallikai-drawn Tamil (Satori can't shape Unicode Tamil), and a
// 5:8 portrait panel so book covers aren't stretched into a square.

export const OG_COLORS = { paper: "#F7F3EA", ink: "#1A1A1A", muted: "#57534E", red: "#D51C39" };

export interface ProductProps {
  brand: ReactNode;
  title: ReactNode;
  /** Font size for the title; Mallikai glyphs read smaller than Latin, so it's set by the caller. */
  titleSize?: number;
  description: ReactNode;
  price?: string;
  /** Bottom-right text, e.g. the page URL. */
  footer?: string;
  /** Portrait image (book cover), PNG/JPEG URL or data URI. */
  image?: string;
  logo?: string;
}

const PANEL_H = 630 - 2 * 64;
const PANEL_W = Math.round((PANEL_H * 5) / 8);

export const Product = ({ brand, title, titleSize = 76, description, price, footer, image, logo }: ProductProps) => (
  <div
    style={{
      backgroundColor: OG_COLORS.paper,
      borderBottom: `16px solid ${OG_COLORS.red}`,
      color: OG_COLORS.ink,
      display: "flex",
      fontFamily: "Geist",
      height: "100%",
      padding: "64px 72px 48px",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        paddingRight: "56px",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
        <BrandMark background={OG_COLORS.red} radius={8} size={72} src={logo} />
        <div style={{ display: "flex", fontSize: "34px", fontWeight: 700 }}>{brand}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.1, maxWidth: "640px" }}>
          {title}
        </div>
        <div
          style={{
            color: OG_COLORS.muted,
            display: "flex",
            fontSize: "32px",
            lineHeight: 1.4,
            marginTop: "20px",
            maxWidth: "620px",
          }}
        >
          {description}
        </div>
      </div>

      <div style={{ alignItems: "center", display: "flex", gap: "24px" }}>
        {price && (
          <Badge background={OG_COLORS.red} color="#ffffff" style={{ fontSize: "32px", fontWeight: 700, padding: "12px 30px" }}>
            {price}
          </Badge>
        )}
        {footer && <div style={{ color: OG_COLORS.red, display: "flex", fontSize: "28px", fontWeight: 600 }}>{footer}</div>}
      </div>
    </div>

    {image ? (
      <img
        alt=""
        height={PANEL_H}
        src={image}
        width={PANEL_W}
        style={{ borderRadius: "6px", boxShadow: "0 24px 48px rgba(0,0,0,0.25)", objectFit: "cover" }}
      />
    ) : null}
  </div>
);
