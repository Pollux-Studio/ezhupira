import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquarePlus, Truck } from "lucide-react";
import { BookFlipbook } from "@/components/book/book-flipbook";
import {
  BookCover,
  BuyButton,
  MallikaiText,
  PublisherBadge,
} from "@/components/book/book-parts";
import { ReviewSection } from "@/components/book/review-section";
import { ScrollPanel } from "@/components/book/scroll-panel";
import { ShareButton } from "@/components/book/share-button";
import { SideNoise } from "@/components/side-noise";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { formatPrice, type Book } from "@/lib/books";
import { getBook, getBooks } from "@/lib/catalog";
import { AUTHOR, bookLd, bookTitleLatin, breadcrumbLd } from "@/lib/site";
import { cn } from "@/lib/utils";

// Books added later in the admin render on first visit (dynamic params), then stay cached.
export async function generateStaticParams() {
  return (await getBooks()).map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/books/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return {};
  const latin = bookTitleLatin(book);
  const title = `${book.title}${latin ? ` (${latin})` : ""} by ${AUTHOR.name} · Tamil poetry book`;
  const description = `${book.description} ${[book.price && `${formatPrice(book.price)}.`, "Read a free preview and buy online."].filter(Boolean).join(" ")}`;
  const path = `/books/${book.slug}`;
  return {
    title,
    description,
    keywords: [book.title, latin, book.author, AUTHOR.name, "Tamil poetry book", "கவிதைத் தொகுப்பு", "buy Tamil book online"].filter(
      (k): k is string => Boolean(k),
    ),
    alternates: { canonical: path },
    openGraph: {
      type: "book",
      url: path,
      title,
      description,
      authors: [AUTHOR.url],
      releaseDate: book.year,
      tags: ["Tamil", "Poetry", "கவிதை"],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Price({ book, size = "lg" }: { book: Book; size?: "lg" | "sm" }) {
  if (!book.price) return null;
  return (
    <p
      className={cn(
        "font-semibold tracking-tight",
        size === "lg" ? "text-3xl" : "text-lg",
      )}
    >
      {formatPrice({ ...book.price, note: undefined })}
      {book.price.note && (
        <span
          className={cn(
            "ml-1.5 font-normal text-muted-foreground",
            size === "lg" ? "text-sm" : "text-xs",
          )}
        >
          {book.price.note}
        </span>
      )}
    </p>
  );
}

export default async function BookPage({ params }: PageProps<"/books/[slug]">) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  return (
    // Tablets and up: the page is exactly one window tall and never scrolls. The left side
    // ("All books", cover, red strip) is fixed; only the right column scrolls, in its own
    // area, which gives the flipbook preview a stable box.
    // Phones: a normal scrolling page with a buy bar pinned to the bottom.
    // overflow-clip (not hidden): a clipped box can't be scrolled at all — not even when
    // focus moves to a button — so the static side truly never moves.
    <div className="flex flex-1 flex-col md:h-svh md:flex-none md:overflow-clip">
      <JsonLd
        data={[
          bookLd(book),
          breadcrumbLd([
            { name: "Ezhupira", path: "/" },
            { name: book.title, path: `/books/${book.slug}` },
          ]),
        ]}
      />
      <SiteHeader />
      {/* Everything below the header. The red strip is anchored to this area (not the
          window), so it starts where the header ends instead of showing through it. */}
      <div className="relative isolate flex flex-1 flex-col md:min-h-0">
        {/* The hero's red noise as a vertical strip: from the left edge to about a quarter
            of the way into the cover. Wide screens only (on phones the cover sits above
            the text). */}
        <SideNoise
          className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden md:block"
          style={{
            // page margin + 1rem padding + ~1/4 of the cover column (2/5 of the content
            // width, minus the 3rem gap)
            width:
              "calc((100vw - min(100vw, 64rem)) / 2 + 1rem + (min(100vw, 64rem) - 5rem) * 0.1)",
          }}
        />
        <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:min-h-0 md:py-0">
          <div className="grid gap-6 md:h-full md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
            {/* Left: back button + flipbook preview. Completely static. Capped so the whole
              book and its controls always fit the window height (5:8 page: width =
              available height × 5/8; ~15rem covers header, button, controls, padding). */}
            <div className="mx-auto flex w-full max-w-xs flex-col gap-4 md:mx-0 md:max-w-[calc((100svh-15rem)*0.625)] md:py-8">
              {/* Right-aligned to the book's edge, clear of the red strip */}
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-fit gap-1.5 self-start bg-background shadow-sm md:self-end",
                )}
              >
                <ArrowLeft aria-hidden />
                All books
              </Link>
              {book.preview ? (
                <BookFlipbook
                  pages={book.preview}
                  title={book.title}
                  endAction={
                    book.buyUrl
                      ? {
                          href: book.buyUrl,
                          label: book.buyLabel ?? "Buy the book",
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-lg shadow-xl ring-1 ring-foreground/10">
                  <BookCover
                    book={book}
                    sizes="(min-width: 768px) 400px, 320px"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Right: details, buying and reviews — the only part that scrolls */}
            <ScrollPanel className="md:py-8">
              <div className="max-w-xl space-y-8">
                {/* Title block: the book's name and author stay in Mallikai (brand); every
                  other Tamil text on this page uses the regular Tamil font. */}
                <header className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{book.year}</Badge>
                    {book.status === "upcoming" && <Badge>Coming soon</Badge>}
                  </div>
                  <h1 className="text-4xl leading-tight sm:text-5xl">
                    <MallikaiText
                      unicode={book.title}
                      mallikai={book.titleMallikai}
                    />
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    <MallikaiText
                      unicode={book.author}
                      mallikai={book.authorMallikai}
                    />
                  </p>
                  {book.publisher && (
                    <PublisherBadge publisher={book.publisher} />
                  )}
                  {book.highlights && (
                    <ul
                      aria-label="Highlights"
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {book.highlights.map((h) => (
                        <li
                          key={h}
                          className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </header>

                <p className="text-base leading-loose">{book.description}</p>

                {/* Buying panel */}
                {(book.price || book.buyUrl) && (
                  <section
                    aria-label="Buy this book"
                    className="space-y-4 rounded-xl border bg-card p-5"
                  >
                    <Price book={book} />
                    {book.availability && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck aria-hidden className="size-4 shrink-0" />
                        {book.availability}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <BuyButton book={book} className="flex-1 sm:flex-none" />
                      <a
                        href="#write-review"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "flex-1 gap-1.5 sm:flex-none",
                        )}
                      >
                        <MessageSquarePlus aria-hidden />
                        Write a review
                      </a>
                      <ShareButton title={`${book.title} · ${book.author}`} />
                    </div>
                  </section>
                )}

                {/* Book details */}
                <section
                  aria-labelledby="details-heading"
                  className="space-y-3"
                >
                  <h2
                    id="details-heading"
                    className="text-xl font-semibold tracking-tight"
                  >
                    Book details
                  </h2>
                  <dl className="divide-y rounded-xl border text-sm">
                    {[
                      { label: "Published", value: book.year },
                      ...(book.publisher
                        ? [{ label: "Publisher", value: book.publisher.name }]
                        : []),
                      ...(book.details ?? []),
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-2.5"
                      >
                        <dt className="text-muted-foreground">{d.label}</dt>
                        <dd>{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <ReviewSection
                  bookSlug={book.slug}
                  bookTitle={book.title}
                  bookTitleMallikai={book.titleMallikai}
                />
              </div>
            </ScrollPanel>
          </div>
        </main>
      </div>

      {/* Phones: price + buy always within reach */}
      {book.buyUrl && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <Price book={book} size="sm" />
          <BuyButton book={book} />
        </div>
      )}
    </div>
  );
}
