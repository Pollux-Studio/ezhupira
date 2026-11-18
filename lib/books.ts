export type Publisher = {
  name: string;
  /** Logo in /public. */
  logo: string;
  url?: string;
};

export type Book = {
  /** URL segment for the detail page: /books/[slug]. */
  slug: string;
  /** Title in Unicode (used for screen readers, search and alt text). */
  title: string;
  /**
   * The same title typed in the Mallikai legacy font's key code, for display.
   * Tamil on the site is shown only in Mallikai (see components/site-header.tsx).
   */
  titleMallikai?: string;
  author: string;
  authorMallikai?: string;
  description: string;
  /** The description typed in Mallikai's key code (scripts/to-mallikai.py), when it's Tamil. */
  descriptionMallikai?: string;
  year: string;
  /** Selling price; `note` is shown after it, e.g. "+ shipping". */
  price?: { amount: number; currency: "INR"; note?: string };
  status: "published" | "upcoming";
  /** Cover image in /public, 5:8 portrait. */
  cover?: string;
  publisher?: Publisher;
  /** Where to buy it. */
  buyUrl?: string;
  buyLabel?: string;
  /**
   * Flipbook preview: image URLs (cover, preview pages, end page), rendered from the
   * private PDF by scripts/render-preview.py. Never the full book.
   */
  preview?: string[];
  /** Short facts shown as chips near the title, e.g. "71 pages". */
  highlights?: string[];
  /** Where it ships from / how long, shown under the price. */
  availability?: string;
  /** Extra facts shown on the detail page. `valueMallikai` when the value is Tamil. */
  details?: { label: string; value: string; valueMallikai?: string }[];
};

export const PUBLISHERS = {
  pothi: { name: "Pothi.com", logo: "/pothi_publisher.svg", url: "https://store.pothi.com/" },
} satisfies Record<string, Publisher>;

export const books: Book[] = [
  {
    slug: "naan-yaar",
    title: "நான் யார்?",
    titleMallikai: "ehd; ahu;?", // நான் யார்?
    author: "பிரசாந்த்.ஜெ",
    authorMallikai: "gpurhe;j;.n[", // பிரசாந்த்.ஜெ
    // Opening line of the blurb on Pothi. TODO: paste the full blurb (and convert it with
    // `python scripts/to-mallikai.py "<text>"`).
    description:
      "'நான் யார்?' - இது வெறும் கவிதைத் தொகுப்பு அல்ல, ஒவ்வொரு மனிதனும் தனக்குள் தேடும் விடையற்ற கேள்விகளின் தொகுப்பு!",
    descriptionMallikai:
      "'ehd; ahu;?' - ,J ntWk; ftpijj; njhFg;G my;y> xt;nthU kdpjDk; jdf;Fs; NjLk; tpilaw;w Nfs;tpfspd; njhFg;G!",
    year: "2026",
    price: { amount: 118, currency: "INR", note: "+ shipping" },
    status: "published",
    cover: "/Frame 6.jpg",
    publisher: PUBLISHERS.pothi,
    buyUrl:
      "https://store.pothi.com/book/prasanth-j-%E0%AE%A8%E0%AE%BE%E0%AE%A9%E0%AF%8D-%E0%AE%AF%E0%AE%BE%E0%AE%B0%E0%AF%8D/",
    buyLabel: "Buy on Pothi",
    // First 10 pages only (PREVIEW_PAGES in scripts/render-preview.py).
    preview: [
      "/previews/naan-yaar/00-cover.webp",
      ...Array.from({ length: 10 }, (_, i) => i + 1).map((n) => `/previews/naan-yaar/${String(n).padStart(2, "0")}.webp`),
      "/previews/naan-yaar/end.webp",
    ],
    // From the Pothi store page.
    highlights: ["கவிதைத் தொகுப்பு", "71 pages", "Paperback", "Tamil"],
    availability: "Print on demand · dispatched in 5–7 business days",
    details: [
      { label: "Genre", value: "கவிதைத் தொகுப்பு", valueMallikai: "ftpijj; njhFg;G" },
      { label: "Language", value: "Tamil" },
      { label: "Format", value: "Paperback (perfect binding)" },
      { label: "Pages", value: "71" },
      { label: "Size", value: "5 × 8 in" },
      { label: "Interior", value: "Black & white" },
      { label: "Availability", value: "Print on demand · dispatched in 5–7 business days" },
    ],
  },
];

export function formatPrice(price: NonNullable<Book["price"]>) {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.amount);
  return price.note ? `${amount} ${price.note}` : amount;
}

export function getBook(slug: string) {
  return books.find((book) => book.slug === slug);
}
