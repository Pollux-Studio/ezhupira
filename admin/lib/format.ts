export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const dateTime = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "–";

export const date = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "–";

/** The website, for "view on site" links. */
export const SITE_URL = process.env.NODE_ENV === "production" ? "https://ezhupira.in" : "http://localhost:3000";
