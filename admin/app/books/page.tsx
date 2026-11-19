"use client";

import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Card, Empty, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { api, type Book } from "@/lib/api";
import { date, inr, SITE_URL } from "@/lib/format";

const STATUS_TONE = { published: "ok", upcoming: "brand", hidden: "neutral" } as const;

export default function BooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ books: Book[] }>("/admin/books").then((r) => setBooks(r.books), (err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <PageHeader
        title="Books"
        description="Edit book content, set prices and open pre-orders. Images are files in the website repo."
        action={
          <Link href="/books/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3.5 text-sm font-medium text-brand-ink hover:opacity-90">
            <Plus className="size-4" /> Add upcoming book
          </Link>
        }
      />
      <ErrorNote error={error} />
      {!books ? (
        <Loading />
      ) : books.length === 0 ? (
        <Empty>No books yet.</Empty>
      ) : (
        <div className="grid gap-3">
          {books.map((b) => {
            const priced = b.editions.filter((e) => e.price > 0);
            return (
              <Card key={b.slug} className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-bg">
                  {b.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${SITE_URL}${encodeURI(b.cover)}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted">No cover</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/books/${b.slug}`} className="text-lg font-medium hover:text-brand hover:underline">
                    {b.title}
                  </Link>
                  <p className="text-sm text-muted">
                    /books/{b.slug} · {b.author}
                    {b.releaseAt && <> · releases {date(b.releaseAt)}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  {b.preorderOpen ? <Badge tone="ok">Pre-orders open</Badge> : b.status === "upcoming" && <Badge>Pre-orders closed</Badge>}
                  {priced.length > 0 && <span className="text-sm text-muted">{priced.map((e) => `${e.name} ${inr(e.price)}`).join(" · ")}</span>}
                  <a href={`${SITE_URL}/books/${b.slug}`} target="_blank" rel="noreferrer" className="p-1 text-muted hover:text-ink" aria-label="View on site">
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
