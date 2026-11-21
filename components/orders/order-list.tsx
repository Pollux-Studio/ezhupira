import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { MallikaiText } from "@/components/book/book-parts";
import { StatusBadge } from "@/components/orders/order-status";
import type { Order } from "@/lib/api";
import type { Book } from "@/lib/books";
import { formatPrice } from "@/lib/preorder";

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** The reader's orders, newest first; each row opens the order page. */
export function OrderList({ orders, books = [] }: { orders: Order[]; books?: Book[] }) {
  return (
    <ul className="divide-y border bg-background">
      {orders.map((o) => {
        const book = books.find((b) => b.slug === o.bookSlug);
        return (
          <li key={o.code}>
            <Link
              href={`/orders/${o.code}`}
              className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:gap-4 sm:p-4"
            >
              {/* Cover, or a plain paper placeholder for books without one */}
              <div className="relative aspect-[5/8] w-11 shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-foreground/10 sm:w-12">
                {book?.cover ? (
                  <Image src={encodeURI(book.cover)} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <BookOpen aria-hidden className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                )}
              </div>

              {/* Three lines, each using the full width so titles aren't squeezed on phones:
                  title · price / edition · date / order ID · status */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate leading-tight font-medium">
                    <MallikaiText unicode={o.item.title} mallikai={book?.titleMallikai} className="text-lg" />
                  </p>
                  <span className="shrink-0 font-semibold tabular-nums">{formatPrice(o.amount)}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {o.item.edition} · {day(o.createdAt)}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-receipt text-xs text-muted-foreground">{o.code}</span>
                  <StatusBadge status={o.status} payment={o.payment} />
                </div>
              </div>
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
