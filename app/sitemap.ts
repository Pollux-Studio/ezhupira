import type { MetadataRoute } from "next";
import { getBooks } from "@/lib/catalog";
import { SITE_URL, abs } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getBooks();
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...books.map((book) => ({
      url: abs(`/books/${book.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: book.cover ? [abs(book.cover)] : undefined,
    })),
    { url: abs("/author"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/type-garden"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: abs("/track-order"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: abs("/support"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
