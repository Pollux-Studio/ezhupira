// Client for the Ezhupira API server (server/, deployed on Render).
// The session lives in an httpOnly cookie on .ezhupira.in, so every call sends credentials.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      credentials: "include",
      headers: init.body !== undefined || init.method ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : init.method && init.method !== "GET" ? "{}" : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Something went wrong. Please try again.", res.status);
  return data as T;
}

// ------------------------------------------------------------------ types ---

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string | null;
  /** DiceBear seed saved on the account; the avatar is drawn from it. */
  avatarSeed: string;
  role: "reader" | "admin";
  /** ISO date the account was created. */
  memberSince: string | null;
};

/** A review the signed-in reader wrote. "pending" until an admin approves it. */
export type MyReview = {
  id: string;
  bookSlug: string;
  name: string;
  rating: number;
  text: string;
  status: "pending" | "published";
  createdAt: string;
  updatedAt: string;
};

/** A book on the reader's shelf marked as read. */
export type ReadBook = { bookSlug: string; readAt: string };

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "shipped" | "delivered" | "refunded";

export type OrderEvent = { status: OrderStatus; note?: string; at: string };

export type Order = {
  code: string;
  status: OrderStatus;
  bookSlug?: string;
  item: { title: string; edition: string };
  amount: number;
  currency: string;
  customer?: { name: string; email: string; phone: string };
  shippingAddress?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  events: OrderEvent[];
  createdAt: string;
  paidAt?: string;
};

export type CatalogEdition = { id: "hardcopy" | "ebook"; name: string; price: number; needsAddress: boolean };
export type Catalog = {
  cashfreeMode: "sandbox" | "production";
  books: { slug: string; title: string; onSale: boolean; editions: CatalogEdition[] }[];
};

export type CheckoutSession = { code: string; paymentSessionId: string; cashfreeMode: "sandbox" | "production" };

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  failed: "Payment failed",
  cancelled: "Cancelled",
  shipped: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
};
