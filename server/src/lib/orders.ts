// Keeping our orders in step with Cashfree. Cashfree is the source of truth for payment;
// both the webhook and the customer's return page call syncFromCashfree, and the
// pending → paid transition is atomic, so the confirmation email goes out exactly once.
import { getOrder, getPayments } from "./cashfree.js";
import { sendOrderConfirmation } from "./mail.js";
import { Order, type OrderDoc } from "../models.js";

export async function syncFromCashfree(order: OrderDoc): Promise<OrderDoc> {
  if (order.status !== "pending") return order;

  const cf = await getOrder(order.code);

  if (cf.order_status === "PAID") {
    if (Math.abs(Number(cf.order_amount) - order.amount) > 0.001) {
      console.error(`Amount mismatch on ${order.code}: ours ${order.amount}, Cashfree ${cf.order_amount}`);
      return order;
    }
    const payments = await getPayments(order.code).catch(() => []);
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

  return order; // ACTIVE: not paid yet; the customer can still retry
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
