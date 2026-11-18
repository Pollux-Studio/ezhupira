// Google sign-in (through Firebase Auth) and session cookies.
// Flow: the website signs in with Firebase's Google popup, gets a Firebase ID token, POSTs it
// to /auth/firebase, and this server verifies it against Google's public keys, upserts the
// user and sets an httpOnly session cookie. The browser never sees the session token.
import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { adminEmails, env, isProd } from "../env.js";
import { User, type UserDoc } from "../models.js";

// Firebase ID tokens are signed by these keys; jose caches them and refetches on rotation.
const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
const secret = new TextEncoder().encode(env.SESSION_SECRET);

export const SESSION_COOKIE = "ezh_session";
const SESSION_DAYS = 30;

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  // Lax: sent on same-site requests (ezhupira.in → api.ezhupira.in) and top-level
  // navigations, never on cross-site POSTs, which blocks CSRF.
  sameSite: "lax" as const,
  domain: env.COOKIE_DOMAIN || undefined,
  path: "/",
};

export type Session = { userId: string; role: "reader" | "admin" };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: Session;
    }
  }
}

/** Verifies a Firebase ID token and returns the matching user, creating them on first sign-in. */
export async function signInWithFirebase(idToken: string) {
  const { payload: p } = await jwtVerify(idToken, firebaseKeys, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });
  const email = typeof p.email === "string" ? p.email.toLowerCase() : "";
  const provider = (p.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
  if (!p.sub || !email || p.email_verified !== true) throw new Error("Account has no verified email");
  if (provider !== "google.com") throw new Error(`Unsupported sign-in provider: ${provider}`);

  const user = (await User.findOneAndUpdate(
    { firebaseUid: p.sub },
    {
      $set: {
        email,
        name: (typeof p.name === "string" && p.name) || email.split("@")[0],
        picture: typeof p.picture === "string" ? p.picture : undefined,
        lastLoginAt: new Date(),
        ...(adminEmails.has(email) && { role: "admin" }),
      },
      // New account: pick its avatar seed once. Later sign-ins never change it.
      $setOnInsert: { avatarSeed: newAvatarSeed() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )) as UserDoc;

  return ensureAvatarSeed(user);
}

function newAvatarSeed() {
  return randomBytes(12).toString("base64url");
}

/**
 * Accounts created before avatar seeds existed get one the first time they log in afterwards,
 * whether by Google sign-in or by an existing session being restored (/auth/me). It's
 * written only if still missing, so it happens once and is never changed later.
 */
export async function ensureAvatarSeed<T extends { _id: unknown; avatarSeed?: string | null }>(user: T): Promise<T> {
  if (user.avatarSeed) return user;
  const saved = await User.findOneAndUpdate(
    { _id: user._id, avatarSeed: { $exists: false } },
    { $set: { avatarSeed: newAvatarSeed() } },
    { new: true, projection: { avatarSeed: 1 } },
  ).lean();
  // If another request saved one first, read that one back so everyone agrees.
  const seed = saved?.avatarSeed ?? (await User.findById(user._id, { avatarSeed: 1 }).lean())?.avatarSeed;
  return Object.assign(user, { avatarSeed: seed });
}

export async function setSessionCookie(res: Response, user: UserDoc) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

/** Reads the session cookie, if any, onto req.session. */
export async function readSession(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      if (payload.sub) req.session = { userId: payload.sub, role: payload.role === "admin" ? "admin" : "reader" };
    } catch {
      // Expired or tampered: treat as signed out.
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session) return res.status(401).json({ error: "Please sign in." });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.role !== "admin") return res.status(403).json({ error: "Admins only." });
  next();
}
