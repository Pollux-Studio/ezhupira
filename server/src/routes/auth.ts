import { Router } from "express";
import { z } from "zod";
import { clearSessionCookie, ensureAvatarSeed, requireAuth, setSessionCookie, signInWithFirebase } from "../lib/auth.js";
import { User } from "../models.js";

export const authRouter = Router();

const publicUser = (u: {
  _id: unknown;
  name: string;
  email: string;
  picture?: string | null;
  avatarSeed?: string | null;
  role: string;
  createdAt?: Date | null;
}) => ({
  id: String(u._id),
  avatarSeed: u.avatarSeed ?? String(u._id),
  memberSince: u.createdAt ?? null,
  name: u.name,
  email: u.email,
  picture: u.picture ?? null,
  role: u.role,
});

authRouter.post("/firebase", async (req, res) => {
  const body = z.object({ idToken: z.string().min(10) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Missing sign-in token." });
  try {
    const user = await signInWithFirebase(body.data.idToken);
    await setSessionCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.warn("Google sign-in rejected:", (err as Error).message);
    res.status(401).json({ error: "Google sign-in failed. Please try again." });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.session!.userId).lean();
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ error: "Please sign in." });
  }
  res.json({ user: publicUser(await ensureAvatarSeed(user)) });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});
