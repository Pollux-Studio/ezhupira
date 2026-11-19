"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card, ErrorNote, Field, Input, Select, Textarea, cx } from "@/components/ui";
import type { Book, Edition } from "@/lib/api";

export type BookInput = Omit<Book, "titleMallikai" | "authorMallikai" | "updatedAt" | "details"> & {
  details: { label: string; value: string }[];
};

const EDITION_DEFAULTS: Record<Edition["id"], Edition> = {
  hardcopy: { id: "hardcopy", name: "Hardcopy", description: "Printed book, shipped to your address on release day.", price: 0, needsAddress: true },
  ebook: { id: "ebook", name: "E-book", description: "Digital edition, available to read on release day.", price: 0, needsAddress: false },
};

export const emptyBook = (): BookInput => ({
  slug: "",
  title: "",
  author: "பிரசாந்த்.ஜெ",
  description: "",
  year: String(new Date().getFullYear() + 1),
  status: "upcoming",
  releaseAt: undefined,
  displayPrice: null,
  cover: "",
  publisher: undefined,
  buyUrl: "",
  buyLabel: "",
  preview: [],
  highlights: [],
  availability: "",
  details: [],
  editions: [EDITION_DEFAULTS.hardcopy, EDITION_DEFAULTS.ebook],
  preorderOpen: false,
  sortOrder: 0,
});

/** ISO → value for <input type="datetime-local"> in India time. */
function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}
/** <input type="datetime-local"> (India time) → ISO. */
const fromLocalInput = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </Card>
  );
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

/**
 * Edits a book's content (text, prices, dates, links, image paths). Images themselves aren't
 * uploaded here: covers and preview pages are files in the website's public/ folder, and
 * these fields point at them. Tamil text is converted to the Mallikai brand font on save.
 */
