import Link from "next/link";
import { Feather, PackageSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Site footer: copyright on the left, About the author and Track order links on the right. */
export function SiteFooter({ className }: { className?: string }) {
  const link = cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-muted-foreground hover:text-foreground");

  return (
    <footer className={cn("mx-auto w-full max-w-5xl px-4", className)}>
      <Separator />
      <div className="flex flex-col-reverse items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Ezhupira Prasanth</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-1">
          <Link href="/author" className={link}>
            <Feather aria-hidden />
            About the author
          </Link>
          <Link href="/track-order" className={link}>
            <PackageSearch aria-hidden />
            Track order
          </Link>
        </nav>
      </div>
    </footer>
  );
}
