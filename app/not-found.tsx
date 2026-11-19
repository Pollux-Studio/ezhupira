import Link from "next/link";
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <div className="relative isolate flex flex-1 flex-col">
        <PageNoise variant="top" />
        <main className={`mx-auto w-full max-w-md flex-1 px-4 pb-16 ${TOP_NOISE_OFFSET}`}>
          <div className="space-y-4 border bg-background p-6 text-center">
            <p className="font-stamp text-5xl tracking-widest text-primary">404</p>
            <h1 className="text-xl font-semibold">This page isn&apos;t here</h1>
            <p className="text-sm text-muted-foreground">The link may be old, or the page may have moved.</p>
            <Link href="/" className={buttonVariants()}>
              Back to the home page
            </Link>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
