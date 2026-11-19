"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, type ComponentProps } from "react"
import { cn } from "cn"

import { GoogleSignIn } from "@/components/auth/google-sign-in"
import { useSession } from "@/components/auth/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldDescription } from "@/components/ui/field"

/** Where to go after signing in: ?next=/some/path (same-site paths only), else your profile. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next")
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile"
}

function LoginCard() {
  const router = useRouter()
  const { user } = useSession()
  const goNext = useCallback(() => router.replace(nextPath()), [router])

  // Already signed in: skip the login screen.
  useEffect(() => {
    if (user) goNext()
  }, [user, goNext])

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Sign in to Ezhupira</CardTitle>
        <CardDescription>Use your Google account for your bookshelf, reviews, pre-orders and orders.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {user === undefined ? (
          <div className="h-11 animate-pulse rounded-md bg-muted" aria-label="Loading" />
        ) : (
          <GoogleSignIn onSignedIn={goNext} />
        )}
        <FieldDescription className="text-center">
          New here? Signing in creates your account. We only use your name and email for your orders.
        </FieldDescription>
      </CardContent>
    </Card>
  )
}

export function LoginForm({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <LoginCard />
    </div>
  )
}
