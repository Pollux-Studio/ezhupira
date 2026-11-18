"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { useSession } from "@/components/auth/session";
import { MallikaiText } from "@/components/book/book-parts";
import { StarRating, Stars } from "@/components/reviews/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { api, type MyReview, type User } from "@/lib/api";

type PublicReview = { id: string; name: string; avatarSeed: string; rating: number; text: string; createdAt: string };
type ReviewList = { count: number; average: number | null; reviews: PublicReview[] };

export const reviewDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));

export function ReviewStatus({ status }: { status: MyReview["status"] }) {
  return status === "published" ? <Badge>Published</Badge> : <Badge variant="outline">Waiting for approval</Badge>;
}

/** Your existing review of this book, with edit and delete. */
function MyReviewCard({ review, onEdit, onDeleted }: { review: MyReview; onEdit: () => void; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api(`/me/reviews/${review.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Your review</h3>
        <ReviewStatus status={review.status} />
      </div>
      <Stars value={review.rating} />
      <p className="text-sm leading-relaxed whitespace-pre-line">{review.text}</p>
      <p className="text-xs text-muted-foreground">
        {review.status === "pending"
          ? "Only you can see it until it's approved."
          : `Published · last edited ${reviewDate(review.updatedAt)}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
          <Pencil aria-hidden />
          Edit
        </Button>
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
  );
}

/** Write or edit. Posted under the account name, shown here with the avatar. */
function ReviewEditor({
  user,
  bookSlug,
  heading,
  existing,
  onSaved,
  onCancel,
}: {
  user: User;
  bookSlug: string;
  heading: React.ReactNode;
  existing: MyReview | null;
  onSaved: (review: MyReview) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) return setError("Please choose a star rating.");
    setError(null);
    setSubmitting(true);
    try {
      const { review } = await api<{ review: MyReview }>("/reviews", { body: { bookSlug, rating, text: text.trim() } });
      onSaved(review);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {heading}
        {/* Auto-filled from the signed-in account; reviews always carry the account name. */}
        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
          <UserAvatar seed={user.avatarSeed} className="size-9" />
          <div className="min-w-0 text-sm">
            <p className="text-muted-foreground">Posting as</p>
            <p className="truncate font-medium">{user.name}</p>
          </div>
        </div>
        <Field>
          <FieldLabel>Your rating</FieldLabel>
          <StarRating
            value={rating}
            onChange={(n) => {
              setRating(n);
              setError(null);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="review-text">Review</FieldLabel>
          <Textarea
            id="review-text"
            name="review"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you think of the book?"
            minLength={10}
            maxLength={4000}
            required
          />
          <FieldDescription className="flex justify-between gap-2">
            <span>Reviews appear once they&apos;re approved.</span>
            <span className="tabular-nums">{text.length}/4000</span>
          </FieldDescription>
        </Field>
        {error && (
          <FieldDescription role="alert" className="text-destructive">
            {error}
          </FieldDescription>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : existing ? "Save changes" : "Submit review"}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}

/** Sign-in prompt, your review (with edit/delete), or the form, depending on where you stand. */
function ReviewForm({ bookSlug, bookTitle, bookTitleMallikai }: { bookSlug: string; bookTitle: string; bookTitleMallikai?: string }) {
  const { user } = useSession();
  // undefined = still loading your review; null = you haven't reviewed this book.
  const [mine, setMine] = useState<MyReview | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api<{ reviews: MyReview[] }>("/me/reviews").then(
      (r) => active && setMine(r.reviews.find((x) => x.bookSlug === bookSlug) ?? null),
      () => active && setMine(null),
    );
    return () => {
      active = false;
    };
  }, [user, bookSlug]);

  const heading = (
    <h3 className="font-medium">
      {mine ? "Edit your review of" : "Write a review of"}{" "}
      <MallikaiText unicode={bookTitle} mallikai={bookTitleMallikai} className="text-lg" />
    </h3>
  );

  if (user === undefined || (user && mine === undefined)) {
    return <div className="h-40 animate-pulse rounded-md bg-muted" aria-label="Loading" />;
  }

  if (user === null) {
    return (
      <div className="space-y-4">
        {heading}
        <p className="text-sm text-muted-foreground">Sign in with Google to share your review.</p>
        <GoogleSignIn />
      </div>
    );
  }

  if (mine && !editing) {
    return <MyReviewCard review={mine} onEdit={() => setEditing(true)} onDeleted={() => setMine(null)} />;
  }

  return (
    <ReviewEditor
      // Remount when switching between new and edit so the fields start from the saved review.
      key={mine?.id ?? "new"}
      user={user}
      bookSlug={bookSlug}
      heading={heading}
      existing={mine ?? null}
      onSaved={(review) => {
        setMine(review);
        setEditing(false);
      }}
      onCancel={mine ? () => setEditing(false) : undefined}
    />
  );
}

/** Reviews for a book: approved reviews from the API, plus your own review or the form. */
export function ReviewSection({
  bookSlug,
  bookTitle,
  bookTitleMallikai,
}: {
  bookSlug: string;
  bookTitle: string;
  bookTitleMallikai?: string;
}) {
  const [list, setList] = useState<ReviewList | null>(null);

  useEffect(() => {
    api<ReviewList>(`/reviews?book=${encodeURIComponent(bookSlug)}`).then(setList, () => setList({ count: 0, average: null, reviews: [] }));
  }, [bookSlug]);

  return (
    <section id="write-review" aria-labelledby="reviews-heading" className="scroll-mt-24 space-y-6">
      <div className="space-y-1">
        <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight">
          Reviews
        </h2>
        {list === null ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : list.count === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share what you thought.</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={Math.round(list.average ?? 0)} />
            {list.average} out of 5 · {list.count} review{list.count === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {list && list.reviews.length > 0 && (
        <ul className="space-y-4">
          {list.reviews.map((r) => (
            <li key={r.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <UserAvatar seed={r.avatarSeed} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{reviewDate(r.createdAt)}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border p-5">
        <ReviewForm bookSlug={bookSlug} bookTitle={bookTitle} bookTitleMallikai={bookTitleMallikai} />
      </div>
    </section>
  );
}
