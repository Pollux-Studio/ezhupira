import Link from "next/link";
import { StatusBadge, formatDate } from "@/components/orders/order-status";
import type { Order } from "@/lib/api";
import { formatPrice } from "@/lib/preorder";

/** The reader's orders, newest first; each row opens the order page. */
export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="divide-y rounded-lg border bg-background">
      {orders.map((o) => (
        <li key={o.code}>
          <Link href={`/orders/${o.code}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {o.item.title} · {o.item.edition}
              </p>
              <p className="text-sm text-muted-foreground">
                {o.code} · {formatPrice(o.amount)} · {formatDate(o.createdAt)}
              </p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
