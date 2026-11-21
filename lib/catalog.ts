// The catalogue, read from the API (books are edited in the admin). Cached for 60 seconds and
// tagged "books" so an admin edit can refresh it at once (app/api/revalidate). If the API
// can't be reached, the built-in copy in lib/books.ts is used so pages still render.
import { API_URL } from "@/lib/api";
import { fallbackBooks, nextUpcoming, openPreorder, sellsHere, type Book } from "@/lib/books";

export async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_URL}/books`, { next: { revalidate: 60, tags: ["books"] }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { books } = (await res.json()) as { books: Book[] };
    return books.map(withEditionPrice);
  } catch (err) {
    console.warn(`Catalogue API unavailable (${(err as Error).message}); using the built-in copy.`);
    return fallbackBooks;
  }
}

/**
 * Books sold through our own checkout often have no display price (that's for books sold
 * elsewhere), so show the cheapest edition's. Without a price the book page hides its buy panel.
 */
function withEditionPrice(book: Book): Book {
  if (book.price || !sellsHere(book)) return book;
  const prices = book.editions!.map((e) => e.price).filter((p) => p > 0);
  const amount = Math.min(...prices);
  return { ...book, price: { amount, currency: "INR", note: prices.some((p) => p > amount) ? "onwards" : undefined } };
}

export async function getBook(slug: string) {
  return (await getBooks()).find((b) => b.slug === slug);
}

/** The book currently open for pre-order, if any (the first upcoming one that's open). */
export async function getPreorderBook() {
  return openPreorder(await getBooks());
}

/** The next upcoming book (open for pre-order or not), for the countdown. */
export async function getUpcomingBook() {
  return nextUpcoming(await getBooks());
}
