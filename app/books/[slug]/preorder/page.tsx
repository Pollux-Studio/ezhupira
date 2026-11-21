import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookCover, MallikaiText } from "@/components/book/book-parts";
import { PreorderCheckout } from "@/components/preorder-checkout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageNoise } from "@/components/page-noise";
import { getBook, getBooks } from "@/lib/catalog";
import { releaseLabel } from "@/lib/release";

export async function generateStaticParams() {
  return (await getBooks()).map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: PageProps<"/books/[slug]/preorder">): Promise<Metadata> {
  const book = await getBook((await params).slug);
  return {
    title: book ? `${book.status === "upcoming" ? "Pre-order" : "Buy"} ${book.title}` : "Pre-order",
    robots: { index: false, follow: true },
  };
}

/** Pre-order page for one specific book (only works while the API has it on sale). */
export default async function PreorderPage({ params }: PageProps<"/books/[slug]/preorder">) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  return (
    <>
      <SiteHeader />
      <div className="relative isolate flex flex-1 flex-col">
      <PageNoise variant="side" container="56rem" reach="6rem" />
      <main className="mx-auto grid w-full max-w-4xl flex-1 gap-8 px-4 pt-24 pb-16 sm:pt-32 md:grid-cols-[14rem_1fr] md:gap-12 md:pt-10">
        <aside className="h-fit space-y-4 border bg-background p-4">
          <Link href={`/books/${book.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft aria-hidden className="size-4" />
            Back to the book
          </Link>
          {book.cover && (
            <div className="w-40 overflow-hidden rounded-sm ring-1 ring-foreground/10 md:w-full">
              <BookCover book={book} sizes="(min-width: 768px) 224px, 160px" priority />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl leading-tight">
              <MallikaiText unicode={book.title} mallikai={book.titleMallikai} />
            </h1>
            <p className="text-muted-foreground">
              <MallikaiText unicode={book.author} mallikai={book.authorMallikai} className="text-lg" />
            </p>
            {book.status === "upcoming" && <p className="text-sm text-muted-foreground">Releases {releaseLabel(book.releaseAt)}</p>}
          </div>
        </aside>
        <div className="min-w-0">
          <PreorderCheckout bookSlug={book.slug} released={book.status !== "upcoming"} />
        </div>
      </main>
      </div>
      <SiteFooter />
    </>
  );
}
