"use client";

import { useState, type FormEvent } from "react";
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
import { editions, formatPrice, type Edition } from "@/lib/preorder";

export function PreorderForm({ bookTitle }: { bookTitle: string }) {
  const [editionId, setEditionId] = useState<Edition["id"]>("hardcopy");
  const [submitted, setSubmitted] = useState(false);
  const edition = editions.find((e) => e.id === editionId) ?? editions[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: create the order on the server and hand off to the payment provider.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-order received</CardTitle>
          <CardDescription>
            {bookTitle} · {edition.name}. Payments aren&apos;t connected yet, so no money has been
            taken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Make another pre-order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-order {bookTitle}</CardTitle>
        <CardDescription>Choose an edition and tell us where to send it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <RadioGroup
              value={editionId}
              onValueChange={(value) => setEditionId(value as Edition["id"])}
              aria-label="Edition"
            >
              {editions.map((e) => (
                <FieldLabel key={e.id} htmlFor={`edition-${e.id}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>
                        {e.name} · {formatPrice(e.price)}
                      </FieldTitle>
                      <FieldDescription>{e.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={e.id} id={`edition-${e.id}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>

            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" name="name" autoComplete="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
            </Field>
            {edition.needsAddress && (
              <Field>
                <FieldLabel htmlFor="address">Shipping address</FieldLabel>
                <Input id="address" name="address" autoComplete="street-address" required />
              </Field>
            )}

            <Button type="submit">Place pre-order</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
