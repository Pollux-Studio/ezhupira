"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api, type Catalog, type CatalogEdition, type CheckoutSession, type User } from "@/lib/api";
import { openCheckout } from "@/lib/checkout";
import { editions as editionCopy, formatPrice } from "@/lib/preorder";

const describe = (id: CatalogEdition["id"]) => editionCopy.find((e) => e.id === id)?.description ?? "";

/**
 * Pre-order form for one specific book. Editions and prices come from the API (it decides
 * what's charged); it only opens if the API has that book on sale.
 */
export function PreorderForm({ user, bookSlug }: { user: User; bookSlug: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<CatalogEdition["id"]>("hardcopy");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<Catalog>("/catalog").then(setCatalog, (err: Error) => setLoadError(err.message));
  }, []);

  if (loadError) return <p className="text-sm text-destructive">{loadError}</p>;
  if (!catalog) return <div className="h-80 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;

  const book = catalog.books.find((b) => b.slug === bookSlug);
  const open = !!book && book.onSale && book.editions.some((e) => e.price > 0);
  if (!book || !open) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-orders aren&apos;t open for this book</CardTitle>
          <CardDescription>When they open, the pre-order form will appear right here on this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const edition = book.editions.find((e) => e.id === editionId) ?? book.editions[0];

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
            ? { line1: get("line1"), line2: get("line2") || undefined, city: get("city"), state: get("state"), pincode: get("pincode") }
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
        <CardTitle>Pre-order {book.title}</CardTitle>
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

            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" name="name" autoComplete="name" defaultValue={user.name} minLength={3} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
              <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" required />
              <FieldDescription>For delivery updates. Receipts go to {user.email}.</FieldDescription>
            </Field>

            {edition.needsAddress && (
              <>
                <Field>
                  <FieldLabel htmlFor="line1">Address</FieldLabel>
                  <Input id="line1" name="line1" autoComplete="address-line1" placeholder="House no., street" required />
                  <Input id="line2" name="line2" autoComplete="address-line2" placeholder="Area, landmark (optional)" aria-label="Address line 2" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                    <Input id="city" name="city" autoComplete="address-level2" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="state">State</FieldLabel>
                    <Input id="state" name="state" autoComplete="address-level1" defaultValue="Tamil Nadu" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pincode">PIN code</FieldLabel>
                    <Input id="pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} required />
                  </Field>
                </div>
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
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
