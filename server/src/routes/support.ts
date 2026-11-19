// Public contact form: anyone can open a support ticket; replies go out by email.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendTicketReceived } from "../lib/mail.js";
import { nextTicketCode, Ticket, User } from "../models.js";

export const supportRouter = Router();

const limit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email.").max(200),
  topic: z.enum(["order", "payment", "book", "account", "other"]).default("other"),
  orderCode: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(3, "Please add a subject.").max(200),
  message: z.string().trim().min(10, "Please describe the problem in a sentence or two.").max(8000),
  /** Honeypot: real people never fill this hidden field. */
  website: z.string().max(0).optional(),
});

supportRouter.post("/support", limit, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid message." });
  const { name, email, topic, orderCode, subject, message } = parsed.data;

  const user = req.session ? await User.findById(req.session.userId, { _id: 1 }).lean() : null;
  const ticket = await Ticket.create({
    code: await nextTicketCode(),
    user: user?._id,
    name,
    email,
    topic,
    orderCode: orderCode ? orderCode.toUpperCase() : undefined,
    subject,
    messages: [{ from: "reader", text: message }],
  });

  sendTicketReceived(ticket).catch((err) => console.error(`Support email for ${ticket.code} failed:`, err));
  res.status(201).json({ code: ticket.code });
});
