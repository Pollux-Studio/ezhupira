"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Empty, ErrorNote, Loading, OrderStatusBadge, PageHeader } from "@/components/ui";
import { api, type Order } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";

type Payment = Pick<Order, "code" | "status" | "amount" | "currency" | "paidAt" | "cashfree" | "item"> & { customer: { name: string; email: string } };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ payments: Payment[] }>("/admin/payments").then((r) => setPayments(r.payments), (err: Error) => setError(err.message));
  }, []);

  const received = (payments ?? []).filter((p) => p.status !== "refunded").reduce((s, p) => s + p.amount, 0);
  const refunded = (payments ?? []).filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader title="Payments" description="Money received through Cashfree. Payouts and settlements are in the Cashfree dashboard." />
      <ErrorNote error={error} />
      {!payments ? (
        <Loading />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-muted">Received</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{inr(received)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted">Refunded</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{inr(refunded)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted">Payments</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{payments.length}</p>
            </Card>
          </div>
          {payments.length === 0 ? (
            <Empty>No payments yet.</Empty>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Paid</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Cashfree payment ID</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.code} className="border-t border-line hover:bg-bg">
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{dateTime(p.paidAt)}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/orders/${p.code}`} className="hover:text-brand hover:underline">
                          {p.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{p.customer.name}</td>
                      <td className="px-4 py-3">{p.cashfree?.paymentMethod ?? "–"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.cashfree?.paymentId ?? "–"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{inr(p.amount)}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  );
}
