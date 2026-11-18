// Site-wide facts used by metadata, JSON-LD, the sitemap, robots and llms.txt.
// Keep these accurate: search engines and AI answer engines quote them verbatim.
import { books, type Book } from "@/lib/books";
import { RELEASE_LABEL } from "@/lib/release";

/** Production origin. Override with NEXT_PUBLIC_SITE_URL for preview deployments. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezhupira.in").replace(/\/$/, "");

export const SITE = {
  name: "Ezhupira",
  nameTa: "எழுபிர",
  /** Shown in the browser tab after each page title. */
  titleSuffix: "Ezhupira (எழுபிர)",
  tagline: "Tamil books & poetry by Prasanth J",
  description:
    "Ezhupira (எழுபிர) is the Tamil publishing home of author Prasanth J (பிரசாந்த்.ஜெ). Read previews, pre-order new releases and buy Tamil poetry books like நான் யார்? (Naan Yaar?).",
  descriptionTa:
    "எழுபிர - எழுத்தாளர் பிரசாந்த்.ஜெ அவர்களின் தமிழ் கவிதை மற்றும் புத்தகங்கள். முன்னோட்டம் படிக்கவும், புதிய வெளியீடுகளை முன்பதிவு செய்யவும், புத்தகங்களை வாங்கவும்.",
  locale: "ta_IN",
  keywords: [
    "Ezhupira",
    "எழுபிர",
    "ezhupira.in",
    "Prasanth J",
    "பிரசாந்த்.ஜெ",
    "Tamil books",
    "தமிழ் புத்தகங்கள்",
    "Tamil poetry",
    "தமிழ் கவிதை",
    "கவிதைத் தொகுப்பு",
    "Naan Yaar",
    "நான் யார்",
    "Tamil author",
    "Tamil publisher",
    "buy Tamil books online",
  ],
} as const;

export const AUTHOR = {
  name: "Prasanth J",
  nameTa: "பிரசாந்த்.ஜெ",
  alternateNames: ["Prasanth", "பிரசாந்த்", "RJ Prasanth"],
  url: `${SITE_URL}/author`,
  image: `${SITE_URL}/author-profile.png`,
  description:
    "Tamil poet and author. His writing translates the inner world of the mind into words, reflecting on society and the depth of human emotion.",
  sameAs: ["https://www.instagram.com/rj_prasanthu/", "https://open.spotify.com/show/7mE3wdeVBEabTRoYfUMWix"],
};

export const abs = (path: string) => `${SITE_URL}${encodeURI(path.startsWith("/") ? path : `/${path}`)}`;

/** Romanised book title for English searches, keyed by slug. */
const TITLE_LATIN: Record<string, string> = { "naan-yaar": "Naan Yaar?" };
export const bookTitleLatin = (book: Book) => TITLE_LATIN[book.slug];


// ---------------------------------------------------------------- JSON-LD ---

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const PERSON_ID = `${SITE_URL}/author#person`;

export const organizationLd = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  alternateName: [SITE.nameTa, "Ezhupira Prasanth", "ezhupira.in"],
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
  description: SITE.description,
  founder: { "@id": PERSON_ID },
  sameAs: AUTHOR.sameAs,
};

export const websiteLd = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE_URL,
  name: SITE.name,
  alternateName: SITE.nameTa,
  description: SITE.description,
  inLanguage: ["ta-IN", "en-IN"],
  publisher: { "@id": ORG_ID },
};

export const personLd = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: AUTHOR.name,
  alternateName: [AUTHOR.nameTa, ...AUTHOR.alternateNames],
  url: AUTHOR.url,
  image: AUTHOR.image,
  description: AUTHOR.description,
  jobTitle: "Author",
  knowsLanguage: ["ta", "en"],
  sameAs: AUTHOR.sameAs,
  worksFor: { "@id": ORG_ID },
};

export function bookLd(book: Book) {
  const url = abs(`/books/${book.slug}`);
  const pages = book.details?.find((d) => d.label === "Pages")?.value;
  return {
    "@type": ["Book", "Product"],
    "@id": `${url}#book`,
    name: book.title,
    alternateName: bookTitleLatin(book),
    url,
    image: book.cover ? abs(book.cover) : undefined,
    description: book.description,
    author: { "@id": PERSON_ID },
    publisher: book.publisher ? { "@type": "Organization", name: book.publisher.name, url: book.publisher.url } : { "@id": ORG_ID },
    brand: { "@id": ORG_ID },
    inLanguage: "ta",
    genre: "Poetry",
    bookFormat: "https://schema.org/Paperback",
    numberOfPages: pages ? Number(pages) : undefined,
    datePublished: book.year,
    offers:
      book.price && book.buyUrl
        ? {
            "@type": "Offer",
            url: book.buyUrl,
            price: book.price.amount,
            priceCurrency: book.price.currency,
            availability: book.status === "published" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            itemCondition: "https://schema.org/NewCondition",
            seller: book.publisher ? { "@type": "Organization", name: book.publisher.name } : { "@id": ORG_ID },
          }
        : undefined,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/** Questions answered on the home page; also emitted as FAQPage for answer engines. */
export function homeFaq() {
  const published = books.filter((b) => b.status === "published");
  const list = published.map((b) => `${b.title}${bookTitleLatin(b) ? ` (${bookTitleLatin(b)})` : ""}`).join(", ");
  return [
    {
      q: "What is Ezhupira (எழுபிர)?",
      a: `Ezhupira is the Tamil publishing website of author Prasanth J (பிரசாந்த்.ஜெ) at ezhupira.in. It is where you can read previews of his books, pre-order new releases and buy his Tamil poetry collections.`,
    },
    {
      q: "Who is Prasanth J?",
      a: `Prasanth J (பிரசாந்த்.ஜெ) is a Tamil poet and author. ${AUTHOR.description.replace(/^Tamil poet and author\. /, "")} He also hosts a podcast on Spotify and shares his writing on Instagram as @rj_prasanthu.`,
    },
    {
      q: "Which books has Prasanth J published?",
      a: `Published so far: ${list}. "நான் யார்?" is a Tamil poetry collection (கவிதைத் தொகுப்பு) of 71 pages, sold as a paperback through Pothi.com.`,
    },
    {
      q: "How do I buy நான் யார்? (Naan Yaar?)",
      a: `Open the book page on ezhupira.in and press "Buy on Pothi". The paperback costs ₹118 plus shipping, is printed on demand and is dispatched in 5–7 business days.`,
    },
    {
      q: "Can I read a preview before buying?",
      a: "Yes. Every book page on ezhupira.in has a free flip-through preview of the cover and the first pages.",
    },
    {
      q: "When is the next Ezhupira book releasing?",
      a: `The next book by Prasanth J releases on ${RELEASE_LABEL}. Pre-orders are open on ezhupira.in.`,
    },
  ];
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
