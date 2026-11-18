import type { Metadata } from "next";
import Image from "next/image";
import { AnimatedSignature } from "@/components/animated-signature";
import { AuthorBio } from "@/components/author-bio";
import { LocalizedText } from "@/components/localized-text";
import { MallikaiText } from "@/components/book/book-parts";
import { HeroBackground } from "@/components/hero-background";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { AUTHOR, SITE_URL, breadcrumbLd } from "@/lib/site";
import { InstagramIcon } from "@/components/ui/svgs/instagramIcon";
import { Spotify } from "@/components/ui/svgs/spotify";

export const metadata: Metadata = {
  title: `${AUTHOR.name} (${AUTHOR.nameTa}) · Tamil poet & author`,
  description: `About ${AUTHOR.name} (${AUTHOR.nameTa}), the Tamil poet and author behind Ezhupira and the poetry collection நான் யார்? (Naan Yaar?). ${AUTHOR.description}`,
  alternates: { canonical: "/author" },
  openGraph: { type: "profile", url: "/author", firstName: "Prasanth", username: "rj_prasanthu" },
};

const SOCIALS = [
  { href: "https://www.instagram.com/rj_prasanthu/", label: "Instagram (@rj_prasanthu)", Icon: InstagramIcon },
  { href: "https://open.spotify.com/show/7mE3wdeVBEabTRoYfUMWix", label: "Podcast on Spotify", Icon: Spotify },
];

export default function AuthorPage() {
  return (
    <>
      <JsonLd
        data={[
          { "@type": "ProfilePage", url: AUTHOR.url, mainEntity: { "@id": `${SITE_URL}/author#person` } },
          breadcrumbLd([
            { name: "Ezhupira", path: "/" },
            { name: AUTHOR.name, path: "/author" },
          ]),
        ]}
      />
      <SiteHeader />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10">
        {/* A short banner of the home page's red noise, right under the header */}
        <div aria-hidden className="relative isolate h-36 sm:h-48">
          <HeroBackground />
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
          {/* Left: the photo (a cut-out) in a red box, rising out of the banner. items-start
              keeps the box from being stretched to the row's height (which distorted the
              photo); the image keeps its own 1164 × 1260 proportions. */}
          <div className="-mt-28 flex items-start justify-center sm:-mt-36 md:justify-start">
            {/* relative z-10: sit in front of the banner's noise */}
            <div className="relative z-10 w-64 bg-primary px-4 pt-6 shadow-xl ring-4 ring-background sm:w-72 md:w-full md:max-w-sm">
              <Image
                src="/author-profile.png"
                alt="Prasanth"
                width={1164}
                height={1260}
                priority
                sizes="(min-width: 768px) 384px, 288px"
                className="block aspect-[1164/1260] h-auto w-full"
              />
            </div>
          </div>

          {/* Right: in his own words, signed off by hand */}
          <section className="space-y-6 md:pt-8">
            <header className="space-y-2">
              <p className="text-sm font-medium text-primary">
                <LocalizedText ta="ஆசிரியர்" en="Author" />
              </p>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h1 className="text-4xl leading-tight sm:text-5xl">
                  <MallikaiText unicode="பிரசாந்த்.ஜெ" mallikai="gpurhe;j;.n[" />
                </h1>
                {/* Social links, at the end of the name row */}
                <ul aria-label="Social media" className="flex items-center gap-2">
                  {SOCIALS.map(({ href, label, Icon }) => (
                    <li key={href}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="grid size-10 place-items-center rounded-full transition hover:scale-110 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <Icon aria-hidden className="size-7" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </header>

            <AuthorBio />

            <div className="space-y-3 pt-2">
              <p className="text-2xl">
                <MallikaiText unicode="தொடர்ந்து பயணிப்போம்," mallikai="njhlu;e;J gazpg;Nghk;>" />
              </p>
              {/* Signs again and again (waits until it's on screen) */}
              <AnimatedSignature className="w-32 text-primary sm:w-36" inView delay={0.2} loop holdSeconds={3} />
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
