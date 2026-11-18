"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // TODO: look the order up on the server (order ID + phone/email) and show its status.
    setOrderId(String(data.get("orderId") ?? "").trim());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track your order</CardTitle>
        <CardDescription>Enter your order ID and the phone number or email you ordered with.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="orderId">Order ID</FieldLabel>
              <Input id="orderId" name="orderId" placeholder="e.g. EZH-1024" autoComplete="off" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact">Phone or email</FieldLabel>
              <Input id="contact" name="contact" autoComplete="email" required />
            </Field>
            <Button type="submit">Track order</Button>
            {orderId !== null && (
              <FieldDescription role="status">
                Order tracking isn&apos;t connected yet, so we can&apos;t show the status of{" "}
                <span className="font-medium text-foreground">{orderId}</span> here. Please check back
                soon.
              </FieldDescription>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
