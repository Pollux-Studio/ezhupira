// The reader's address book: /me/addresses. Checkout also adds to it (lib/addresses.ts).
import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../lib/auth.js";
import { MAX_ADDRESSES, listAddresses, savedAddressInput } from "../lib/addresses.js";
import { User } from "../models.js";

export const addressesRouter = Router();
addressesRouter.use(requireAuth);

const invalid = (issues: { message: string }[]) => ({ error: issues[0]?.message ?? "Check the address." });
const validId = (id: string) => mongoose.isValidObjectId(id);

addressesRouter.get("/", async (req, res) => {
  res.json({ addresses: await listAddresses(req.session!.userId) });
});

/** Add an address. The first one becomes the default; `isDefault: true` makes any one the default. */
addressesRouter.post("/", async (req, res) => {
  const body = savedAddressInput.safeParse(req.body);
  if (!body.success) return res.status(400).json(invalid(body.error.issues));
  const user = await User.findById(req.session!.userId, { addresses: 1 });
  if (!user) return res.status(401).json({ error: "Please sign in." });
  if (user.addresses.length >= MAX_ADDRESSES) {
    return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.` });
  }
  const makeDefault = req.body?.isDefault === true || !user.addresses.some((a) => a.isDefault);
  if (makeDefault) user.addresses.forEach((a) => a.set({ isDefault: false }));
  user.addresses.push({ ...body.data, isDefault: makeDefault });
  await user.save();
  res.status(201).json({ addresses: await listAddresses(user.id) });
});

addressesRouter.put("/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = savedAddressInput.safeParse(req.body);
  if (!body.success) return res.status(400).json(invalid(body.error.issues));
  if (!validId(id)) return res.status(404).json({ error: "Address not found." });
  const user = await User.findById(req.session!.userId, { addresses: 1 });
  const address = user?.addresses.id(id);
  if (!user || !address) return res.status(404).json({ error: "Address not found." });
  address.set({ ...body.data, line2: body.data.line2 || undefined });
  await user.save();
  res.json({ addresses: await listAddresses(user.id) });
});

addressesRouter.post("/:id/default", async (req, res) => {
  const id = String(req.params.id);
  if (!validId(id)) return res.status(404).json({ error: "Address not found." });
  const user = await User.findById(req.session!.userId, { addresses: 1 });
  if (!user?.addresses.id(id)) return res.status(404).json({ error: "Address not found." });
  user.addresses.forEach((a) => a.set({ isDefault: a._id.toString() === id }));
  await user.save();
  res.json({ addresses: await listAddresses(user.id) });
});

/** Delete one. If it was the default, the newest remaining address takes over. */
addressesRouter.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!validId(id)) return res.status(404).json({ error: "Address not found." });
  const user = await User.findById(req.session!.userId, { addresses: 1 });
  const address = user?.addresses.id(id);
  if (!user || !address) return res.status(404).json({ error: "Address not found." });
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[user.addresses.length - 1].set({ isDefault: true });
  await user.save();
  res.json({ addresses: await listAddresses(user.id) });
});
