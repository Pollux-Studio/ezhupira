import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, type Order, type OrderEvent, type OrderStatus } from "@/lib/api";

const date = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/**
 * Order status badge. Pass `payment` (from an unpaid order) so a failed attempt reads
 * "Payment failed" rather than "Awaiting payment"; the order itself stays open for a retry.
 */
export function StatusBadge({ status, payment }: { status: OrderStatus; payment?: Order["payment"] }) {
  if (status === "pending" && payment === "failed") return <Badge variant="destructive">Payment failed</Badge>;
  if (status === "pending" && payment === "processing") return <Badge variant="outline">Processing</Badge>;
  const variant = status === "failed" || status === "cancelled" ? "destructive" : status === "pending" ? "outline" : "default";
  return <Badge variant={variant}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

/** Order history, newest first. */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="space-y-3 border-l pl-4">
      {[...events].reverse().map((e, i) => (
        <li key={`${e.status}-${e.at}-${i}`} className="relative">
          <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" aria-hidden />
          <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.status]}</p>
          {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
          <p className="text-xs text-muted-foreground">{date(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}

export const formatDate = date;
