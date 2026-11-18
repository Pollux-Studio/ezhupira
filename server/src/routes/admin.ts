// Admin endpoints (users listed in ADMIN_EMAILS): fulfil orders and moderate reviews.
import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import { sendStatusUpdate } from "../lib/mail.js";
import { ORDER_STATUSES, Order, Review, type OrderDoc } from "../models.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/orders", async (req, res) => {
  const query = Order.find();
  if (req.query.status) query.where("status").equals(String(req.query.status));
  const orders = await query.sort({ createdAt: -1 }).limit(200).lean();
  res.json({ orders });
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

adminRouter.get("/reviews", async (req, res) => {
  const approved = req.query.approved === undefined ? false : req.query.approved === "true";
  res.json({ reviews: await Review.find({ approved }).sort({ createdAt: -1 }).limit(200).lean() });
});

adminRouter.patch("/reviews/:id", async (req, res) => {
  const body = z.object({ approved: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Send { approved: true|false }." });
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { approved: body.data.approved } }, { new: true });
  if (!review) return res.status(404).json({ error: "Review not found." });
  res.json({ review });
});

adminRouter.delete("/reviews/:id", async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
