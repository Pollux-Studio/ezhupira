"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Card, ErrorNote, Field, Input, Loading, OrderStatusBadge, PageHeader } from "@/components/ui";
import { Select } from "@/components/select";
import { api, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";

type CfPayment = { cf_payment_id: string | number; payment_status: string; payment_group?: string; payment_amount?: number; payment_time?: string };

/** Sensible next step for each status, preselected in the update form. */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { paid: "shipped", shipped: "delivered" };

export default function OrderDetail() {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<{ orderStatus: string; payments: CfPayment[] } | null>(null);
  const [cfError, setCfError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ order: Order }>(`/admin/orders/${code}`).then((r) => setOrder(r.order), (err: Error) => setError(err.message));
    api<{ orderStatus: string; payments: CfPayment[] }>(`/admin/orders/${code}/payments`).then(setPayments, (err: Error) => setCfError(err.message));
  }, [code]);

  useEffect(load, [load]);

  async function update(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const { order } = await api<{ order: Order }>(`/admin/orders/${code}`, {
        method: "PATCH",
        body: { status: f.get("status"), note: String(f.get("note") ?? "").trim() || undefined, notify: f.get("notify") === "on" },
      });
      setOrder(order);
      setSaved(`Marked ${order.status}.`);
      form.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function sync() {
    setError(null);
    try {
      const { order } = await api<{ order: Order }>(`/admin/orders/${code}/sync`, { method: "POST" });
      setOrder(order);
      setSaved(`Checked with Cashfree: ${order.status}.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (error && !order) return <ErrorNote error={error} />;
  if (!order) return <Loading />;
  const a = order.shippingAddress;

  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader
        title={order.code}
        description={
          <>
            {order.item.title} · {order.item.edition} · {inr(order.amount)} · placed {dateTime(order.createdAt)}
          </>
        }
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="grid gap-6 p-5 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Customer</h2>
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-sm">
                <a href={`mailto:${order.customer.email}`} className="underline">
                  {order.customer.email}
                </a>
              </p>
              <p className="text-sm">
                <a href={`tel:+91${order.customer.phone}`} className="underline">
                  +91 {order.customer.phone}
                </a>
              </p>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Ship to</h2>
              {a?.line1 ? (
                <p className="text-sm leading-relaxed">
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                </p>
              ) : (
                <p className="text-sm text-muted">No address (digital edition)</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Payment</h2>
              {order.status === "pending" && (
                <Button variant="outline" onClick={sync}>
                  <RefreshCw /> Check with Cashfree
                </Button>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-muted">Paid at</dt>
              <dd>{dateTime(order.paidAt)}</dd>
              <dt className="text-muted">Cashfree payment ID</dt>
              <dd className="font-mono text-xs">{order.cashfree?.paymentId ?? "–"}</dd>
              <dt className="text-muted">Method</dt>
              <dd>{order.cashfree?.paymentMethod ?? "–"}</dd>
              <dt className="text-muted">Cashfree order status</dt>
              <dd>{payments?.orderStatus ?? (cfError ? "unavailable" : "…")}</dd>
            </dl>
            {payments && payments.payments.length > 0 && (
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="py-1.5 font-medium">Attempt</th>
                    <th className="py-1.5 font-medium">Method</th>
                    <th className="py-1.5 font-medium">Status</th>
                    <th className="py-1.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.payments.map((p) => (
                    <tr key={String(p.cf_payment_id)} className="border-t border-line">
                      <td className="py-1.5 font-mono text-xs">{String(p.cf_payment_id)}</td>
                      <td className="py-1.5">{p.payment_group ?? "–"}</td>
                      <td className="py-1.5">{p.payment_status}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.payment_amount != null ? inr(p.payment_amount) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {cfError && <p className="mt-3 text-xs text-muted">Live Cashfree details unavailable: {cfError}</p>}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">History</h2>
            <ol className="space-y-3 border-l border-line pl-4">
              {[...order.events].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-brand" />
                  <p className="text-sm font-medium capitalize">{e.status}</p>
                  {e.note && <p className="text-sm text-muted">{e.note}</p>}
                  <p className="text-xs text-muted">{dateTime(e.at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Update status</h2>
          <form onSubmit={update} className="grid gap-4">
            <Field label="New status">
              <Select
                name="status"
                defaultValue={NEXT[order.status] ?? order.status}
                key={order.status}
                options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <Field label="Note" hint="Shown to the customer, e.g. “DTDC tracking 1234567890”.">
              <Input name="note" maxLength={500} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--brand)]" />
              Email the customer (shipped, delivered, cancelled, refunded)
            </label>
            <ErrorNote error={order ? error : null} />
            {saved && <p className="text-sm text-ok">{saved}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update order"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
