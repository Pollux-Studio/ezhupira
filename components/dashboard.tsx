"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/auth/session";
import { PreorderForm } from "@/components/preorder-form";
import { Button } from "@/components/ui/button";

function DashboardContent({ releaseLabel }: { releaseLabel: string }) {
  const router = useRouter();
  const { user, signOut } = useSession();

  useEffect(() => {
    if (user === null) router.replace("/login?next=/dashboard");
  }, [user, router]);

  if (!user) return <div className="h-96 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Hi, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Next release: {releaseLabel}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut().then(() => router.replace("/"))}>
          Sign out
        </Button>
      </div>
      <PreorderForm user={user} />
      <p className="text-center text-sm text-muted-foreground">
        Your orders, purchased books and bookshelf are on{" "}
        <Link href="/profile" className="font-medium text-foreground underline">
          your profile
        </Link>
        .
      </p>
    </>
  );
}

export function Dashboard({ releaseLabel }: { releaseLabel: string }) {
  return (
    <DashboardContent releaseLabel={releaseLabel} />
  );
}