export function BookEditor({
  initial,
  isNew,
  mallikai,
  onSave,
}: {
  initial: BookInput;
  isNew: boolean;
  /** Mallikai key codes from the API, to preview how the site draws the title. */
  mallikai?: { title?: string; author?: string };
  onSave: (book: BookInput) => Promise<void>;
}) {
  const [b, setB] = useState<BookInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof BookInput>(k: K, v: BookInput[K]) => {
    setB((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const editionOn = (id: Edition["id"]) => b.editions.some((e) => e.id === id);
  const toggleEdition = (id: Edition["id"], on: boolean) =>
    set("editions", on ? [...b.editions, EDITION_DEFAULTS[id]].sort((x, y) => x.id.localeCompare(y.id)) : b.editions.filter((e) => e.id !== id));
  const setEdition = (id: Edition["id"], patch: Partial<Edition>) =>
    set("editions", b.editions.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(b);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 pb-24">
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title (Tamil)" hint="Typed in normal Tamil; the site shows it in the Mallikai brand font.">
            <Input value={b.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} />
          </Field>
          <Field label="Author">
            <Input value={b.author} onChange={(e) => set("author", e.target.value)} required maxLength={200} />
          </Field>
        </div>
        {mallikai?.title && (
          <div className="rounded-md bg-bg px-3 py-2">
            <p className="text-xs text-muted">How the site shows it</p>
            <p className="font-mallikai text-2xl leading-tight">{mallikai.title}</p>
            {mallikai.author && <p className="font-mallikai text-lg text-muted">{mallikai.author}</p>}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="URL slug" hint={isNew ? "ezhupira.in/books/<slug>. Can't be changed later." : "Fixed after creation."}>
            <Input
              value={b.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              disabled={!isNew}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="kadal-kavithaigal"
            />
          </Field>
          <Field label="Status" hint="Hidden books don't appear on the site.">
            <Select value={b.status} onChange={(e) => set("status", e.target.value as Book["status"])}>
              <option value="upcoming">Upcoming</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </Select>
          </Field>
          <Field label="Year">
            <Input value={b.year} onChange={(e) => set("year", e.target.value)} maxLength={10} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Release date & time (India)" hint="Drives the homepage countdown for the next book.">
            <Input type="datetime-local" value={toLocalInput(b.releaseAt)} onChange={(e) => set("releaseAt", fromLocalInput(e.target.value) ?? undefined)} />
          </Field>
          <Field label="Display order" hint="Lower numbers show first.">
            <Input type="number" value={b.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
          </Field>
        </div>
        <Field label="Description" hint="Shown on the book page and to search engines.">
          <Textarea rows={5} value={b.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} />
        </Field>
      </Section>

      <Section
        title="Editions & prices"
        description="What readers can buy through Ezhupira's checkout. The price charged always comes from here."
      >
        {(["hardcopy", "ebook"] as const).map((id) => {
          const ed = b.editions.find((e) => e.id === id);
          return (
            <div key={id} className={cx("rounded-md border border-line p-4", !ed && "opacity-60")}>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={editionOn(id)} onChange={(e) => toggleEdition(id, e.target.checked)} className="size-4 accent-[var(--brand)]" />
                {EDITION_DEFAULTS[id].name}
              </label>
              {ed && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <Field label="Name">
                    <Input value={ed.name} onChange={(e) => setEdition(id, { name: e.target.value })} required maxLength={60} />
                  </Field>
                  <Field label="Price (₹)" hint="0 = not on sale">
                    <Input type="number" min={0} step={1} value={ed.price} onChange={(e) => setEdition(id, { price: Number(e.target.value) || 0 })} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <Input value={ed.description ?? ""} onChange={(e) => setEdition(id, { description: e.target.value })} maxLength={300} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={ed.needsAddress} onChange={(e) => setEdition(id, { needsAddress: e.target.checked })} className="size-4 accent-[var(--brand)]" />
                    Needs a shipping address
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </Section>

      <Section title="Cover & preview" description="Paths to image files in the website's public/ folder (add new images to the website repo first).">
        <Field label="Cover image path" hint="5:8 portrait, e.g. /covers/kadal.jpg">
          <Input value={b.cover ?? ""} onChange={(e) => set("cover", e.target.value)} placeholder="/covers/book.jpg" />
        </Field>
        <Field label="Preview pages" hint="One image path per line: cover, first pages, end page (WebP).">
          <Textarea rows={4} value={(b.preview ?? []).join("\n")} onChange={(e) => set("preview", lines(e.target.value))} className="font-mono text-xs" />
        </Field>
      </Section>

      <Section title="Details on the book page">
        <Field label="Highlights" hint="Short chips near the title, one per line (e.g. கவிதைத் தொகுப்பு, 71 pages).">
          <Textarea rows={3} value={(b.highlights ?? []).join("\n")} onChange={(e) => set("highlights", lines(e.target.value))} />
        </Field>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Facts table</span>
          {b.details.map((d, i) => (
            <div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-2">
              <Input value={d.label} placeholder="Label" onChange={(e) => set("details", b.details.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <Input value={d.value} placeholder="Value" onChange={(e) => set("details", b.details.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <Button type="button" variant="ghost" onClick={() => set("details", b.details.filter((_, j) => j !== i))} aria-label="Remove row">
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => set("details", [...b.details, { label: "", value: "" }])}>
            <Plus /> Add row
          </Button>
        </div>
        <Field label="Availability line" hint="e.g. Print on demand · dispatched in 5–7 business days">
          <Input value={b.availability ?? ""} onChange={(e) => set("availability", e.target.value)} />
        </Field>
      </Section>

      <Section title="Sold elsewhere (optional)" description="For books bought on another store, like Pothi. Leave empty for books sold through Ezhupira.">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="Store link">
            <Input value={b.buyUrl ?? ""} onChange={(e) => set("buyUrl", e.target.value)} placeholder="https://store.pothi.com/…" />
          </Field>
          <Field label="Button label">
            <Input value={b.buyLabel ?? ""} onChange={(e) => set("buyLabel", e.target.value)} placeholder="Buy on Pothi" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Shown price (₹)">
            <Input
              type="number"
              min={0}
              value={b.displayPrice?.amount ?? ""}
              onChange={(e) => set("displayPrice", { amount: e.target.value ? Number(e.target.value) : null, note: b.displayPrice?.note ?? "" })}
            />
          </Field>
          <Field label="Price note">
            <Input value={b.displayPrice?.note ?? ""} onChange={(e) => set("displayPrice", { amount: b.displayPrice?.amount ?? null, note: e.target.value })} placeholder="+ shipping" />
          </Field>
          <Field label="Publisher name">
            <Input
              value={b.publisher?.name ?? ""}
              onChange={(e) => set("publisher", { name: e.target.value, logo: b.publisher?.logo ?? "", url: b.publisher?.url })}
              placeholder="Pothi.com"
            />
          </Field>
        </div>
      </Section>

      {/* Save bar stays in view while editing. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3">
          <div className="mr-auto min-w-0">
            <ErrorNote error={error} />
            {saved && !error && <p className="text-sm text-ok">Saved. The website updates within a minute.</p>}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create book" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** What the API accepts from the editor (drops fields it computes or that can't change). */
export function toPayload(b: BookInput, isNew: boolean) {
  const payload: Record<string, unknown> = {
    title: b.title,
    author: b.author,
    description: b.description,
    year: b.year,
    status: b.status,
    releaseAt: b.releaseAt ?? null,
    displayPrice: b.displayPrice?.amount ? { amount: b.displayPrice.amount, note: b.displayPrice.note ?? "" } : null,
    cover: b.cover ?? "",
    publisher: b.publisher?.name ? { name: b.publisher.name, logo: b.publisher.logo ?? "", url: b.publisher.url ?? "" } : null,
    buyUrl: b.buyUrl ?? "",
    buyLabel: b.buyLabel ?? "",
    preview: b.preview ?? [],
    highlights: b.highlights ?? [],
    availability: b.availability ?? "",
    details: b.details.filter((d) => d.label.trim() && d.value.trim()),
    editions: b.editions.map((e) => ({ id: e.id, name: e.name, description: e.description ?? "", price: e.price, needsAddress: e.needsAddress })),
    sortOrder: b.sortOrder,
  };
  if (isNew) payload.slug = b.slug;
  return payload;
}
