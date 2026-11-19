"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CreditCard, LayoutDashboard, LifeBuoy, LogOut, MessageSquareText, Package } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SideNoise } from "@/components/side-noise";
import { Button, cx } from "@/components/ui";
import { api, ApiError, type User } from "@/lib/api";

const AdminContext = createContext<User | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

const NAV = [
  { href: "/", label: "Overview", Icon: LayoutDashboard },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/payments", label: "Payments", Icon: CreditCard },
  { href: "/books", label: "Books", Icon: BookOpen },
  { href: "/reviews", label: "Reviews", Icon: MessageSquareText },
  { href: "/support", label: "Support", Icon: LifeBuoy },
];

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen justify-center px-6 pt-28 pb-16 sm:pt-36">
      <SideNoise className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 sm:h-48" />
      <div className="h-fit w-full max-w-sm space-y-5 rounded-lg border border-line bg-surface p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded bg-brand font-mallikai text-lg text-brand-ink">vOgpu</div>
        {children}
      </div>
    </main>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const { googleIdToken } = await import("@/lib/firebase");
      const idToken = await googleIdToken();
      const { user } = await api<{ user: User }>("/auth/firebase", { body: { idToken } });
      onSignedIn(user);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <div>
        <h1 className="text-lg font-semibold">Ezhupira admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in with an admin Google account.</p>
      </div>
      <Button onClick={signIn} disabled={busy} className="w-full">
        {busy ? "Signing in…" : "Continue with Google"}
      </Button>
      {error && <p className="text-sm text-brand">{error}</p>}
    </Centered>
  );
}

/**
 * Everything in the admin sits behind this: signed out → Google sign-in; signed in without
 * the admin role → refused; admin → the app with its sidebar. (The API enforces the same.)
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api<{ user: User }>("/auth/me").then(
      (r) => setUser(r.user),
      (err) => {
        if (!(err instanceof ApiError) || err.status !== 401) console.warn(err);
        setUser(null);
      },
    );
  }, []);

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  if (user === undefined) return <Centered><p className="text-sm text-muted">Loading…</p></Centered>;
  if (user === null) return <SignIn onSignedIn={setUser} />;
  if (user.role !== "admin") {
    return (
      <Centered>
        <div>
          <h1 className="text-lg font-semibold">Not an admin account</h1>
          <p className="mt-1 text-sm text-muted">
            {user.email} doesn&apos;t have admin access. Add it to ADMIN_EMAILS on the API, then sign in again.
          </p>
        </div>
        <Button variant="outline" onClick={signOut} className="w-full">
          Use another account
        </Button>
      </Centered>
    );
  }

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <AdminContext.Provider value={user}>
      <div className="md:grid md:min-h-screen md:grid-cols-[16rem_1fr]">
        {/* The site's red noise down the left (a band behind the top bar on phones), with the
            sidebar as a card on it: the same rule as the public site's left-column pages. */}
        <aside className="relative isolate md:sticky md:top-0 md:h-screen">
          <SideNoise className="pointer-events-none absolute inset-0 -z-10" />
          <div className="p-3 md:flex md:h-full md:flex-col md:p-4">
            <div className="rounded-lg border border-line bg-surface md:flex md:flex-1 md:flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 md:py-4">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded bg-brand font-mallikai text-xs leading-none text-brand-ink">vOgpu</span>
                  <span className="font-semibold">Admin</span>
                </Link>
                <Button variant="ghost" onClick={signOut} className="md:hidden" aria-label="Sign out">
                  <LogOut />
                </Button>
              </div>
              <nav aria-label="Admin" className="flex gap-1 overflow-x-auto p-2 md:flex-col">
                {NAV.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active(href) ? "page" : undefined}
                    className={cx(
                      "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                      active(href) ? "bg-brand text-brand-ink" : "text-muted hover:bg-bg hover:text-ink",
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto hidden space-y-2 border-t border-line p-4 md:block">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <Button variant="outline" onClick={signOut} className="w-full">
                  <LogOut aria-hidden />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}
