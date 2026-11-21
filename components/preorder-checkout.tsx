"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/auth/session";
import { PreorderForm } from "@/components/preorder-form";

/**
 * Checkout for one book: asks you to sign in first, then shows that book's form. `released`
 * books are bought outright; upcoming ones are pre-ordered.
 */
export function PreorderCheckout({ bookSlug, released = false }: { bookSlug: string; released?: boolean }) {
  const router = useRouter();
  const { user } = useSession();
  const here = `/books/${bookSlug}/preorder`;

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [user, router, here]);

  if (!user) return <div className="h-96 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;
  return <PreorderForm user={user} bookSlug={bookSlug} released={released} />;
}
