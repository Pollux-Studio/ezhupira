"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BookEditor, toPayload, type BookInput } from "@/components/book-editor";
import { Badge, Button, Card, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { api, type Book } from "@/lib/api";
import { inr, SITE_URL } from "@/lib/format";

const toInput = (b: Book): BookInput => ({
  ...b,
  details: (b.details ?? []).map((d) => ({ label: d.label, value: d.value })),
  editions: b.editions ?? [],
});

/** Start / stop pre-orders for this one book. */
function PreorderCard({ book, onChange }: { book: Book; onChange: (b: Book) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priced = book.editions.filter((e) => e.price > 0);

  async function toggle(open: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { book: updated } = await api<{ book: Book }>(`/admin/books/${book.slug}`, { method: "PATCH", body: { preorderOpen: open } });
      onChange(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 flex flex-wrap items-center gap-4 border-brand/30 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Pre-orders</h2>
          {book.preorderOpen ? <Badge tone="ok">Open</Badge> : <Badge>Closed</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted">
          {book.preorderOpen ? (
            <>
              Readers can pre-order at{" "}
              <a href={`${SITE_URL}/books/${book.slug}/preorder`} target="_blank" rel="noreferrer" className="underline">
                /books/{book.slug}/preorder
              </a>
              . The homepage “Pre-order now” button points here.
            </>
          ) : priced.length ? (
            <>Ready to open: {priced.map((e) => `${e.name} ${inr(e.price)}`).join(" · ")}.</>
          ) : (
            <>Set a price on at least one edition below (and save) before opening pre-orders.</>
          )}
        </p>
        <ErrorNote error={error} />
      </div>
      {book.preorderOpen ? (
        <Button variant="danger" onClick={() => toggle(false)} disabled={busy}>
          {busy ? "Stopping…" : "Stop pre-orders"}
        </Button>
      ) : (
        <Button onClick={() => toggle(true)} disabled={busy || priced.length === 0}>
          {busy ? "Starting…" : "Start pre-orders"}
        </Button>
      )}
    </Card>
  );
}

export default function EditBookPage() {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ books: Book[] }>("/admin/books").then(
      (r) => {
        const found = r.books.find((b) => b.slug === slug);
        if (found) setBook(found);
        else setError("Book not found.");
      },
      (err: Error) => setError(err.message),
    );
  }, [slug]);
  useEffect(load, [load]);

  if (error) return <ErrorNote error={error} />;
  if (!book) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/books" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Books
      </Link>
      <PageHeader
        title={book.title}
        description={`/books/${book.slug}`}
        action={
          <a href={`${SITE_URL}/books/${book.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted underline hover:text-ink">
            View on site <ExternalLink className="size-3.5" />
          </a>
        }
      />
      {book.status !== "hidden" && <PreorderCard book={book} onChange={setBook} />}
      <BookEditor
        initial={toInput(book)}
        isNew={false}
        mallikai={{ title: book.titleMallikai, author: book.authorMallikai }}
        onSave={async (b) => {
          const { book: updated } = await api<{ book: Book }>(`/admin/books/${book.slug}`, { method: "PATCH", body: toPayload(b, false) });
          // Refresh the Mallikai preview and the pre-order card from the saved record.
          const r = await api<{ books: Book[] }>("/admin/books");
          setBook(r.books.find((x) => x.slug === updated.slug) ?? book);
        }}
      />
    </div>
  );
}
