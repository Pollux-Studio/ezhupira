// Every setting the server needs, validated once at startup so a missing secret fails the
// deploy loudly instead of breaking a customer's checkout later.
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  /** The website, e.g. https://ezhupira.in. Used for CORS and payment return links. */
  SITE_URL: z.url().default("http://localhost:3000"),
  /** Extra allowed origins, comma-separated (e.g. Vercel preview URLs). */
  EXTRA_ORIGINS: z.string().default(""),
  /** This server's public URL, e.g. https://api.ezhupira.in. Used for webhooks and keep-alive. */
  PUBLIC_URL: z.url().default("http://localhost:4000"),
  /** Cookie domain so ezhupira.in and api.ezhupira.in share the session, e.g. ".ezhupira.in". */
  COOKIE_DOMAIN: z.string().optional(),

  MONGODB_URI: z.string().min(1),
  /** Optional DNS servers, comma-separated, for networks whose resolver refuses SRV lookups (local dev). */
  DNS_SERVERS: z.string().optional(),

  /** Firebase project ID (Project settings → General), e.g. "ezhupira". Used to verify sign-in tokens. */
  FIREBASE_PROJECT_ID: z.string().min(1),
  /** Random string of 32+ characters for signing session cookies. */
  SESSION_SECRET: z.string().min(32),
  /** Comma-separated emails that get the admin role on sign-in. */
  ADMIN_EMAILS: z.string().default(""),

  CASHFREE_APP_ID: z.string().min(1),
  CASHFREE_SECRET_KEY: z.string().min(1),
  CASHFREE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  CASHFREE_API_VERSION: z.string().default("2026-01-01"),

  RESEND_API_KEY: z.string().min(1),
  /** Verified sender in Resend, e.g. "Ezhupira <orders@ezhupira.in>". */
  MAIL_FROM: z.string().min(1),
  /** Where new-order notifications for you go. */
  MAIL_ADMIN: z.string().optional(),

  /** Shared with the website's /api/revalidate so book edits show up right away. Optional. */
  REVALIDATE_SECRET: z.string().optional(),

  /** Ping PUBLIC_URL/health on this interval (minutes) so Render's free tier doesn't sleep. 0 = off. */
  KEEP_ALIVE_MINUTES: z.coerce.number().default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const allowedOrigins = [env.SITE_URL, ...env.EXTRA_ORIGINS.split(",")].map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
export const adminEmails = new Set(env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
