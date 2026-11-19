"use client";

import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { useState } from "react";
import { BookCover, MallikaiText } from "@/components/book/book-parts";
import { api, type ReadBook } from "@/lib/api";
import type { Book } from "@/lib/books";
import { cn } from "@/lib/utils";

const readDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(iso),
  );

/**
 * The shelf: a flat ink line under each book. It runs far past the book on both sides and the
 * list clips it, so every row gets one unbroken full-width shelf whatever the column count.
 */
function Rail() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-x-[100vw] bottom-0 h-[3px] bg-foreground"
    />
  );
}

const UPCOMING_COVER =
  "group relative block aspect-[5/8] w-full overflow-hidden rounded-t-sm bg-foreground text-background ring-1 ring-foreground/10";

/** The next book's veiled cover: a link to its pre-order page when one is open, else a teaser. */
function UpcomingCover({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <div role="img" aria-label={label} className={UPCOMING_COVER}>
        {children}
      </div>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        UPCOMING_COVER,
        "transition-transform outline-none hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Bookshelf: every Ezhupira book as a cover on a shelf. Tapping a cover marks it read (a red
 * "READ" stamp) or unread; the change shows at once and is saved to the account.
 */
export function Bookshelf({
  books,
  read,
  onChange,
  upcomingLabel,
  upcomingHref,
}: {
  books: Book[];
  read: ReadBook[];
  onChange: (read: ReadBook[]) => void;
  /** Shown as an empty "coming soon" slot when the next book isn't on the shelf yet. */
  upcomingLabel?: string;
  /** That book's own pre-order page, when it's open for pre-order. Without it the slot is just a teaser. */
  upcomingHref?: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const readBySlug = new Map(read.map((r) => [r.bookSlug, r]));
  const count = books.filter((b) => readBySlug.has(b.slug)).length;

  async function toggle(slug: string) {
    if (pending) return;
    const wasRead = readBySlug.has(slug);
    const previous = read;
    // Show it straight away; undo if the save fails.
    onChange(
      wasRead
        ? read.filter((r) => r.bookSlug !== slug)
        : [...read, { bookSlug: slug, readAt: new Date().toISOString() }],
    );
    setPending(slug);
    setError(null);
    try {
      const res = await api<{ read: ReadBook[] }>(
        `/me/shelf/${encodeURIComponent(slug)}`,
        { method: "PUT", body: { read: !wasRead } },
      );
      onChange(res.read);
    } catch (err) {
      onChange(previous);
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{
              width: `${books.length ? (count / books.length) * 100 : 0}%`,
            }}
          />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {count} of {books.length} read
        </p>
      </div>

      <div>
        <ul className="grid grid-cols-2 items-start gap-x-6 gap-y-10 overflow-x-clip sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => {
            const entry = readBySlug.get(book.slug);
            const isRead = !!entry;
            return (
              <li key={book.slug} className="space-y-3">
                <div className="relative pb-[3px]">
                  <button
                    type="button"
                    onClick={() => toggle(book.slug)}
                    disabled={pending === book.slug}
                    aria-pressed={isRead}
                    aria-label={`${book.title}: ${isRead ? "read. Tap to mark as unread" : "not read yet. Tap to mark as read"}`}
                    className="group relative block w-full rounded-t-sm ring-1 ring-foreground/10 transition-transform outline-none hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
                  >
                    {book.cover ? (
                      <BookCover
                        book={book}
                        sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 45vw"
                        className="rounded-t-sm"
                      />
                    ) : (
                      <div className="flex aspect-[5/8] items-center justify-center rounded-t-sm bg-primary p-3 text-center text-primary-foreground">
                        <MallikaiText
                          unicode={book.title}
                          mallikai={book.titleMallikai}
                          className="text-xl"
                        />
                      </div>
                    )}
                    {/* Read: dim the cover and stamp it. */}
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-t-sm transition-colors",
                        isRead
                          ? "bg-black/45"
                          : "bg-black/0 group-hover:bg-black/20",
                      )}
                    >
                      <span
                        className={cn(
                          "-rotate-12 border-4 border-primary bg-background px-3 py-1 font-stamp text-2xl tracking-widest text-primary uppercase transition-all",
                          isRead
                            ? "scale-100 opacity-100"
                            : "scale-125 opacity-0 group-hover:scale-110 group-hover:opacity-60",
                        )}
                      >
                        Read
                      </span>
                    </span>
                    {isRead && (
                      <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check aria-hidden className="size-4" />
                      </span>
                    )}
                  </button>
                  <Rail />
                </div>
                <div className="space-y-0.5">
                  <Link
                    href={`/books/${book.slug}`}
                    className="block truncate hover:underline"
                  >
                    <MallikaiText
                      unicode={book.title}
                      mallikai={book.titleMallikai}
                      className="text-lg leading-tight"
                    />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {entry
                      ? `Read · ${readDate(entry.readAt)}`
                      : "Tap the cover when you've read it"}
                  </p>
                </div>
              </li>
            );
          })}

          {upcomingLabel && (
            <li className="space-y-3">
              {/* The next release as a veiled cover: same size, frame and lift as a real book. */}
              <div className="relative pb-[3px]">
                <UpcomingCover
                  href={upcomingHref}
                  label={
                    upcomingHref
                      ? `Next book, coming ${upcomingLabel}. Pre-order it`
                      : `Next book, coming ${upcomingLabel}`
                  }
                >
                  {/* Spine */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-2 bg-primary"
                  />
                  {/* Faint diagonal weave, like a cloth binding */}
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 7px)",
                    }}
                  />
                  <span className="relative flex h-full flex-col items-center justify-between py-5 pr-3 pl-5 text-center">
                    <span
                      aria-hidden
                      className="font-mallikai text-xl leading-none opacity-80"
                    >
                      vOgpu
                    </span>
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-full border border-background/30 transition-colors group-hover:border-primary group-hover:bg-primary">
                        <Clock aria-hidden className="size-5" />
                      </span>
                      <span className="-rotate-6 border-2 border-primary px-2 py-0.5 font-stamp text-lg tracking-widest text-primary uppercase group-hover:bg-primary group-hover:text-primary-foreground">
                        Coming soon
                      </span>
                    </span>
                    <span className="text-[0.7rem] tracking-wide uppercase opacity-70">
                      {upcomingLabel}
                    </span>
                  </span>
                </UpcomingCover>
                <Rail />
              </div>
              {/* Same two caption lines as a real book, so the shelf lines up. */}
              <div className="space-y-0.5">
                {upcomingHref ? (
                  <Link
                    href={upcomingHref}
                    className="block truncate text-lg leading-tight hover:underline"
                  >
                    Next book
                  </Link>
                ) : (
                  <p className="truncate text-lg leading-tight">Next book</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {upcomingHref ? "Pre-order now" : `Coming ${upcomingLabel}`}
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
