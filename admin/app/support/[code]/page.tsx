"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, ErrorNote, Loading, PageHeader, Textarea, cx } from "@/components/ui";
import { api, type Ticket } from "@/lib/api";
import { dateTime } from "@/lib/format";

const TONE = { open: "brand", answered: "warn", closed: "neutral" } as const;

export default function TicketPage() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<{ ticket: Ticket }>(`/admin/support/${code}`).then((r) => setTicket(r.ticket), (err: Error) => setError(err.message));
  }, [code]);

  async function send(e: FormEvent<HTMLFormElement>, close: boolean) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const { ticket: t } = await api<{ ticket: Ticket }>(`/admin/support/${code}/reply`, { body: { text: reply, close } });
      setTicket(t);
      setReply("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: Ticket["status"]) {
    setError(null);
    try {
      const { ticket: t } = await api<{ ticket: Ticket }>(`/admin/support/${code}`, { method: "PATCH", body: { status } });
      setTicket(t);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (error && !ticket) return <ErrorNote error={error} />;
  if (!ticket) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/support" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Support
      </Link>
      <PageHeader
        title={ticket.subject}
        description={
          <>
            {ticket.code} · {ticket.name} &lt;
            <a href={`mailto:${ticket.email}`} className="underline">
              {ticket.email}
            </a>
            &gt; · {ticket.topic}
            {ticket.orderCode && (
              <>
                {" "}
                ·{" "}
                <Link href={`/orders/${ticket.orderCode}`} className="underline">
                  {ticket.orderCode}
                </Link>
              </>
            )}
          </>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge tone={TONE[ticket.status]}>{ticket.status}</Badge>
            {ticket.status === "closed" ? (
              <Button variant="outline" onClick={() => setStatus("open")}>
                Reopen
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setStatus("closed")}>
                Close
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-3">
        {ticket.messages.map((m, i) => (
          <Card key={i} className={cx("p-4", m.from === "admin" && "ml-8 border-brand/30 bg-brand-soft/40")}>
            <p className="mb-2 text-xs text-muted">
              {m.from === "admin" ? "You replied" : ticket.name} · {dateTime(m.at)}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-4">
        <form onSubmit={(e) => send(e, false)} className="grid gap-3">
          <label className="text-sm font-medium" htmlFor="reply">
            Reply to {ticket.email}
          </label>
          <Textarea id="reply" rows={6} value={reply} onChange={(e) => setReply(e.target.value)} required maxLength={8000} />
          <ErrorNote error={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={sending || !reply.trim()}>
              <Send /> {sending ? "Sending…" : "Send reply"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={sending || !reply.trim()}
              onClick={(e) => send(e as unknown as FormEvent<HTMLFormElement>, true)}
            >
              Send & close
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
