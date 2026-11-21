// Site-wide facts used by metadata, JSON-LD, the sitemap, robots and llms.txt.
// Keep these accurate: search engines and AI answer engines quote them verbatim.
import { isTestBook, type Book } from "@/lib/books";
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

export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

/** "Questions about Ezhupira": the site, the author and the books. */
export function aboutFaq(books: Book[], release: string = RELEASE_LABEL): FaqItem[] {
  const published = books.filter((b) => b.status === "published" && !isTestBook(b));
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
      a: `The next book by Prasanth J releases on ${release}. When pre-orders open, the book gets its own pre-order page on ezhupira.in.`,
    },
  ];
}

// Policy answers. Keep these in step with how orders are actually handled: readers (and
// Cashfree's account review) rely on them.
const PAYMENT_FAQ: FaqItem[] = [
  {
    q: "How do I pay for an order?",
    a: "Checkout on ezhupira.in uses Cashfree Payments, an RBI-authorised payment gateway. You can pay by UPI (Google Pay, PhonePe, Paytm and other UPI apps), debit or credit card, net banking or wallet, depending on what the payment page offers. All prices are in Indian rupees (₹), and the amount on the Pay button is the full amount you are charged.",
  },
  {
    q: "Is paying on Ezhupira safe?",
    a: "Yes. Your card, UPI or bank details are entered on Cashfree's secure payment page, never on our website. We never see or store them; we only receive a confirmation that the payment succeeded.",
  },
  {
    q: "Do I need an account to order?",
    a: "Yes. Sign in with your Google account before checkout. Your receipt and order updates are sent to that email address, and all your orders are listed on your profile page.",
  },
  {
    q: "How do I know my payment went through?",
    a: "After paying you are brought back to your order page, which shows the order ID (for example EZH-1001) and its status. Once the payment is confirmed, the status changes to Paid and a confirmation email is sent to you.",
  },
  {
    q: "Money was debited but my order says pending or failed. What now?",
    a: "Every payment is checked with Cashfree, so an order usually updates within a few minutes. Open the order page to refresh it. If the payment did not complete, your bank reverses the debit automatically, usually within 5–7 business days. If it has not come back after that, contact support with your order ID and we will sort it out.",
  },
  {
    q: "What happens if I close the payment page without paying?",
    a: "You are not charged. The order stays pending for a short while, and you can finish paying from the order page. If the payment window expires, the order is cancelled automatically; just place a new one.",
  },
  {
    q: "When am I charged for a pre-order?",
    a: "Pre-orders are paid in full when you place them. Printed copies are shipped on release, and e-books become available on release day.",
  },
];

const REFUND_FAQ: FaqItem[] = [
  {
    q: "Can I cancel my order?",
    a: "Yes. Printed books and pre-orders can be cancelled for a full refund any time before they are shipped. Send a message from the Support page with your order ID. Once an order has shipped it can no longer be cancelled.",
  },
  {
    q: "Can I get a refund for an e-book?",
    a: "An e-book can be cancelled for a full refund until it is made available to you (release day for pre-orders). After that, e-books are not refundable, unless the file is faulty and we cannot fix or replace it.",
  },
  {
    q: "My book arrived damaged or I received the wrong book.",
    a: "Tell us within 7 days of delivery through the Support page, with your order ID and a photo. We will send a replacement at no cost, or give you a full refund if a replacement isn't possible.",
  },
  {
    q: "How long does a refund take?",
    a: "Refunds go back to the payment method you used (UPI, card, bank account or wallet). We start the refund within 2 business days of approving it, and banks usually take 5–7 business days to show it. Your order status changes to Refunded once it is processed.",
  },
  {
    q: "I bought a book on Pothi.com. Can Ezhupira refund it?",
    a: "Copies bought on Pothi.com are sold and shipped by Pothi, so their cancellation and refund policy applies. Please contact Pothi.com directly for those orders.",
  },
];

const SHIPPING_FAQ: FaqItem[] = [
  {
    q: "Where do you deliver?",
    a: "Printed books ordered on ezhupira.in are delivered within India. You will need a full address with a 6-digit PIN code at checkout. E-books need no address.",
  },
  {
    q: "When will my book be shipped?",
    a: "Pre-ordered printed copies are shipped when the book is released. Your order page shows Shipped once it is on its way, and Delivered once it arrives.",
  },
  {
    q: "How do I track my order?",
    a: "Open Track order and enter your order ID with the phone number or email you used, or sign in and see every order on your profile page. For anything else, write to us from the Support page and we reply by email.",
  },
];

/** Every question on the FAQ page, grouped; also emitted as FAQPage for answer engines. */
export function faqSections(books: Book[], release: string = RELEASE_LABEL): FaqSection[] {
  return [
    { id: "about", title: "Questions about Ezhupira", items: aboutFaq(books, release) },
    { id: "payments", title: "Orders & payments", items: PAYMENT_FAQ },
    { id: "refunds", title: "Cancellations & refunds", items: REFUND_FAQ },
    { id: "shipping", title: "Shipping & delivery", items: SHIPPING_FAQ },
  ];
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
