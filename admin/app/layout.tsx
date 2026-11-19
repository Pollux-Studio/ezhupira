import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { AdminGate } from "@/components/admin-gate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// The website's brand Tamil font, to preview titles exactly as the site shows them.
const mallikai = localFont({ src: "./fonts/mallikai.ttf", variable: "--font-mallikai" });

export const metadata: Metadata = {
  title: { default: "Ezhupira admin", template: "%s · Ezhupira admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mallikai.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <AdminGate>{children}</AdminGate>
      </body>
    </html>
  );
}
