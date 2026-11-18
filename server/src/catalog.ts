// What can be bought, and for how much. Prices live on the server only: the website shows
// them, but the amount charged always comes from here, never from the browser.
// Keep in step with lib/preorder.ts and lib/books.ts in the website.

export type Edition = {
  id: "hardcopy" | "ebook";
  name: string;
  price: number; // INR, rupees. 0 = not on sale yet.
  needsAddress: boolean;
};

export type CatalogBook = {
  slug: string;
  title: string;
  /** Open for pre-order/purchase through this server. */
  onSale: boolean;
  editions: Edition[];
};

export const catalog: CatalogBook[] = [
  {
    // TODO: the upcoming book (release 1 January 2027). Set its slug, title and prices.
    slug: "next-book",
    title: "Next book",
    onSale: false,
    editions: [
      { id: "hardcopy", name: "Hardcopy", price: 0, needsAddress: true },
      { id: "ebook", name: "E-book", price: 0, needsAddress: false },
    ],
  },
];

export function findEdition(bookSlug: string, editionId: string) {
  const book = catalog.find((b) => b.slug === bookSlug);
  const edition = book?.editions.find((e) => e.id === editionId);
  return book && edition ? { book, edition } : null;
}

/**
 * Every book on the website (lib/books.ts), on sale here or not: readers can review them and
 * put them on their bookshelf. Add new slugs here when a book is added to the site.
 */
export const KNOWN_BOOKS = new Set(["naan-yaar", ...catalog.map((b) => b.slug)]);
