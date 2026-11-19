import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <div className={`relative isolate flex w-full flex-1 justify-center px-6 pb-16 ${TOP_NOISE_OFFSET}`}>
        <PageNoise variant="top" />
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
