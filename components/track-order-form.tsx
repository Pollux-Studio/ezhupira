"use client";

import { useState, type FormEvent } from "react";
import { OrderTimeline, StatusBadge } from "@/components/orders/order-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, type Order } from "@/lib/api";

type Tracked = Pick<Order, "code" | "status" | "item" | "events" | "createdAt">;

export function TrackOrderForm() {
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await api<{ order: Tracked }>("/orders/track", {
        body: { code: String(data.get("orderId") ?? "").trim(), contact: String(data.get("contact") ?? "").trim() },
      });
      setOrder(res.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track your order</CardTitle>
        <CardDescription>Enter your order ID and the phone number or email you ordered with.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="orderId">Order ID</FieldLabel>
              <Input id="orderId" name="orderId" placeholder="e.g. EZH-1024" autoComplete="off" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact">Phone or email</FieldLabel>
              <Input id="contact" name="contact" autoComplete="email" required />
            </Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Looking it up…" : "Track order"}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </FieldGroup>
        </form>

        {order && (
          <div role="status" className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{order.code}</p>
                <p className="text-sm text-muted-foreground">
                  {order.item.title} · {order.item.edition}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <OrderTimeline events={order.events} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
