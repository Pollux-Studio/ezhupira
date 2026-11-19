import { ImageResponse } from "next/og";
import { Product } from "@/components/og/product";
import { formatPrice } from "@/lib/books";
import { getBook, getBooks } from "@/lib/catalog";
import { Mallikai, OG_SIZE, OgBrand, ogFonts, publicDataUri } from "@/lib/og";
import { bookTitleLatin } from "@/lib/site";

export const alt = "Book cover and details on Ezhupira";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getBooks()).map((book) => ({ slug: book.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return new Response("Not found", { status: 404 });

  const latin = bookTitleLatin(book);
  const genre = book.details?.find((d) => d.label === "Genre");
  return new ImageResponse(
    (
      <Product
        brand={<OgBrand />}
        logo={await publicDataUri("/icon-192.png")}
        title={book.titleMallikai ? <Mallikai>{book.titleMallikai}</Mallikai> : book.title}
        titleSize={book.titleMallikai ? 110 : 76}
        description={
          <span style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {genre?.valueMallikai && <Mallikai>{genre.valueMallikai}</Mallikai>}
            <span>{[latin, "by Prasanth J"].filter(Boolean).join(" · ")}</span>
          </span>
        }
        // The OG fallback font has no ₹ glyph.
        price={book.price ? formatPrice({ ...book.price, note: undefined }).replace("₹", "Rs. ") : undefined}
        footer={`ezhupira.in/books/${book.slug}`}
        image={book.cover ? await publicDataUri(book.cover) : undefined}
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
