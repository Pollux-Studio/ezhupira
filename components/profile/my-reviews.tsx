"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { BookCover, MallikaiText } from "@/components/book/book-parts";
import { ReviewStatus, reviewDate } from "@/components/book/review-section";
import { Stars } from "@/components/reviews/stars";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, type MyReview } from "@/lib/api";
import type { Book } from "@/lib/books";

function ReviewRow({ review, books, onDeleted }: { review: MyReview; books: Book[]; onDeleted: (id: string) => void }) {
  const book = books.find((b) => b.slug === review.bookSlug);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api(`/me/reviews/${review.id}`, { method: "DELETE" });
      onDeleted(review.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <li className="flex gap-4 rounded-lg border bg-background p-4">
      <Link href={`/books/${review.bookSlug}`} className="w-14 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-foreground/10">
        {book?.cover ? (
          <BookCover book={book} sizes="56px" />
        ) : (
          <div className="flex aspect-[5/8] items-center justify-center bg-primary p-1 text-center text-[0.55rem] font-semibold text-primary-foreground">
            {book?.title ?? review.bookSlug}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`/books/${review.bookSlug}`} className="hover:underline">
            {book ? <MallikaiText unicode={book.title} mallikai={book.titleMallikai} className="text-lg leading-tight" /> : review.bookSlug}
          </Link>
          <ReviewStatus status={review.status} />
        </div>
        <div className="flex items-center gap-2">
          <Stars value={review.rating} />
          <span className="text-xs text-muted-foreground">{reviewDate(review.updatedAt)}</span>
        </div>
        <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line">{review.text}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/books/${review.bookSlug}#write-review`} className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}>
            <Pencil aria-hidden />
            Edit
          </Link>
          {confirming ? (
            <>
              <Button variant="destructive" size="sm" onClick={remove} disabled={busy}>
                {busy ? "Deleting…" : "Yes, delete it"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                Keep it
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="gap-1.5 text-muted-foreground">
              <Trash2 aria-hidden />
              Delete
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

/** Every review the reader has written, with status, edit and delete. */
export function MyReviews({ reviews, books, onChange }: { reviews: MyReview[]; books: Book[]; onChange: (reviews: MyReview[]) => void }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background/60 p-6 text-center text-sm text-muted-foreground">
        You haven&apos;t written any reviews yet. Open a book and share what you thought, like{" "}
        <Link href="/books/naan-yaar#write-review" className="font-medium text-foreground underline">
          <MallikaiText unicode="நான் யார்?" mallikai="ehd; ahu;?" className="text-base" />
        </Link>
        .
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} books={books} onDeleted={(id) => onChange(reviews.filter((x) => x.id !== id))} />
      ))}
    </ul>
  );
}
