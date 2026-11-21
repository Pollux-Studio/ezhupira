"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { formatPhone } from "@/lib/phone-countries";
import { AddressFields, formatAddress, readAddress } from "@/components/address/address-fields";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api, type Catalog, type CatalogEdition, type CheckoutSession, type SavedAddress, type User } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { editions as editionCopy, formatPrice } from "@/lib/preorder";

const describe = (id: CatalogEdition["id"]) => editionCopy.find((e) => e.id === id)?.description ?? "";

/**
 * Pre-order form for one specific book. Editions and prices come from the API (it decides
 * what's charged); it only opens if the API has that book on sale.
 */
export function PreorderForm({ user, bookSlug, released = false }: { user: User; bookSlug: string; released?: boolean }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<CatalogEdition["id"]>("hardcopy");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The address book (saved from earlier orders) and which entry is picked: an id, "new",
  // or null for "the default".
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    api<Catalog>("/catalog").then(setCatalog, (err: Error) => setLoadError(err.message));
    // Optional: checkout works the same without saved addresses.
    api<{ addresses: SavedAddress[] }>("/me/addresses").then((r) => setAddresses(r.addresses), () => {});
  }, []);

  if (loadError) return <p className="text-sm text-destructive">{loadError}</p>;
  if (!catalog) return <div className="h-80 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;

  const book = catalog.books.find((b) => b.slug === bookSlug);
  const open = !!book && book.onSale && book.editions.some((e) => e.price > 0);
  if (!book || !open) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{released ? "This book isn't on sale here" : "Pre-orders aren't open for this book"}</CardTitle>
          <CardDescription>
            {released
              ? "Use the buy link on the book page instead."
              : "When they open, the pre-order form will appear right here on this page."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const edition = book.editions.find((e) => e.id === editionId) ?? book.editions[0];
  const fallback = addresses.find((a) => a.isDefault) ?? addresses[0];
  const picked = choice ?? fallback?.id ?? "new";
  const saved = addresses.find((a) => a.id === picked);
  // Name and phone follow the picked address (or the default one for e-books).
  const contact = (edition.needsAddress ? saved : fallback) ?? undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setError(null);
    setSubmitting(true);
    try {
      const session = await api<CheckoutSession>("/orders", {
        body: {
          bookSlug,
          editionId: edition.id,
          name: get("name"),
          phone: get("phone"),
          address: edition.needsAddress
            ? saved
              ? { line1: saved.line1, line2: saved.line2, city: saved.city, state: saved.state, pincode: saved.pincode }
              : readAddress(f)
            : undefined,
        },
      });
      await openCheckout(session); // leaves the page; Cashfree returns to /orders/<code>
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {released ? "Buy" : "Pre-order"} {book.title}
        </CardTitle>
        <CardDescription>Choose an edition and tell us where to send it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <RadioGroup value={edition.id} onValueChange={(v) => setEditionId(v as CatalogEdition["id"])} aria-label="Edition">
              {book.editions.map((e) => (
                <FieldLabel key={e.id} htmlFor={`edition-${e.id}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>
                        {e.name} · {formatPrice(e.price)}
                      </FieldTitle>
                      <FieldDescription>{describe(e.id)}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={e.id} id={`edition-${e.id}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>

            {edition.needsAddress && addresses.length > 0 && (
              <Field>
                <FieldLabel id="deliver-to">Deliver to</FieldLabel>
                <RadioGroup value={picked} onValueChange={(v) => setChoice(String(v))} aria-labelledby="deliver-to">
                  {addresses.map((a) => (
                    <FieldLabel key={a.id} htmlFor={`address-${a.id}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            {a.name}
                            {a.isDefault && <span className="text-xs font-normal text-muted-foreground">· Default</span>}
                          </FieldTitle>
                          <FieldDescription>
                            {formatAddress(a)} · {formatPhone(a.phone)}
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={a.id} id={`address-${a.id}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                  <FieldLabel htmlFor="address-new">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Use a new address</FieldTitle>
                        <FieldDescription>It&apos;s saved to your address book for next time.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="new" id="address-new" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
                <FieldDescription>
                  Manage addresses on your{" "}
                  <Link href="/profile#addresses" className="underline underline-offset-4">
                    profile
                  </Link>
                  .
                </FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input key={`name-${contact?.id}`} id="name" name="name" autoComplete="name" defaultValue={contact?.name ?? user.name} minLength={3} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
              <PhoneInput key={`phone-${contact?.id}`} id="phone" defaultValue={contact?.phone} required />
              <FieldDescription>For delivery updates. Receipts go to {user.email}.</FieldDescription>
            </Field>

            {edition.needsAddress && !saved && (
              <>
                <AddressFields />
                {addresses.length === 0 && (
                  <FieldDescription>We&apos;ll save this address to your profile, so next time it&apos;s filled in for you.</FieldDescription>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Opening payment…" : `Pay ${formatPrice(edition.price)}`}
            </Button>
            {catalog.cashfreeMode === "sandbox" && (
              <FieldDescription className="text-center">Test mode: no real money is charged.</FieldDescription>
            )}
            <FieldDescription className="text-center">
              Payments, cancellations and refunds: see the <Link href="/faq#payments" className="underline underline-offset-4">FAQ</Link>.
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
