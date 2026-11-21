// Keeping our orders in step with Cashfree. Cashfree is the source of truth for payment;
// both the webhook and the customer's return page call syncFromCashfree, and the
// pending → paid transition is atomic, so the confirmation email goes out exactly once.
import { randomBytes } from "node:crypto";
import { getOrder, getPayments } from "./cashfree.js";
import { sendOrderConfirmation } from "./mail.js";
import { Order, type OrderDoc } from "../models.js";

/** The order_id Cashfree knows this order by (see `cashfree.ref` in models.ts). */
export const cashfreeRef = (order: Pick<OrderDoc, "code" | "cashfree">) => order.cashfree?.ref ?? order.code;

/** A fresh, unique Cashfree order_id for a new order. */
export const newCashfreeRef = (code: string) => `${code}-${randomBytes(4).toString("hex")}`;

export async function syncFromCashfree(order: OrderDoc): Promise<OrderDoc> {
  if (order.status !== "pending") return order;

  const ref = cashfreeRef(order);
  const cf = await getOrder(ref);

  if (cf.order_status === "PAID") {
    if (Math.abs(Number(cf.order_amount) - order.amount) > 0.001) {
      console.error(`Amount mismatch on ${order.code}: ours ${order.amount}, Cashfree ${cf.order_amount}`);
      return order;
    }
    const payments = await getPayments(ref).catch(() => []);
    const ok = payments.find((p) => p.payment_status === "SUCCESS");
    const paid = await Order.findOneAndUpdate(
      { _id: order._id, status: "pending" },
      {
        $set: {
          status: "paid",
          paidAt: new Date(),
          "cashfree.paymentId": ok ? String(ok.cf_payment_id) : undefined,
          "cashfree.paymentMethod": ok?.payment_group,
        },
        $push: { events: { status: "paid", note: "Payment received" } },
      },
      { new: true },
    );
    if (!paid) return (await Order.findById(order._id)) as OrderDoc; // someone else got there first

    try {
      await sendOrderConfirmation(paid as OrderDoc);
      await Order.updateOne({ _id: paid._id }, { $set: { confirmationEmailSentAt: new Date() } });
    } catch (err) {
      // The order is paid either way; a failed email must not fail the webhook.
      console.error(`Confirmation email for ${paid.code} failed:`, err);
    }
    return paid as OrderDoc;
  }

  if (cf.order_status === "EXPIRED" || cf.order_status === "TERMINATED") {
    return ((await Order.findOneAndUpdate(
      { _id: order._id, status: "pending" },
      { $set: { status: "cancelled" }, $push: { events: { status: "cancelled", note: "Payment window expired" } } },
      { new: true },
    )) ?? order) as OrderDoc;
  }

  // ACTIVE: not paid yet, and the customer can still retry. Note the latest attempt, so a
  // failed payment shows as failed (and appears in the history once).
  return recordLastAttempt(order, ref);
}

const FAILED_ATTEMPT = new Set(["FAILED", "USER_DROPPED", "CANCELLED", "VOID"]);

async function recordLastAttempt(order: OrderDoc, ref: string): Promise<OrderDoc> {
  const payments = await getPayments(ref).catch(() => []);
  const latest = [...payments]
    .filter((p) => p.payment_status !== "NOT_ATTEMPTED")
    .sort((a, b) => new Date(b.payment_time ?? 0).getTime() - new Date(a.payment_time ?? 0).getTime())[0];
  if (!latest) return order;

  const paymentId = String(latest.cf_payment_id);
  const prev = order.cashfree?.lastAttempt;
  if (prev?.paymentId === paymentId && prev.status === latest.payment_status) return order; // nothing new

  const failed = FAILED_ATTEMPT.has(latest.payment_status);
  const isNewFailure = failed && !(prev?.paymentId === paymentId && prev.status && FAILED_ATTEMPT.has(prev.status));
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending" },
    {
      $set: {
        "cashfree.lastAttempt": {
          paymentId,
          status: latest.payment_status,
          message: latest.payment_message,
          at: latest.payment_time ? new Date(latest.payment_time) : new Date(),
        },
      },
      ...(isNewFailure && {
        $push: {
          events: {
            status: "failed",
            note: latest.payment_status === "USER_DROPPED" ? "Payment was not completed. You can try again." : "Payment didn't go through. You can try again.",
          },
        },
      }),
    },
    { new: true },
  );
  return (updated ?? order) as OrderDoc;
}

function attemptState(status?: string | null) {
  if (!status) return undefined;
  if (FAILED_ATTEMPT.has(status)) return "failed" as const;
  if (status === "PENDING") return "processing" as const;
  return undefined;
}

/** What the customer may see about their own order. */
export function ownerView(order: OrderDoc) {
  return {
    code: order.code,
    status: order.status,
    bookSlug: order.bookSlug,
    item: order.item,
    amount: order.amount,
    currency: order.currency,
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    events: order.events,
    createdAt: (order as { createdAt?: Date }).createdAt,
    paidAt: order.paidAt,
    /** "failed": the last attempt didn't go through; "processing": the bank hasn't confirmed yet. */
    payment: order.status === "pending" ? attemptState(order.cashfree?.lastAttempt?.status) : undefined,
  };
}

/** What anyone with the order ID + contact may see (Track order page): no personal details. */
export function trackingView(order: OrderDoc) {
  return {
    code: order.code,
    status: order.status,
    item: order.item,
    events: order.events,
    createdAt: (order as { createdAt?: Date }).createdAt,
  };
}
