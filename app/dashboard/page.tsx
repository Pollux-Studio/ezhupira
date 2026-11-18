import type { Metadata } from "next";
import { PreorderForm } from "@/components/preorder-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { books } from "@/lib/books";
import { RELEASE_LABEL } from "@/lib/release";

export const metadata: Metadata = {
  title: "Pre-order",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  const upcoming = books.find((b) => b.status === "upcoming");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Your dashboard</h1>
          <p className="text-muted-foreground">Releases {RELEASE_LABEL}</p>
        </div>
        {upcoming ? (
          <PreorderForm bookTitle={upcoming.title} />
        ) : (
          <p className="text-muted-foreground">No upcoming book is open for pre-order right now.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
