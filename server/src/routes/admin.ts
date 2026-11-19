// Admin API (accounts in ADMIN_EMAILS): sales, orders, payments, books, reviews, support.
// Used by the separate admin app at admin.ezhupira.in.
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import { publicBook, withMallikai, type BookRecord } from "../lib/books.js";
import { getOrder, getPayments } from "../lib/cashfree.js";
import { sendStatusUpdate, sendTicketReply } from "../lib/mail.js";
import { syncFromCashfree } from "../lib/orders.js";
import { revalidateWebsite } from "../lib/revalidate.js";
import { BOOK_STATUSES, Book, ORDER_STATUSES, Order, Review, TICKET_STATUSES, Ticket, User, type OrderDoc } from "../models.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

/** Orders that count as money in. */
const PAID = ["paid", "shipped", "delivered"];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ------------------------------------------------------------------ stats ---

/** Headline numbers for the overview: revenue, orders by status, sales per book/edition, last 30 days. */
adminRouter.get("/stats", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totals, byStatus, byItem, daily, readers, pendingReviews, openTickets] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: PAID } } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $in: PAID } } },
      { $group: { _id: { book: "$item.title", edition: "$item.edition" }, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: PAID }, paidAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "Asia/Kolkata" } },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.estimatedDocumentCount(),
    Review.countDocuments({ approved: false }),
    Ticket.countDocuments({ status: "open" }),
  ]);
  res.json({
    revenue: totals[0]?.revenue ?? 0,
    paidOrders: totals[0]?.orders ?? 0,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byItem: byItem.map((i) => ({ book: i._id.book, edition: i._id.edition, orders: i.orders, revenue: i.revenue })),
    daily: daily.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
    readers,
    pendingReviews,
    openTickets,
  });
});

// ----------------------------------------------------------------- orders ---

/** Orders, newest first. ?status=paid  ?q=EZH-1001 | email | phone | name */
adminRouter.get("/orders", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = String(req.query.status);
  const q = String(req.query.q ?? "").trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ code: rx }, { "customer.email": rx }, { "customer.phone": rx }, { "customer.name": rx }];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300).lean();
  res.json({ orders });
});

adminRouter.get("/orders/:code", async (req, res) => {
  const order = await Order.findOne({ code: String(req.params.code).toUpperCase() }).lean();
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json({ order });
});

