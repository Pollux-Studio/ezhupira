"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session";
import { MallikaiText } from "@/components/book/book-parts";
import { Confetti } from "@/components/orders/confetti";
import { afterPreloader } from "@/components/signature-preloader";
import { OrderTimeline, StatusBadge, formatDate } from "@/components/orders/order-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, type CheckoutSession, type Order } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/preorder";
import { cn } from "@/lib/utils";

/** What the order page needs to know about a book (passed in from the server page). */
export type OrderBook = { slug: string; title: string; titleMallikai?: string; cover?: string };

const HEADLINE: Record<Order["status"], string> = {
  pending: "Waiting for your payment",
  paid: "Thank you! Your order is confirmed",
  shipped: "Your book is on its way",
  delivered: "Delivered. Happy reading!",
  failed: "The payment didn't go through",
  cancelled: "This order was cancelled",
  refunded: "This order was refunded",
};

/** The rubber stamp on the receipt, for the good outcomes. */
const STAMP: Partial<Record<Order["status"], string>> = {
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
};

/** Confetti only right after paying (not when coming back days later), once per browser. */
const CELEBRATE_WITHIN = 6 * 60 * 60 * 1000;
/** "waiting": paid just now, holding until the preloader is gone; "on": confetti playing. */
type Celebration = "off" | "waiting" | "on";
const celebratedKey = (code: string) => `ezhupira:celebrated:${code}`;

function shouldCelebrate(order: Order) {
  if (order.status !== "paid" || !order.paidAt) return false;
  if (Date.now() - new Date(order.paidAt).getTime() > CELEBRATE_WITHIN) return false;
  try {
    if (localStorage.getItem(celebratedKey(order.code))) return false;
    localStorage.setItem(celebratedKey(order.code), "1");
  } catch {
    // Storage blocked: celebrate anyway; at worst it happens again on reload.
  }
  return true;
}

