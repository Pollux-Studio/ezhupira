// @cashfreepayments/cashfree-js ships without types; these cover what lib/checkout.ts uses.
declare module "@cashfreepayments/cashfree-js" {
  type CheckoutResult = { error?: { message: string }; redirect?: boolean; paymentDetails?: unknown };
  export type Cashfree = {
    checkout(options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }): Promise<CheckoutResult>;
  };
  export function load(options: { mode: "sandbox" | "production" }): Promise<Cashfree | null>;
}
