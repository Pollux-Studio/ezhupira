import { Router } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import { isKnownBook } from "../lib/books.js";
import { requireAuth } from "../lib/auth.js";
import { Review, User } from "../models.js";

export const reviewsRouter = Router();

const writeLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

type ReviewRow = {
  _id: unknown;
  bookSlug: string;
  name: string;
  rating: number;
  text: string;
  approved?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/** What the writer sees about their own review, including whether it's live yet. */
const ownView = (r: ReviewRow) => ({
  id: String(r._id),
  bookSlug: r.bookSlug,
  name: r.name,
  rating: r.rating,
  text: r.text,
  status: r.approved ? ("published" as const) : ("pending" as const),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

/** Approved reviews for a book, newest first, with the average rating and each writer's avatar seed. */
reviewsRouter.get("/reviews", async (req, res) => {
  const book = String(req.query.book ?? "");
  if (!(await isKnownBook(book))) return res.status(404).json({ error: "Unknown book." });

  const reviews = await Review.find({ bookSlug: book, approved: true })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate<{ user: { _id: unknown; avatarSeed?: string } | null }>("user", "avatarSeed")
    .lean();
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
  res.set("Cache-Control", "public, max-age=60");
  res.json({
    count,
    average,
    reviews: reviews.map((r) => ({
      id: String(r._id),
      name: r.name,
      avatarSeed: r.user?.avatarSeed ?? (r.user ? String(r.user._id) : String(r._id)),
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
    })),
  });
});

/** Every review you've written, newest first, with its approval status. */
reviewsRouter.get("/me/reviews", requireAuth, async (req, res) => {
  const reviews = await Review.find({ user: req.session!.userId }).sort({ updatedAt: -1 }).lean();
  res.json({ reviews: reviews.map(ownView) });
});

const writeSchema = z.object({
  bookSlug: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10, "Please write at least a sentence.").max(4000),
});

/**
 * Write or update your review of a book (one per reader per book). It's posted under your
 * account name, never a typed one, and goes back to "pending" after every edit until approved.
 */
reviewsRouter.post("/reviews", requireAuth, writeLimit, async (req, res) => {
  const parsed = writeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid review." });
  if (!(await isKnownBook(parsed.data.bookSlug))) return res.status(404).json({ error: "Unknown book." });

  const user = await User.findById(req.session!.userId).lean();
  if (!user) return res.status(401).json({ error: "Please sign in." });

  const { bookSlug, rating, text } = parsed.data;
  const review = await Review.findOneAndUpdate(
    { bookSlug, user: user._id },
    { $set: { rating, text, name: user.name.slice(0, 80), approved: user.role === "admin" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  res.status(201).json({ review: ownView(review as ReviewRow) });
});

/** Delete one of your own reviews. */
reviewsRouter.delete("/me/reviews/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "Review not found." });
  const { deletedCount } = await Review.deleteOne({ _id: id, user: req.session!.userId });
  if (!deletedCount) return res.status(404).json({ error: "Review not found." });
  res.json({ ok: true });
});
