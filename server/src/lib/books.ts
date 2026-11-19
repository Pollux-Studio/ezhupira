// The catalogue lives in MongoDB (edited in the admin). This file seeds it on first start,
// fills in the Mallikai key-code fields, and shapes books for the website.
import { Book } from "../models.js";
import { mallikaiOrNull } from "./mallikai.js";

type Maybe<T> = T | null | undefined;
/** A book as a plain object (from .lean() or a request), not a Mongoose document. */
export type BookRecord = {
  _id?: unknown;
  slug: string;
  title: string;
  titleMallikai?: Maybe<string>;
  author: string;
  authorMallikai?: Maybe<string>;
  description?: Maybe<string>;
  descriptionMallikai?: Maybe<string>;
  year?: Maybe<string>;
  status: string;
  releaseAt?: Maybe<Date>;
  displayPrice?: Maybe<{ amount?: Maybe<number>; note?: Maybe<string> }>;
  cover?: Maybe<string>;
  publisher?: Maybe<{ name?: Maybe<string>; logo?: Maybe<string>; url?: Maybe<string> }>;
  buyUrl?: Maybe<string>;
  buyLabel?: Maybe<string>;
  preview?: Maybe<string[]>;
  highlights?: Maybe<string[]>;
  availability?: Maybe<string>;
  details?: Maybe<{ label?: Maybe<string>; value?: Maybe<string>; valueMallikai?: Maybe<string> }[]>;
  editions?: Maybe<{ id: string; name: string; description?: Maybe<string>; price?: Maybe<number>; needsAddress?: Maybe<boolean> }[]>;
  preorderOpen?: Maybe<boolean>;
  sortOrder?: Maybe<number>;
  createdAt?: Date;
  updatedAt?: Date;
};

/** What was on the website before books moved into the database. Inserted once, on first start. */
const SEED = [
  {
    slug: "naan-yaar",
    title: "நான் யார்?",
    author: "பிரசாந்த்.ஜெ",
    description:
      "'நான் யார்?' - இது வெறும் கவிதைத் தொகுப்பு அல்ல, ஒவ்வொரு மனிதனும் தனக்குள் தேடும் விடையற்ற கேள்விகளின் தொகுப்பு!",
    year: "2026",
    status: "published",
    displayPrice: { amount: 118, note: "+ shipping" },
    cover: "/Frame 6.jpg",
    publisher: { name: "Pothi.com", logo: "/pothi_publisher.svg", url: "https://store.pothi.com/" },
    buyUrl:
      "https://store.pothi.com/book/prasanth-j-%E0%AE%A8%E0%AE%BE%E0%AE%A9%E0%AF%8D-%E0%AE%AF%E0%AE%BE%E0%AE%B0%E0%AF%8D/",
    buyLabel: "Buy on Pothi",
    preview: [
      "/previews/naan-yaar/00-cover.webp",
      ...Array.from({ length: 10 }, (_, i) => `/previews/naan-yaar/${String(i + 1).padStart(2, "0")}.webp`),
      "/previews/naan-yaar/end.webp",
    ],
    highlights: ["கவிதைத் தொகுப்பு", "71 pages", "Paperback", "Tamil"],
    availability: "Print on demand · dispatched in 5–7 business days",
    details: [
      { label: "Genre", value: "கவிதைத் தொகுப்பு" },
      { label: "Language", value: "Tamil" },
      { label: "Format", value: "Paperback (perfect binding)" },
      { label: "Pages", value: "71" },
      { label: "Size", value: "5 × 8 in" },
      { label: "Interior", value: "Black & white" },
      { label: "Availability", value: "Print on demand · dispatched in 5–7 business days" },
    ],
    editions: [],
    preorderOpen: false,
    sortOrder: 10,
  },
];

/** Fills the Mallikai key-code fields from the Unicode text (null where it can't convert). */
export function withMallikai<T extends Partial<BookRecord>>(data: T): T {
  const out: Record<string, unknown> = { ...data };
  if ("title" in data) out.titleMallikai = mallikaiOrNull(data.title);
  if ("author" in data) out.authorMallikai = mallikaiOrNull(data.author);
  if ("description" in data) out.descriptionMallikai = mallikaiOrNull(data.description);
  if (data.details) {
    out.details = data.details.map((d) => ({ label: d.label, value: d.value, valueMallikai: mallikaiOrNull(d.value) }));
  }
  return out as T;
}

export async function seedBooks() {
  if (await Book.estimatedDocumentCount()) return;
  await Book.insertMany(SEED.map((b) => withMallikai(b as Partial<BookRecord>)));
  console.log(`Seeded ${SEED.length} book(s)`);
}

/** The website's Book shape (lib/books.ts there). Nulls become undefined. */
export function publicBook(b: BookRecord) {
  const opt = <T>(v: T | null | undefined) => (v === null ? undefined : v);
  return {
    slug: b.slug,
    title: b.title,
    titleMallikai: opt(b.titleMallikai),
    author: b.author,
    authorMallikai: opt(b.authorMallikai),
    description: b.description ?? "",
    descriptionMallikai: opt(b.descriptionMallikai),
    year: b.year ?? "",
    status: b.status,
    releaseAt: opt(b.releaseAt),
    price: b.displayPrice?.amount ? { amount: b.displayPrice.amount, currency: "INR" as const, note: opt(b.displayPrice.note) } : undefined,
    cover: opt(b.cover),
    publisher: b.publisher?.name ? { name: b.publisher.name, logo: b.publisher.logo ?? "", url: opt(b.publisher.url) } : undefined,
    buyUrl: opt(b.buyUrl),
    buyLabel: opt(b.buyLabel),
    preview: b.preview?.length ? b.preview : undefined,
    highlights: b.highlights?.length ? b.highlights : undefined,
    availability: opt(b.availability),
    details: b.details?.length
      ? b.details.map((d) => ({ label: d.label ?? "", value: d.value ?? "", valueMallikai: opt(d.valueMallikai) }))
      : undefined,
    editions: (b.editions ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      description: opt(e.description),
      price: e.price ?? 0,
      needsAddress: !!e.needsAddress,
    })),
    preorderOpen: !!b.preorderOpen,
  };
}

/** Books shown on the website (not hidden), in display order. */
export async function listPublicBooks() {
  const books = (await Book.find({ status: { $ne: "hidden" } }).sort({ sortOrder: 1, createdAt: 1 }).lean()) as unknown as BookRecord[];
  return books.map(publicBook);
}

/** True for any book in the catalogue (reviews and the bookshelf accept these). */
export async function isKnownBook(slug: string) {
  return !!(await Book.exists({ slug, status: { $ne: "hidden" } }));
}

/** A purchasable edition: only when the book is open for orders and the edition is priced. */
export async function findEdition(bookSlug: string, editionId: string) {
  const book = (await Book.findOne({ slug: bookSlug }).lean()) as unknown as BookRecord | null;
  const edition = book?.editions?.find((e) => e.id === editionId);
  if (!book || !edition || !book.preorderOpen || book.status === "hidden" || !((edition.price ?? 0) > 0)) return null;
  return { book, edition: { ...edition, price: edition.price ?? 0, needsAddress: !!edition.needsAddress } };
}
