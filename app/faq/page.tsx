import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, PackageSearch } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { nextUpcoming } from "@/lib/books";
import { getBooks } from "@/lib/catalog";
import { releaseLabel } from "@/lib/release";
import { breadcrumbLd, faqLd, faqSections } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ: orders, payments & refunds",
  description:
    "Answers about Ezhupira and the books of Prasanth J, how payment works, cancellations and refunds, shipping and order tracking.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const books = await getBooks();
  const release = releaseLabel(nextUpcoming(books)?.releaseAt);
  const sections = faqSections(books, release);

  return (
    <>
      <JsonLd
        data={[
          faqLd(sections.flatMap((s) => s.items)),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <SiteHeader />
      <div className="relative isolate flex flex-1 flex-col">
        <PageNoise variant="top" />
        <main className={`mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 pb-16 ${TOP_NOISE_OFFSET}`}>
          <header className="space-y-3 border bg-background p-4">
            <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
            <p className="text-muted-foreground">About Ezhupira, paying for an order, cancellations and refunds, and delivery.</p>
            <nav aria-label="FAQ sections" className="flex flex-wrap gap-2 pt-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  {s.title}
                </a>
              ))}
            </nav>
          </header>

          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-24 space-y-4">
              <h2 id={`${section.id}-heading`} className="text-lg font-semibold">
                {section.title}
              </h2>
              <div className="divide-y border bg-background">
                {section.items.map(({ q, a }) => (
                  <details key={q} className="group px-4 py-3">
                    <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                      <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-45">+</span>
                      {q}
                    </summary>
                    <p className="pt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="flex flex-col items-start gap-3 border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">Still need help?</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/track-order" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
                <PackageSearch aria-hidden />
                Track order
              </Link>
              <Link href="/support" className={cn(buttonVariants(), "gap-1.5")}>
                <LifeBuoy aria-hidden />
                Contact support
              </Link>
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
