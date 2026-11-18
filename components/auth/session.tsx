"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type User } from "@/lib/api";

type SessionState = {
  /** undefined while loading, null when signed out. */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const refresh = useCallback(
    () =>
      api<{ user: User }>("/auth/me").then(
        (r) => setUser(r.user),
        (err) => {
          // 401 = signed out. A network error also shows as signed out rather than hanging.
          if (!(err instanceof ApiError) || err.status !== 401) console.warn(err);
          setUser(null);
        },
      ),
    [],
  );

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    api<{ user: User }>("/auth/me").then(
      (r) => active && setUser(r.user),
      () => active && setUser(null),
    );
    return () => {
      active = false;
    };
  }, []);

  return <SessionContext.Provider value={{ user, setUser, refresh, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
