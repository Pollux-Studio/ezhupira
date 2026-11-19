import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise";
import { SupportForm } from "@/components/support-form";

export const metadata: Metadata = {
  title: "Contact support",
  description: "Get help with an Ezhupira order, payment, book or account. We reply by email.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <div className="relative isolate flex flex-1 flex-col">
        <PageNoise variant="top" />
        <main className={`mx-auto w-full max-w-xl flex-1 px-4 pb-16 ${TOP_NOISE_OFFSET}`}>
          <SupportForm />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
