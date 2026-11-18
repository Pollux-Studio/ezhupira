"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/session";
import { OrderTimeline, StatusBadge, formatDate } from "@/components/orders/order-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, type CheckoutSession, type Order } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/preorder";

const HEADLINE: Partial<Record<Order["status"], string>> = {
  pending: "Waiting for your payment",
  paid: "Thank you! Your order is confirmed",
  shipped: "Your book is on its way",
  delivered: "Delivered. Happy reading!",
  failed: "The payment didn't go through",
  cancelled: "This order was cancelled",
  refunded: "This order was refunded",
};

function Details({ code }: { code: string }) {
  const router = useRouter();
  const { user } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(`/orders/${code}`)}`);
  }, [user, router, code]);

  // Load, and while it's still pending re-check a few times: right after Cashfree redirects
  // back, the payment can take a few seconds to confirm.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let tries = 0;
    const load = async () => {
      try {
        const { order } = await api<{ order: Order }>(`/orders/${encodeURIComponent(code)}`);
        if (cancelled) return;
        setOrder(order);
        if (order.status === "pending" && ++tries < 6) setTimeout(load, 3000);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError && err.status === 404 ? "We couldn't find this order on your account." : (err as Error).message);
      }
    };
    void load();
    return () => {
      cancelled = true;
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
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>Back to dashboard</Link>
      </div>
    );
  }
  if (!order) return <div className="h-96 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;

  const a = order.shippingAddress;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>Order {order.code}</CardDescription>
          <StatusBadge status={order.status} />
        </div>
        <CardTitle className="text-2xl">{HEADLINE[order.status]}</CardTitle>
        {order.status === "paid" && (
          <CardDescription>A confirmation email is on its way to {order.customer?.email}.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Book</dt>
          <dd>{order.item.title} · {order.item.edition}</dd>
          <dt className="text-muted-foreground">Amount</dt>
          <dd>{formatPrice(order.amount)}</dd>
          <dt className="text-muted-foreground">Placed</dt>
          <dd>{formatDate(order.createdAt)}</dd>
          {a?.line1 && (
            <>
              <dt className="text-muted-foreground">Ship to</dt>
              <dd>{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}</dd>
            </>
          )}
        </dl>

        {order.status === "pending" && (
          <div className="space-y-2">
            <Button onClick={payAgain} disabled={paying} className="w-full">
              {paying ? "Opening payment…" : "Complete payment"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already paid? It can take a minute to confirm. This page checks automatically.
            </p>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">History</h2>
          <OrderTimeline events={order.events} />
        </div>

        <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Back to dashboard
        </Link>
      </CardContent>
    </Card>
  );
}

export function OrderDetails({ code }: { code: string }) {
  return (
    <Details code={code} />
  );
}
