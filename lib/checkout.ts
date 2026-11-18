"use client";

import { load } from "@cashfreepayments/cashfree-js";
import type { CheckoutSession } from "@/lib/api";

/** Opens Cashfree's checkout. It redirects back to /orders/<code> when the payment finishes. */
export async function openCheckout(session: CheckoutSession) {
  const cashfree = await load({ mode: session.cashfreeMode });
  if (!cashfree) throw new Error("Couldn't load the payment page. Please try again.");
  const result = await cashfree.checkout({ paymentSessionId: session.paymentSessionId, redirectTarget: "_self" });
  if (result?.error) throw new Error(result.error.message);
}
