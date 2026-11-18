import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Book, Publisher } from "@/lib/books";
import { cn } from "@/lib/utils";

/**
 * Tamil shown in the Mallikai legacy font (typed in its key code). The Unicode text is
 * kept for screen readers and search.
 */
export function MallikaiText({
  unicode,
  mallikai,
  className,
}: {
  unicode: string;
  mallikai?: string;
  className?: string;
}) {
  if (!mallikai) return <span className={className}>{unicode}</span>;
  return (
    <>
      <span aria-hidden className={cn("font-mallikai font-normal", className)}>
        {mallikai}
      </span>
      <span className="sr-only">{unicode}</span>
    </>
  );
}

export function BookCover({
  book,
  sizes,
  priority,
  className,
}: {
  book: Book;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!book.cover) return null;
  return (
    <div className={cn("relative aspect-[5/8] w-full overflow-hidden bg-muted", className)}>
      <Image
        src={encodeURI(book.cover)}
        alt={`Cover of ${book.title}`}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

/** Publisher logo + name (plain, not a link). */
export function PublisherBadge({ publisher, className }: { publisher: Publisher; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Image src={publisher.logo} alt="" width={24} height={24} className="size-6 rounded-sm" />
      <span>
        <span className="sr-only">Published by </span>
        {publisher.name}
      </span>
    </span>
  );
}

export function BuyButton({ book, className }: { book: Book; className?: string }) {
  if (!book.buyUrl) return null;
  return (
    <a
      href={book.buyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size: "lg" }), "gap-1.5", className)}
    >
      {book.buyLabel ?? "Buy now"}
      <ArrowUpRight aria-hidden />
    </a>
  );
}
