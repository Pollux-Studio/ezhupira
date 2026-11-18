"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/auth/session";
import { Button } from "@/components/ui/button";
import { api, type User } from "@/lib/api";

type FirebaseModule = typeof import("@/lib/firebase");

/** Google's "G" mark, per Google's sign-in branding guidelines. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Popup errors that just mean the person closed or re-clicked; not worth showing. */
const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

export function GoogleSignIn({ onSignedIn }: { onSignedIn?: (user: User) => void }) {
  const { setUser } = useSession();
  const firebase = useRef<FirebaseModule | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Firebase ahead of the click, so the popup opens straight from the tap
  // (browsers block popups opened after a slow async step).
  useEffect(() => {
    import("@/lib/firebase").then((m) => {
      firebase.current = m;
      setLoaded(true);
    });
  }, []);

  async function signIn() {
    if (!firebase.current) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await firebase.current.googleIdToken();
      const { user } = await api<{ user: User }>("/auth/firebase", { body: { idToken } });
      setUser(user);
      onSignedIn?.(user);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code && SILENT.has(code)) return;
      setError(
        code === "auth/popup-blocked"
          ? "Your browser blocked the sign-in window. Allow popups for this site and try again."
          : code === "auth/unauthorized-domain"
            ? "Sign-in isn't enabled for this website address yet."
            : (err as Error).message || "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" size="lg" className="h-11 w-full gap-3" onClick={signIn} disabled={!loaded || busy}>
        <GoogleMark />
        {busy ? "Signing you in…" : "Continue with Google"}
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
