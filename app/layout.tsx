import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mallikai = localFont({
  src: "../Mallikai Regular.ttf",
  variable: "--font-mallikai-next",
});

export const metadata: Metadata = {
  title: "எழுபிற | தமிழ் பதிப்பகம்",
  description:
    "எழுபிற - தமிழ் புத்தக வெளியீடு, முன்னோட்டம், முன்பதிவு, மற்றும் வாசகர் அனுபவங்களுக்கான பதிப்பக தளம்.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ta-IN"
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        mallikai.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
