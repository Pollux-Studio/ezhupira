import Image from "next/image";
import Link from "next/link";
import { HandThemeToggle } from "@/components/hand-toggle";
import { LanguageSwitch } from "@/components/language-switch";
import { HeaderAccount } from "@/components/header-account";

/**
 * Sticky full-width header: logo pinned left; account (Login, or avatar + name), language and
 * theme switches pinned right.
 * (About the author and Track order live in the footer.)
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/ezhupira-logo-dark-2.svg" alt="Ezhupira" width={40} height={40} />
          {/* Mallikai is a legacy font: "vOgpu" draws எழுபிர. The sr-only text gives the real Tamil to screen readers and search. */}
          {/* On small phones the logo alone carries the name, leaving room for the menu. */}
          <span className="font-mallikai text-2xl leading-none max-sm:hidden" aria-hidden>
            vOgpu
          </span>
          <span className="sr-only">எழுபிர</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <HeaderAccount />
          <LanguageSwitch />
          <HandThemeToggle />
        </nav>
      </div>
    </header>
  );
}
