import type { Metadata, Viewport } from "next";
import { Anton, Caveat, Courier_Prime, Fraunces, Geist_Mono, IBM_Plex_Mono, Inter, Noto_Sans_Tamil } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SignaturePreloader } from "@/components/signature-preloader";
import { StretchyFooter } from "@/components/ui/stretchy-footer";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/json-ld";
import { SessionProvider } from "@/components/auth/session";
import { AUTHOR, SITE, SITE_URL, organizationLd, personLd, websiteLd } from "@/lib/site";

// Fonts used by the paper theme.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Unicode Tamil text (Inter has no Tamil). Brand Tamil (titles, names) uses Mallikai.
const notoSansTamil = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-noto-tamil" });
const frauncesDisplay = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const ibmPlexMonoReceipt = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-receipt" });
const courierPrimeType = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-type" });
const caveatHand = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const antonStamp = Anton({ subsets: ["latin"], weight: ["400"], variable: "--font-stamp" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mallikai = localFont({
  src: "../Mallikai Regular.ttf",
  variable: "--font-mallikai-next",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.titleSuffix} · ${SITE.tagline}`,
    template: `%s · ${SITE.titleSuffix}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: SITE.name,
  category: "books",
  openGraph: {
    type: "website",
    siteName: `${SITE.name} (${SITE.nameTa})`,
    locale: SITE.locale,
    alternateLocale: ["en_IN"],
    url: "/",
    title: `${SITE.titleSuffix} · ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.titleSuffix} · ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Set these env vars to the tokens from Google Search Console / Bing Webmaster Tools.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F3EA" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ta-IN"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistMono.variable,
        mallikai.variable,
        inter.variable,
        notoSansTamil.variable,
        frauncesDisplay.variable,
        ibmPlexMonoReceipt.variable,
        courierPrimeType.variable,
        caveatHand.variable,
        antonStamp.variable
      )}
    >
      <head>
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <JsonLd data={[organizationLd, websiteLd, personLd]} />
        {/* Without JavaScript the preloader could never dismiss itself, so hide it. */}
        <noscript>
          <style>{`.signature-preloader{display:none!important}`}</style>
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <SignaturePreloader />
            {/* The page lifts on a spring when you scroll past the bottom (StretchyFooter). */}
            <div data-stretchy-page className="flex flex-1 flex-col overflow-x-clip">
              {children}
            </div>
            <StretchyFooter windowScroll />
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
