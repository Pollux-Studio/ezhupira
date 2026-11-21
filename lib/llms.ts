// Content for /llms.txt and /llms-full.txt (https://llmstxt.org): a plain-Markdown map of
// the site for AI assistants and answer engines. Built from the same data as the pages.
import { AUTHOR_BIO_EN, AUTHOR_BIO_TA } from "@/lib/author";
import { formatPrice, isTestBook, nextUpcoming, type Book } from "@/lib/books";
import { releaseLabel } from "@/lib/release";
import { AUTHOR, SITE, SITE_URL, abs, bookTitleLatin, faqSections } from "@/lib/site";

const bookLine = (b: Book) => {
  const latin = bookTitleLatin(b);
  const bits = [b.status === "published" ? "Tamil poetry collection" : "upcoming", b.price && formatPrice(b.price)].filter(Boolean);
  return `- [${b.title}${latin ? ` (${latin})` : ""}](${abs(`/books/${b.slug}`)}): ${bits.join(", ")}. ${b.description}`;
};

export function llmsTxt(allBooks: Book[]) {
  const books = allBooks.filter((b) => !isTestBook(b));
  const release = releaseLabel(nextUpcoming(books)?.releaseAt);
  return `# ${SITE.name} (${SITE.nameTa})

> ${SITE.description}

${SITE.name} (${SITE_URL}) is the official website of Tamil poet and author ${AUTHOR.name} (${AUTHOR.nameTa}). Content is in Tamil with English navigation. Next release: ${release}.

## Books

${books.map(bookLine).join("\n")}

## About

- [About the author](${AUTHOR.url}): biography of ${AUTHOR.name} in Tamil and English, with Instagram and podcast links.
- [FAQ](${abs("/faq")}): questions about Ezhupira, payments, cancellations, refunds and delivery.
- [Track order](${abs("/track-order")}): check the status of a pre-order.

## Optional

- [Full text for LLMs](${abs("/llms-full.txt")}): everything on this page plus the author bio, book details and FAQ.
- [Tamil Type Garden](${abs("/type-garden")}): an interactive Tamil lettering experiment.
- [Sitemap](${abs("/sitemap.xml")})
`;
}

export function llmsFullTxt(allBooks: Book[]) {
  const books = allBooks.filter((b) => !isTestBook(b));
  const bookSection = (b: Book) => {
    const latin = bookTitleLatin(b);
    const facts = [
      `- Title: ${b.title}${latin ? ` (${latin})` : ""}`,
      `- Author: ${b.author} (${AUTHOR.name})`,
      `- Year: ${b.year}`,
      `- Status: ${b.status}`,
      b.price && `- Price: ${formatPrice(b.price)}`,
      b.publisher && `- Publisher / seller: ${b.publisher.name}`,
      ...(b.details ?? []).map((d) => `- ${d.label}: ${d.value}`),
      `- Page: ${abs(`/books/${b.slug}`)}`,
      b.buyUrl && `- Buy: ${b.buyUrl}`,
    ].filter(Boolean);
    return `### ${b.title}${latin ? ` (${latin})` : ""}\n\n${b.description}\n\n${facts.join("\n")}`;
  };

  return `${llmsTxt(books)}
---

## About the author: ${AUTHOR.name} (${AUTHOR.nameTa})

${AUTHOR_BIO_EN.join("\n\n")}

${AUTHOR_BIO_TA.map((p) => p.unicode).join("\n\n")}

- Instagram: ${AUTHOR.sameAs[0]}
- Podcast (Spotify): ${AUTHOR.sameAs[1]}

## Book details

${books.map(bookSection).join("\n\n")}

## Frequently asked questions

${faqSections(books)
  .map((s) => `### ${s.title}\n\n${s.items.map(({ q, a }) => `#### ${q}\n\n${a}`).join("\n\n")}`)
  .join("\n\n")}
`;
}
