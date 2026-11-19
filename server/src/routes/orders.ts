import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { findEdition, listPublicBooks } from "../lib/books.js";
import { env } from "../env.js";
import { requireAuth } from "../lib/auth.js";
import { createOrder, getOrder, normalizePhone } from "../lib/cashfree.js";
import { ownerView, syncFromCashfree, trackingView } from "../lib/orders.js";
import { nextOrderCode, Order, User, type OrderDoc } from "../models.js";

export const ordersRouter = Router();

const checkoutLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const trackLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

/** Editions and prices, so the website shows exactly what will be charged. */
ordersRouter.get("/catalog", async (_req, res) => {
  const books = await listPublicBooks();
  res.json({
    cashfreeMode: env.CASHFREE_ENV,
    books: books.map((b) => ({ slug: b.slug, title: b.title, onSale: b.preorderOpen, editions: b.editions })),
  });
});

/** Every book on the site (the website and admin read the catalogue from here). */
ordersRouter.get("/books", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=30");
  res.json({ books: await listPublicBooks() });
});

const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
});

const createSchema = z.object({
  bookSlug: z.string(),
  editionId: z.string(),
  name: z.string().trim().min(3, "Enter your full name").max(100),
  phone: z.string().trim(),
  address: addressSchema.optional(),
});

/** Start checkout: save a pending order and open a Cashfree payment session for it. */
ordersRouter.post("/orders", requireAuth, checkoutLimit, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid order." });
  const { bookSlug, editionId, name, address } = parsed.data;

  const found = await findEdition(bookSlug, editionId);
  if (!found) {
    return res.status(400).json({ error: "This edition isn't open for orders yet." });
  }
  if (found.edition.needsAddress && !address) return res.status(400).json({ error: "Please add a shipping address." });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." });

  const user = await User.findById(req.session!.userId);
  if (!user) return res.status(401).json({ error: "Please sign in." });

  const order = await Order.create({
    code: await nextOrderCode(),
    user: user._id,
    bookSlug,
    editionId,
    item: { title: found.book.title, edition: found.edition.name },
    amount: found.edition.price,
    customer: { name, email: user.email, phone },
    shippingAddress: found.edition.needsAddress ? address : undefined,
    events: [{ status: "pending", note: "Order placed, awaiting payment" }],
  });

  try {
    const cf = await createOrder({
      orderId: order.code,
      amount: order.amount,
      customer: { id: user._id.toString(), name, email: user.email, phone },
      note: `${found.book.title} · ${found.edition.name}`,
    });
    order.cashfree = { orderId: String(cf.cf_order_id), paymentSessionId: cf.payment_session_id };
    await order.save();
    res.status(201).json({ code: order.code, paymentSessionId: cf.payment_session_id, cashfreeMode: env.CASHFREE_ENV });
  } catch (err) {
    console.error(`Cashfree order for ${order.code} failed:`, err);
    order.status = "failed";
    order.events.push({ status: "failed", note: "Could not start payment" });
    await order.save();
    res.status(502).json({ error: "Couldn't start the payment. Please try again in a minute." });
  }
});

ordersRouter.get("/orders/mine", requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.session!.userId }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders: orders.map((o) => ownerView(o as OrderDoc)) });
});

async function loadOwnOrder(code: string, session: { userId: string; role: string }) {
  const order = (await Order.findOne({ code: code.toUpperCase() })) as OrderDoc | null;
  if (!order) return null;
  if (session.role !== "admin" && order.user.toString() !== session.userId) return null;
  return order;
}

/** The customer's own order. Pending orders are checked with Cashfree first (the return page). */
ordersRouter.get("/orders/:code", requireAuth, async (req, res) => {
  let order = await loadOwnOrder(String(req.params.code), req.session!);
  if (!order) return res.status(404).json({ error: "Order not found." });
  try {
    order = await syncFromCashfree(order);
  } catch (err) {
    console.error(`Sync ${order.code} failed:`, err);
  }
  res.json({ order: ownerView(order) });
});

/** Retry payment for a pending order while its Cashfree session is still open. */
ordersRouter.post("/orders/:code/pay", requireAuth, checkoutLimit, async (req, res) => {
  const order = await loadOwnOrder(String(req.params.code), req.session!);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending") return res.status(409).json({ error: `This order is ${order.status}.` });
  const cf = await getOrder(order.code);
  if (cf.order_status !== "ACTIVE") {
    await syncFromCashfree(order);
    return res.status(409).json({ error: "This payment window has closed. Please place a new order." });
  }
  res.json({ code: order.code, paymentSessionId: cf.payment_session_id, cashfreeMode: env.CASHFREE_ENV });
});

/** Public order tracking: order ID + the phone or email used. Same reply for "no order" and "wrong contact". */
ordersRouter.post("/orders/track", trackLimit, async (req, res) => {
  const body = z.object({ code: z.string().trim().min(3).max(20), contact: z.string().trim().min(3).max(120) }).safeParse(req.body);
  const notFound = () => res.status(404).json({ error: "We couldn't find an order with those details." });
  if (!body.success) return notFound();

  const order = (await Order.findOne({ code: body.data.code.toUpperCase() })) as OrderDoc | null;
  if (!order) return notFound();
  const contact = body.data.contact.toLowerCase();
  const phone = normalizePhone(contact);
  const matches = contact === order.customer.email || (phone !== null && phone === order.customer.phone);
  if (!matches) return notFound();
  res.json({ order: trackingView(order) });
});
