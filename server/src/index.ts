import cookieParser from "cookie-parser";
import dns from "node:dns";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { allowedOrigins, env, isProd } from "./env.js";
import { readSession } from "./lib/auth.js";
import { seedBooks } from "./lib/books.js";
import { addressesRouter } from "./routes/addresses.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { reviewsRouter } from "./routes/reviews.js";
import { shelfRouter } from "./routes/shelf.js";
import { supportRouter } from "./routes/support.js";
import { webhooksRouter } from "./routes/webhooks.js";

const app = express();
app.set("trust proxy", 1); // Render sits in front; needed for real client IPs in rate limits
app.disable("x-powered-by");
app.use(helmet());

// Health check: Render's health probe and the keep-alive ping. No DB call, so it's instant.
app.get("/health", (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1, uptime: Math.round(process.uptime()) });
});

// Server-to-server, signed; needs the raw body, so it's mounted before CORS and JSON parsing.
app.use("/webhooks", webhooksRouter);

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// CSRF guard on top of SameSite=Lax cookies: writes must be JSON, which a plain cross-site
// form can't send without a CORS preflight (and the preflight only passes for our origins).
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Send JSON." });
  }
  next();
});

app.use(readSession);
app.use("/auth", authRouter);
app.use("/", ordersRouter);
app.use("/", reviewsRouter);
app.use("/me/shelf", shelfRouter);
app.use("/me/addresses", addressesRouter);
app.use("/", supportRouter);
app.use("/admin", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(",").map((s) => s.trim()));
await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
console.log("MongoDB connected");
await seedBooks();

app.listen(env.PORT, () => console.log(`API listening on :${env.PORT} (${env.NODE_ENV}, Cashfree ${env.CASHFREE_ENV})`));

// Keep-alive for Render's free tier, which sleeps after 15 minutes without inbound traffic.
// The ping goes out through the public URL, so Render counts it as traffic.
if (isProd && env.KEEP_ALIVE_MINUTES > 0 && env.PUBLIC_URL.startsWith("https://")) {
  setInterval(() => {
    fetch(`${env.PUBLIC_URL}/health`).catch((err) => console.warn("Keep-alive ping failed:", err.message));
  }, env.KEEP_ALIVE_MINUTES * 60 * 1000).unref();
}

// Render sends SIGTERM on deploys; finish in-flight requests' DB work cleanly.
process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  process.exit(0);
});
