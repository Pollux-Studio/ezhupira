import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, type OrderEvent, type OrderStatus } from "@/lib/api";

const date = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function StatusBadge({ status }: { status: OrderStatus }) {
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
