"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Card, Empty, ErrorNote, Loading, PageHeader, cx } from "@/components/ui";
import { api, type Ticket } from "@/lib/api";
import { dateTime } from "@/lib/format";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
  { value: "", label: "All" },
];

const TICKET_TONE = { open: "brand", answered: "warn", closed: "neutral" } as const;

export default function SupportPage() {
  const [status, setStatus] = useState("open");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ tickets: Ticket[] }>(`/admin/support${status ? `?status=${status}` : ""}`).then(
      (r) => setTickets(r.tickets),
      (err: Error) => setError(err.message),
    );
  }, [status]);

  return (
    <>
      <PageHeader title="Support" description="Messages from the website's contact form (ezhupira.in/support). Replies go out by email." />
      <div className="mb-4 inline-flex rounded-md border border-line bg-surface p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setTickets(null);
              setStatus(f.value);
            }}
            className={cx("rounded px-3 py-1.5 text-sm font-medium", status === f.value ? "bg-brand text-brand-ink" : "text-muted hover:text-ink")}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ErrorNote error={error} />
      {!tickets ? (
        <Loading />
      ) : tickets.length === 0 ? (
        <Empty>No {status || ""} tickets.</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {tickets.map((t) => (
              <li key={t.code}>
                <Link href={`/support/${t.code}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-bg">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.subject}</p>
                    <p className="truncate text-sm text-muted">
                      {t.code} · {t.name} · {t.email}
                      {t.orderCode && <> · {t.orderCode}</>}
                    </p>
                  </div>
                  <span className="text-sm text-muted">{dateTime(t.updatedAt)}</span>
                  <Badge tone={TICKET_TONE[t.status]}>{t.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
