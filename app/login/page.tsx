import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex w-full flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
