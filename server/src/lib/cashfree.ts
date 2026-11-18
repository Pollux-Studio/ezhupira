// Cashfree Payment Gateway (Orders API). Docs: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env.js";

const BASE = env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

export type CashfreeOrderStatus = "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

type CashfreeOrder = {
  cf_order_id: string | number;
  order_id: string;
  order_status: CashfreeOrderStatus;
  order_amount: number;
  payment_session_id: string;
};

type CashfreePayment = {
  cf_payment_id: string | number;
  payment_status: "SUCCESS" | "NOT_ATTEMPTED" | "FAILED" | "USER_DROPPED" | "VOID" | "CANCELLED" | "PENDING";
  payment_group?: string;
  payment_amount?: number;
};

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": env.CASHFREE_API_VERSION,
      "x-client-id": env.CASHFREE_APP_ID,
      "x-client-secret": env.CASHFREE_SECRET_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; code?: string };
  if (!res.ok) throw new Error(`Cashfree ${method} ${path} failed (${res.status}): ${data.message ?? data.code ?? "unknown error"}`);
  return data;
}

/** Indian mobile number as the 10 digits Cashfree expects, or null if it isn't one. */
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function createOrder(input: {
  orderId: string;
  amount: number;
  customer: { id: string; name: string; email: string; phone: string };
  note?: string;
}) {
  return call<CashfreeOrder>("POST", "/orders", {
    order_id: input.orderId,
    order_amount: input.amount,
    order_currency: "INR",
    order_note: input.note,
    customer_details: {
      customer_id: input.customer.id,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
    },
    order_meta: {
      // Cashfree redirects here (GET) after success, failure or cancel.
      return_url: `${env.SITE_URL}/orders/${encodeURIComponent(input.orderId)}`,
      // Webhook; must be https, so only sent when this server is publicly reachable.
      ...(env.PUBLIC_URL.startsWith("https://") && { notify_url: `${env.PUBLIC_URL}/webhooks/cashfree` }),
    },
  });
}

export const getOrder = (orderId: string) => call<CashfreeOrder>("GET", `/orders/${encodeURIComponent(orderId)}`);

export const getPayments = (orderId: string) => call<CashfreePayment[]>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);

/** Webhook check: Base64(HMAC-SHA256(timestamp + rawBody, secret key)) must equal x-webhook-signature. */
export function verifyWebhook(rawBody: Buffer, timestamp: string | undefined, signature: string | undefined) {
  if (!timestamp || !signature) return false;
  // No timestamp cutoff: a replayed webhook is harmless because the handler re-reads the
  // order status from Cashfree, and a cutoff could reject Cashfree's own delayed retries.
  const expected = createHmac("sha256", env.CASHFREE_SECRET_KEY).update(timestamp).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