/** Live payment attempts from Cashfree for one order (method, status, amount, time). */
adminRouter.get("/orders/:code/payments", async (req, res) => {
  const code = String(req.params.code).toUpperCase();
  if (!(await Order.exists({ code }))) return res.status(404).json({ error: "Order not found." });
  try {
    const [cfOrder, payments] = await Promise.all([getOrder(code), getPayments(code)]);
    res.json({ orderStatus: cfOrder.order_status, payments });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

/** Re-check a pending order with Cashfree (in case a webhook was missed). */
adminRouter.post("/orders/:code/sync", async (req, res) => {
  const order = (await Order.findOne({ code: String(req.params.code).toUpperCase() })) as OrderDoc | null;
  if (!order) return res.status(404).json({ error: "Order not found." });
  try {
    res.json({ order: await syncFromCashfree(order) });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

/** Move an order along, e.g. paid → shipped (with the courier tracking number as the note). */
adminRouter.patch("/orders/:code", async (req, res) => {
  const body = z
    .object({ status: z.enum(ORDER_STATUSES), note: z.string().trim().max(500).optional(), notify: z.boolean().default(true) })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0]?.message });

  const order = (await Order.findOneAndUpdate(
    { code: String(req.params.code).toUpperCase() },
    { $set: { status: body.data.status }, $push: { events: { status: body.data.status, note: body.data.note } } },
    { new: true },
  )) as OrderDoc | null;
  if (!order) return res.status(404).json({ error: "Order not found." });

  if (body.data.notify) await sendStatusUpdate(order, body.data.note).catch((err) => console.error("Status email failed:", err));
  res.json({ order });
});

// --------------------------------------------------------------- payments ---

/** Money in: paid/shipped/delivered/refunded orders with their Cashfree payment details. */
adminRouter.get("/payments", async (_req, res) => {
  const orders = await Order.find()
    .where("status")
    .in([...PAID, "refunded"])
    .select({ code: 1, status: 1, amount: 1, currency: 1, paidAt: 1, cashfree: 1, "customer.name": 1, "customer.email": 1, item: 1 })
    .sort({ paidAt: -1 })
    .limit(500)
    .lean();
  res.json({ payments: orders });
});

// ------------------------------------------------------------------ books ---

const editionSchema = z.object({
  id: z.enum(["hardcopy", "ebook"]),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).optional(),
  price: z.number().min(0).max(100000),
  needsAddress: z.boolean(),
});

const bookFields = {
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000),
  year: z.string().trim().max(10),
  status: z.enum(BOOK_STATUSES),
  releaseAt: z.coerce.date().nullable(),
  displayPrice: z.object({ amount: z.number().min(0).nullable(), note: z.string().trim().max(60) }).nullable(),
  cover: z.string().trim().max(300),
  publisher: z.object({ name: z.string().trim().max(100), logo: z.string().trim().max(300), url: z.string().trim().max(300) }).nullable(),
  buyUrl: z.string().trim().max(1000),
  buyLabel: z.string().trim().max(60),
  preview: z.array(z.string().trim().max(300)).max(60),
  highlights: z.array(z.string().trim().max(80)).max(12),
  availability: z.string().trim().max(200),
  details: z.array(z.object({ label: z.string().trim().max(60), value: z.string().trim().max(300) })).max(20),
  editions: z.array(editionSchema).max(2),
  preorderOpen: z.boolean(),
  sortOrder: z.number().int(),
};

/** Every book, including hidden ones, with all editable fields. */
adminRouter.get("/books", async (_req, res) => {
  const books = (await Book.find().sort({ sortOrder: 1, createdAt: 1 }).lean()) as unknown as BookRecord[];
  res.json({ books: books.map((b) => ({ ...publicBook(b), sortOrder: b.sortOrder ?? 0, displayPrice: b.displayPrice ?? null, updatedAt: b.updatedAt })) });
});

/** Add a book (usually an upcoming one). The slug is its URL: /books/<slug>. */
adminRouter.post("/books", async (req, res) => {
  const body = z
    .object({ slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, e.g. kadal-kavithai"), ...bookFields })
    .partial({ description: true, year: true, releaseAt: true, displayPrice: true, cover: true, publisher: true, buyUrl: true, buyLabel: true, preview: true, highlights: true, availability: true, details: true, editions: true, preorderOpen: true, sortOrder: true })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid book." });
  if (await Book.exists({ slug: body.data.slug })) return res.status(409).json({ error: "A book with that slug already exists." });

  const book = new Book(withMallikai(body.data as Partial<BookRecord>) as Record<string, unknown>);
  await book.save();
  await revalidateWebsite();
  res.status(201).json({ book: publicBook(book.toObject() as unknown as BookRecord) });
});

/** Edit any content field. The slug can't change (it's the book's URL and order history key). */
adminRouter.patch("/books/:slug", async (req, res) => {
  const body = z.object(bookFields).partial().strict().safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid change." });
  const data = body.data;

  if (data.preorderOpen && data.editions === undefined) {
    const current = await Book.findOne({ slug: String(req.params.slug) }, { editions: 1 }).lean();
    if (!current?.editions?.some((e) => (e.price ?? 0) > 0)) {
      return res.status(400).json({ error: "Add at least one edition with a price before opening pre-orders." });
    }
  }
  if (data.preorderOpen && data.editions && !data.editions.some((e) => e.price > 0)) {
    return res.status(400).json({ error: "Add at least one edition with a price before opening pre-orders." });
  }

  const book = await Book.findOneAndUpdate({ slug: String(req.params.slug) }, { $set: withMallikai(data as Partial<BookRecord>) }, { new: true, runValidators: true }).lean();
  if (!book) return res.status(404).json({ error: "Book not found." });
  await revalidateWebsite();
  res.json({ book: publicBook(book as unknown as BookRecord) });
});

// ---------------------------------------------------------------- reviews ---

adminRouter.get("/reviews", async (req, res) => {
  const approved = req.query.approved === undefined ? false : req.query.approved === "true";
  const reviews = await Review.find({ approved })
    .sort({ updatedAt: -1 })
    .limit(300)
    .populate<{ user: { email: string } | null }>("user", "email")
    .lean();
  res.json({ reviews });
});

adminRouter.patch("/reviews/:id", async (req, res) => {
  const body = z.object({ approved: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Send { approved: true|false }." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Review not found." });
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { approved: body.data.approved } }, { new: true });
  if (!review) return res.status(404).json({ error: "Review not found." });
  res.json({ review });
});

adminRouter.delete("/reviews/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Review not found." });
  await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------- support ---

/** Tickets, newest activity first. ?status=open */
adminRouter.get("/support", async (req, res) => {
  const query = Ticket.find();
  if (req.query.status) query.where("status").equals(String(req.query.status));
  res.json({ tickets: await query.sort({ updatedAt: -1 }).limit(300).lean() });
});

adminRouter.get("/support/:code", async (req, res) => {
  const ticket = await Ticket.findOne({ code: String(req.params.code).toUpperCase() }).lean();
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  res.json({ ticket });
});

/** Reply by email; the ticket becomes "answered" (or stays closed if you close it in the same go). */
adminRouter.post("/support/:code/reply", async (req, res) => {
  const body = z.object({ text: z.string().trim().min(1).max(8000), close: z.boolean().default(false) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Write a reply first." });
  const ticket = await Ticket.findOne({ code: String(req.params.code).toUpperCase() });
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });

  try {
    await sendTicketReply(ticket, body.data.text);
  } catch (err) {
    return res.status(502).json({ error: `Couldn't send the email: ${(err as Error).message}` });
  }
  ticket.messages.push({ from: "admin", text: body.data.text });
  ticket.status = body.data.close ? "closed" : "answered";
  await ticket.save();
  res.json({ ticket });
});

adminRouter.patch("/support/:code", async (req, res) => {
  const body = z.object({ status: z.enum(TICKET_STATUSES) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid status." });
  const ticket = await Ticket.findOneAndUpdate({ code: String(req.params.code).toUpperCase() }, { $set: { status: body.data.status } }, { new: true });
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  res.json({ ticket });
});
