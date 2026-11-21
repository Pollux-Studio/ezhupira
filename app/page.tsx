import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, MessageSquarePlus } from "lucide-react";
import { BookCover, BuyButton, MallikaiText, PublisherBadge } from "@/components/book/book-parts";
import { HeroBackground } from "@/components/hero-background";
import { HeroClock } from "@/components/hero-clock";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, isTestBook, nextUpcoming, openPreorder, type Book } from "@/lib/books";
import { getBooks } from "@/lib/catalog";
import { releaseLabel } from "@/lib/release";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";
import { abs, bookLd } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function BookCard({ book }: { book: Book }) {
  const href = `/books/${book.slug}`;

  // Cover on the left, details on the right (stacked on phones).
  return (
    <Card className="gap-0 py-0 sm:flex-row">
      {book.cover && (
        <Link
          href={href}
          aria-label={`${book.title} — details`}
          // Side by side: the cover fills the card's full height (never shorter than its
          // own 5:8 size), so there's no gap under it whatever the text length.
          className="block shrink-0 sm:w-44 sm:min-h-[17.6rem] md:w-52 md:min-h-[20.8rem]"
        >
          <BookCover
            book={book}
            sizes="(min-width: 768px) 208px, (min-width: 640px) 176px, 100vw"
            className="sm:aspect-auto sm:h-full"
          />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-4 py-4">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle>
              <Link href={href} className="hover:underline">
                <MallikaiText unicode={book.title} mallikai={book.titleMallikai} className="text-2xl leading-tight" />
              </Link>
            </CardTitle>
            <Badge variant="outline">{book.year}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <MallikaiText unicode={book.author} mallikai={book.authorMallikai} className="text-lg" />
          </p>
          {book.publisher && <PublisherBadge publisher={book.publisher} />}
          {/* Normal Tamil font; only the title and author use Mallikai. */}
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">{book.description}</CardDescription>
          {book.price && (
            <p className="pt-1 text-lg font-semibold">
              {formatPrice({ ...book.price, note: undefined })}
              {book.price.note && <span className="ml-1 text-xs font-normal text-muted-foreground">{book.price.note}</span>}
            </p>
          )}
        </CardHeader>
        <CardContent className="mt-auto grid gap-2">
          <BuyButton book={book} className="w-full" />
          <Link
            href={`${href}#write-review`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full gap-1.5")}
          >
            <MessageSquarePlus aria-hidden />
            Add review
          </Link>
        </CardContent>
      </div>
    </Card>
  );
}

export default async function HomePage() {
  const books = await getBooks();
  const published = books.filter((b) => b.status === "published");
  const upcoming = nextUpcoming(books);
  const preorder = openPreorder(books);
  // Test books are listed whatever their status, so the pre-order one can be reached too.
  const listed = books.filter((b) => b.status === "published" || isTestBook(b));
  const release = releaseLabel(upcoming?.releaseAt);
  const real = books.filter((b) => !isTestBook(b));

  return (
    <>
      <JsonLd
        data={[
          {
            "@type": "ItemList",
            name: "Books by Prasanth J",
            itemListElement: real.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/books/${b.slug}`) })),
          },
          ...published.filter((b) => !isTestBook(b)).map(bookLd),
        ]}
      />
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4">
        {/* Hero: half the screen height, countdown to the next release */}
        <section className="relative isolate flex min-h-[50svh] flex-col items-center justify-center gap-8 py-12 text-center">
          <HeroBackground />

          {/* Solid backing so the text stays readable over the noise */}
          <div className="space-y-2 border bg-background px-6 py-4">
            <p className="text-sm font-medium text-primary">Next release</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Books by Prasanth</h1>
            <p className="text-muted-foreground">{release}</p>
          </div>

          <HeroClock target={upcoming?.releaseAt} />

          {/* Inverted colours so the button stands out from the red noise. It pre-orders the
              specific upcoming book; with none open yet, it just says so. */}
          {preorder ? (
            <Link
              href={`/books/${preorder.slug}/preorder`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 bg-foreground px-8 text-base text-background hover:bg-foreground/90"
              )}
            >
              Pre-order now
            </Link>
          ) : (
            <p className="border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground">
              Pre-orders open soon
            </p>
          )}
        </section>

        {/* Below the hero: the books, in a row. */}
        <main className="flex-1 space-y-4 py-12">
          <h2 className="text-lg font-semibold">Books</h2>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {listed.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </div>

          {/* The questions live on /faq; this just points there. */}
          <section className="flex flex-col items-start gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold">Questions?</h2>
              <p className="text-sm text-muted-foreground">About Ezhupira, payments, refunds and delivery.</p>
            </div>
            <Link href="/faq" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
              <CircleHelp aria-hidden />
              Read the FAQ
            </Link>
          </section>
        </main>

      </div>
      <SiteFooter />
    </>
  );
}