/** Ordered → Paid → Shipped → Delivered (e-books: Ordered → Paid → Ready to read). */
function Progress({ order }: { order: Order }) {
  const physical = !!order.shippingAddress?.line1;
  const steps = physical ? ["Ordered", "Paid", "Shipped", "Delivered"] : ["Ordered", "Paid", "Ready to read"];
  const at: Partial<Record<Order["status"], number>> = {
    pending: 0,
    paid: 1,
    shipped: physical ? 2 : 1,
    delivered: steps.length - 1,
  };
  const current = at[order.status];
  if (current === undefined) return null; // failed, cancelled, refunded: no journey to show

  return (
    <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Order progress">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={i === current ? "step" : undefined}>
            {/* The line to the previous step */}
            {i > 0 && (
              <span
                aria-hidden
                className={cn("absolute top-3 right-1/2 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-primary" : "bg-border")}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-6 place-items-center rounded-full border-2 bg-background text-xs transition-colors",
                done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                i === current && order.status === "pending" && "animate-pulse",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-sm font-receipt text-sm text-muted-foreground hover:text-foreground"
      aria-label={`Copy order ID ${code}`}
    >
      {code}
      {copied ? <Check className="size-3.5 text-primary" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}

/** The order as a small paper receipt, with a stamp once it's paid. */
function Receipt({ order, book, stampIn }: { order: Order; book?: OrderBook; stampIn: Celebration }) {
  const a = order.shippingAddress;
  const stamp = STAMP[order.status];
  const row = "flex justify-between gap-4";

  return (
    <div className="relative overflow-hidden border border-dashed bg-background p-4 font-receipt text-sm">
      {stamp && (
        <span
          aria-hidden
          className={cn(
            "absolute top-3 right-3 -rotate-12 border-[3px] border-primary px-2 py-0.5 font-stamp text-xl tracking-widest text-primary uppercase opacity-90",
            // Hidden until the confetti starts, then thumped on; static after that.
            stampIn === "waiting" && "opacity-0",
            stampIn === "on" && "animate-[paper-blot_500ms_cubic-bezier(.2,.9,.3,1.3)_400ms_both]",
          )}
        >
          {stamp}
        </span>
      )}

      <div className="flex items-start gap-3 pr-24">
        {book?.cover && (
          <div className="relative aspect-[5/8] w-12 shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/10">
            <Image src={encodeURI(book.cover)} alt="" fill sizes="48px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 space-y-0.5 font-sans">
          <p className="text-lg leading-tight font-medium">
            <MallikaiText unicode={order.item.title} mallikai={book?.titleMallikai} className="text-xl" />
          </p>
          <p className="text-sm text-muted-foreground">{order.item.edition}</p>
        </div>
      </div>

      <hr className="my-3 border-dashed" />
      <dl className="space-y-1.5 text-xs">
        <div className={row}>
          <dt className="text-muted-foreground">Placed</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        {order.paidAt && (
          <div className={row}>
            <dt className="text-muted-foreground">Paid</dt>
            <dd>{formatDate(order.paidAt)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="shrink-0 text-muted-foreground">{a?.line1 ? "Ship to" : "Delivery"}</dt>
          <dd className="text-right">
            {a?.line1 ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ") : "Digital, nothing to ship"}
          </dd>
        </div>
      </dl>
      <hr className="my-3 border-dashed" />
      <div className={cn(row, "items-baseline font-bold")}>
        <span>Total</span>
        <span className="text-lg">{formatPrice(order.amount)}</span>
      </div>
    </div>
  );
}

function Details({ code, books }: { code: string; books: OrderBook[] }) {
  const router = useRouter();
  const { user } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [celebrate, setCelebrate] = useState<Celebration>("off");
  const stopCelebrating = useCallback(() => setCelebrate("off"), []);

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(`/orders/${code}`)}`);
  }, [user, router, code]);

  // Load, and while it's still pending re-check a few times: right after Cashfree redirects
  // back, the payment can take a few seconds to confirm.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let tries = 0;
    let stopWaiting = () => {};
    const load = async () => {
      try {
        const { order } = await api<{ order: Order }>(`/orders/${encodeURIComponent(code)}`);
        if (cancelled) return;
        setOrder(order);
        // Keep checking while it's unpaid, unless the attempt already failed (nothing to wait for).
        const again = order.status === "pending" && order.payment !== "failed" && ++tries < 6;
        setChecking(again);
        if (again) setTimeout(load, 3000);
        else if (shouldCelebrate(order)) {
          // A full page load (Cashfree's redirect back) shows the signature preloader first.
          setCelebrate("waiting");
          stopWaiting = afterPreloader(() => setCelebrate("on"));
        }
      } catch (err) {
        if (!cancelled) {
          setChecking(false);
          setError(err instanceof ApiError && err.status === 404 ? "We couldn't find this order on your account." : (err as Error).message);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      stopWaiting();
    };
  }, [user, code]);

  async function payAgain() {
    setPaying(true);
    setError(null);
    try {
      await openCheckout(await api<CheckoutSession>(`/orders/${encodeURIComponent(code)}/pay`, { method: "POST" }));
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">{error}</p>
        <Link href="/profile#orders" className={buttonVariants({ variant: "outline" })}>Back to your orders</Link>
      </div>
    );
  }
  if (!order) return <div className="h-96 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;

  const book = books.find((b) => b.slug === order.bookSlug);
  const attemptFailed = order.status === "pending" && order.payment === "failed";
  const headline = attemptFailed
    ? "Your payment didn't go through"
    : order.status === "pending" && order.payment === "processing"
      ? "Your payment is processing"
      : HEADLINE[order.status];
  const good = order.status === "paid" || order.status === "shipped" || order.status === "delivered";

  return (
    <>
      {celebrate === "on" && <Confetti onDone={stopCelebrating} />}
      <Card className="animate-[paper-pop-in_300ms_ease-out_both]">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <CopyCode code={order.code} />
            <StatusBadge status={order.status} payment={order.payment} />
          </div>
          <CardTitle className="text-2xl leading-tight" aria-live="polite">
            {headline}
          </CardTitle>
          {order.status === "paid" && (
            <CardDescription>
              A confirmation email is on its way to <span className="text-foreground">{order.customer?.email}</span>.
            </CardDescription>
          )}
          {order.status === "failed" && <CardDescription>No money was taken. You can place the order again from the book page.</CardDescription>}
          {attemptFailed && (
            <CardDescription>
              No money was taken. If your bank did debit you, it will be reversed automatically within 5–7 business days. Your
              order is still open, so you can try again.
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <Progress order={order} />

          <Receipt order={order} book={book} stampIn={celebrate} />

          {order.status === "pending" && (
            <div className="space-y-2">
              <Button onClick={payAgain} disabled={paying} className="w-full">
                {paying ? "Opening payment…" : attemptFailed ? "Try again" : "Complete payment"}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                {checking && <Loader2 className="size-3 animate-spin" aria-hidden />}
                {checking
                  ? "Checking your payment…"
                  : attemptFailed
                    ? "You can use another UPI app, card or bank this time."
                    : "Already paid? It can take a minute to confirm. Refresh this page to check again."}
              </p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block text-primary transition-transform group-open:rotate-45">+</span>
              Order history
            </summary>
            <div className="pt-3">
              <OrderTimeline events={order.events} />
            </div>
          </details>

          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/profile#orders" className={buttonVariants({ variant: "outline" })}>
              Your orders
            </Link>
            <Link href={good && book ? `/books/${book.slug}` : "/"} className={buttonVariants()}>
              {good && book ? "Back to the book" : "Browse books"}
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Questions about this order?{" "}
            <Link href="/support" className="underline underline-offset-4 hover:text-foreground">
              Contact support
            </Link>{" "}
            or read the{" "}
            <Link href="/faq#refunds" className="underline underline-offset-4 hover:text-foreground">
              refund policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export function OrderDetails({ code, books = [] }: { code: string; books?: OrderBook[] }) {
  return <Details code={code} books={books} />;
}
