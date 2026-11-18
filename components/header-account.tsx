"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/session";
import { UserAvatar } from "@/components/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Header account slot: Login when signed out; avatar + first name (avatar only on phones) linking to the profile. */
export function HeaderAccount() {
  const { user } = useSession();

  // Still checking the session: hold the space so the header doesn't jump.
  if (user === undefined) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-muted sm:w-24 sm:rounded-md" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants({ size: "lg" })}>
        Login
      </Link>
    );
  }

  const firstName = user.name.split(" ")[0];
  return (
    <Link
      href="/profile"
      aria-label={`Your profile (signed in as ${user.name})`}
      title={user.email}
      className={cn(
        buttonVariants({ variant: "ghost", size: "lg" }),
        "h-10 gap-2 rounded-full px-1 sm:pr-3",
      )}
    >
      <UserAvatar seed={user.avatarSeed} className="size-8" />
      <span className="max-w-32 truncate max-sm:hidden">{firstName}</span>
    </Link>
  );
}
