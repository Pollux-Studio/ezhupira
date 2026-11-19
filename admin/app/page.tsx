"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RevenueChart } from "@/components/revenue-chart";
import { Card, ErrorNote, Loading, OrderStatusBadge, PageHeader } from "@/components/ui";
import { api, ORDER_STATUSES, type Order, type Stats } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";

function Tile({ label, value, href, note }: { label: string; value: string | number; href?: string; note?: string }) {
  const body = (
    <Card className="h-full p-4 transition hover:border-brand/40">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<Stats>("/admin/stats"), api<{ orders: Order[] }>("/admin/orders")]).then(
      ([s, o]) => {
        setStats(s);
        setRecent(o.orders.slice(0, 8));
      },
      (err: Error) => setError(err.message),
    );
  }, []);

  if (error) return <ErrorNote error={error} />;
  if (!stats || !recent) return <Loading />;

  return (
    <>
      <PageHeader title="Overview" description="Sales, orders and what needs your attention." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label="Revenue" value={inr(stats.revenue)} note="paid, shipped and delivered" href="/payments" />
        <Tile label="Paid orders" value={stats.paidOrders} href="/orders?status=paid" />
        <Tile label="Awaiting payment" value={stats.byStatus.pending ?? 0} href="/orders?status=pending" />
        <Tile label="Reviews to approve" value={stats.pendingReviews} href="/reviews" />
        <Tile label="Open support tickets" value={stats.openTickets} href="/support" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="p-5">
          <RevenueChart daily={stats.daily} />
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Orders by status</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/orders?status=${s}`} className="flex items-center justify-between py-2 hover:text-brand">
                  <OrderStatusBadge status={s} />
                  <span className="tabular-nums">{stats.byStatus[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">{stats.readers} registered readers</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Sales by book</h2>
          {stats.byItem.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No paid orders yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Book · edition</th>
                  <th className="py-1.5 text-right font-medium">Orders</th>
                  <th className="py-1.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.byItem.map((i) => (
                  <tr key={`${i.book}-${i.edition}`} className="border-t border-line">
                    <td className="py-2">
                      {i.book} · {i.edition}
                    </td>
                    <td className="py-2 text-right tabular-nums">{i.orders}</td>
                    <td className="py-2 text-right tabular-nums">{inr(i.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Latest orders</h2>
            <Link href="/orders" className="text-sm text-muted underline hover:text-ink">
              All orders
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {recent.map((o) => (
                <li key={o.code}>
                  <Link href={`/orders/${o.code}`} className="flex items-center justify-between gap-3 py-2 hover:text-brand">
                    <span className="min-w-0">
                      <span className="font-medium">{o.code}</span>{" "}
                      <span className="text-muted">
                        · {o.customer.name} · {dateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums">{inr(o.amount)}</span>
                      <OrderStatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
