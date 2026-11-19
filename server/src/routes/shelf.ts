// The reader's bookshelf: which books they've marked as read.
import { Router } from "express";
import { z } from "zod";
import { isKnownBook } from "../lib/books.js";
import { requireAuth } from "../lib/auth.js";
import { User } from "../models.js";

export const shelfRouter = Router();
shelfRouter.use(requireAuth);

type ReadBook = { bookSlug: string; readAt: Date };

async function readList(userId: string) {
  const user = await User.findById(userId, { readBooks: 1 }).lean();
  return (user?.readBooks ?? []) as ReadBook[];
}

shelfRouter.get("/", async (req, res) => {
  res.json({ read: await readList(req.session!.userId) });
});

/** Mark a book read ({ read: true }) or unread ({ read: false }). Returns the updated list. */
shelfRouter.put("/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const body = z.object({ read: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Send { read: true | false }." });
  if (!(await isKnownBook(slug))) return res.status(404).json({ error: "Unknown book." });

  const userId = req.session!.userId;
  if (body.data.read) {
    // Only adds it if it isn't there yet, so marking twice keeps the original date.
    await User.updateOne(
      { _id: userId, "readBooks.bookSlug": { $ne: slug } },
      { $push: { readBooks: { bookSlug: slug, readAt: new Date() } } },
    );
  } else {
    await User.updateOne({ _id: userId }, { $pull: { readBooks: { bookSlug: slug } } });
  }
  res.json({ read: await readList(userId) });
});
