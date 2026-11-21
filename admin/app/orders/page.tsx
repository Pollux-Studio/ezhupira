"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Button, Card, Empty, ErrorNote, Input, Loading, OrderStatusBadge, PageHeader } from "@/components/ui";
import { Select } from "@/components/select";
import { api, ORDER_STATUSES, type Order } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";

function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (q) qs.set("q", q);
    api<{ orders: Order[] }>(`/admin/orders?${qs}`).then(
      (r) => {
        setOrders(r.orders);
        setError(null);
      },
      (err: Error) => setError(err.message),
    );
  }, [status, q]);

  function setFilter(next: { status?: string; q?: string }) {
    const qs = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) v ? qs.set(k, v) : qs.delete(k);
    router.replace(`/orders?${qs}`);
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFilter({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
  }

  return (
    <>
      <PageHeader title="Orders" description="Every order placed through Ezhupira's checkout." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          value={status || "all"}
          onValueChange={(v) => setFilter({ status: v === "all" ? "" : v })}
          options={[{ value: "all", label: "All statuses" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
          className="w-44"
          aria-label="Status"
        />
        <form onSubmit={search} className="flex flex-1 gap-2">
          <Input name="q" defaultValue={q} key={q} placeholder="Search order ID, name, email or phone" className="min-w-48 flex-1" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <ErrorNote error={error} />
      {!orders ? (
        <Loading />
      ) : orders.length === 0 ? (
        <Empty>No orders match.</Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.code} className="border-t border-line hover:bg-bg">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/orders/${o.code}`} className="hover:text-brand hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customer.name}</div>
                    <div className="text-xs text-muted">{o.customer.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {o.item.title} · {o.item.edition}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{inr(o.amount)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersList />
    </Suspense>
  );
}
