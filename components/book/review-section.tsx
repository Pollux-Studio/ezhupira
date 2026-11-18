"use client";

import { Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MallikaiText } from "@/components/book/book-parts";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            aria-hidden
            className={cn("size-6 transition-colors", n <= shown ? "fill-primary text-primary" : "text-muted-foreground/50")}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Reviews for a book: list + "write a review" form.
 * UI only for now — nothing is saved until the backend is connected.
 */
export function ReviewSection({ bookTitle, bookTitleMallikai }: { bookTitle: string; bookTitleMallikai?: string }) {
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setError(null);
    // TODO: send { rating, name, review } to the backend.
    setSent(true);
  }

  return (
    <section id="write-review" aria-labelledby="reviews-heading" className="scroll-mt-24 space-y-6">
      <div className="space-y-1">
        <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight">
          Reviews
        </h2>
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share what you thought.</p>
      </div>

      <div className="rounded-lg border p-5">
        {sent ? (
          <div role="status" className="space-y-3">
            <p className="font-medium">Thanks for your review!</p>
            <p className="text-sm text-muted-foreground">
              Reviews aren&apos;t connected yet, so yours hasn&apos;t been saved. They&apos;ll go live soon.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSent(false);
                setRating(0);
              }}
            >
              Write another review
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <h3 className="font-medium">
                Write a review of <MallikaiText unicode={bookTitle} mallikai={bookTitleMallikai} className="text-lg" />
              </h3>
              <Field>
                <FieldLabel>Your rating</FieldLabel>
                <StarRating
                  value={rating}
                  onChange={(n) => {
                    setRating(n);
                    setError(null);
                  }}
                />
                {error && (
                  <FieldDescription role="alert" className="text-destructive">
                    {error}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="review-name">Name</FieldLabel>
                <Input id="review-name" name="name" autoComplete="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="review-text">Review</FieldLabel>
                <Textarea id="review-text" name="review" rows={5} placeholder="What did you think of the book?" required />
              </Field>
              <Button type="submit" size="lg" className="w-fit">
                Submit review
              </Button>
            </FieldGroup>
          </form>
        )}
      </div>
    </section>
  );
}
