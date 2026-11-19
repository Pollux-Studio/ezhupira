import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track the status of your Ezhupira book pre-order or purchase.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <>
      <SiteHeader />
      <main className={`relative isolate flex w-full flex-1 justify-center px-6 pb-16 ${TOP_NOISE_OFFSET}`}>
        <PageNoise variant="top" />
        <div className="w-full max-w-sm">
          <TrackOrderForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
