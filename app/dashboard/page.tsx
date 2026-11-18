import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RELEASE_LABEL } from "@/lib/release";

export const metadata: Metadata = {
  title: "Pre-order",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-4 py-10">
        <Dashboard releaseLabel={RELEASE_LABEL} />
      </main>
      <SiteFooter />
    </>
  );
}
