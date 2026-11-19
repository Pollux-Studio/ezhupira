// Client for the Ezhupira API (same server as the website). The admin session is the same
// httpOnly cookie on .ezhupira.in, so every call sends credentials.

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://api.ezhupira.in" : "http://localhost:4000")
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? (init.body !== undefined ? "POST" : "GET");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: method === "GET" ? undefined : { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(init.body ?? {}),
    });
  } catch {
    throw new ApiError("Can't reach the API. Check your connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

// ------------------------------------------------------------------ types ---

export type User = { id: string; name: string; email: string; avatarSeed: string; role: "reader" | "admin" };

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "failed", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  _id: string;
  code: string;
  status: OrderStatus;
  bookSlug: string;
  editionId: string;
  item: { title: string; edition: string };
  amount: number;
  currency: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  cashfree?: { orderId?: string; paymentId?: string; paymentMethod?: string };
  events: { status: OrderStatus; note?: string; at: string }[];
  paidAt?: string;
  createdAt: string;
};

export type Stats = {
  revenue: number;
  paidOrders: number;
  byStatus: Partial<Record<OrderStatus, number>>;
  byItem: { book: string; edition: string; orders: number; revenue: number }[];
  daily: { date: string; revenue: number; orders: number }[];
  readers: number;
  pendingReviews: number;
  openTickets: number;
};

export type Edition = { id: "hardcopy" | "ebook"; name: string; description?: string; price: number; needsAddress: boolean };

export type Book = {
  slug: string;
  title: string;
  titleMallikai?: string;
  author: string;
  authorMallikai?: string;
  description: string;
  year: string;
  status: "published" | "upcoming" | "hidden";
  releaseAt?: string;
  displayPrice: { amount?: number | null; note?: string | null } | null;
  cover?: string;
  publisher?: { name: string; logo: string; url?: string };
  buyUrl?: string;
  buyLabel?: string;
  preview?: string[];
  highlights?: string[];
  availability?: string;
  details?: { label: string; value: string; valueMallikai?: string }[];
  editions: Edition[];
  preorderOpen: boolean;
  sortOrder: number;
  updatedAt?: string;
};

export type Review = {
  _id: string;
  bookSlug: string;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
  user: { email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type Ticket = {
  _id: string;
  code: string;
  name: string;
  email: string;
  topic: "order" | "payment" | "book" | "account" | "other";
  orderCode?: string;
  subject: string;
  status: "open" | "answered" | "closed";
  messages: { from: "reader" | "admin"; text: string; at: string }[];
  createdAt: string;
  updatedAt: string;
};
