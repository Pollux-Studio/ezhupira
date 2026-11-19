"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const TOPICS = [
  { value: "order", label: "An order or delivery" },
  { value: "payment", label: "A payment" },
  { value: "book", label: "A book" },
  { value: "account", label: "My account" },
  { value: "other", label: "Something else" },
];

/** Contact form: opens a support ticket; the reply comes by email. Signed-in readers get their name and email filled in. */
export function SupportForm() {
  const { user } = useSession();
  const [topic, setTopic] = useState("order");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setError(null);
    setSubmitting(true);
    try {
      const { code } = await api<{ code: string }>("/support", {
        body: {
          name: get("name"),
          email: get("email"),
          topic,
          orderCode: get("orderCode") || undefined,
          subject: get("subject"),
          message: get("message"),
          website: get("website") || undefined,
        },
      });
      setSent(code);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message sent</CardTitle>
          <CardDescription>
            Your ticket number is <span className="font-medium text-foreground">{sent}</span>. We&apos;ve emailed you a copy and
            will reply to the same address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className="text-sm underline">
            Back to the home page
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact support</CardTitle>
        <CardDescription>Questions about an order, a payment or a book? Send us a message and we&apos;ll reply by email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" name="name" autoComplete="name" defaultValue={user?.name} key={`n-${user?.id}`} required minLength={2} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" defaultValue={user?.email} key={`e-${user?.id}`} required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="topic">What is it about?</FieldLabel>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            {(topic === "order" || topic === "payment") && (
              <Field>
                <FieldLabel htmlFor="orderCode">Order ID (optional)</FieldLabel>
                <Input id="orderCode" name="orderCode" placeholder="e.g. EZH-1024" autoComplete="off" />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="subject">Subject</FieldLabel>
              <Input id="subject" name="subject" required minLength={3} maxLength={200} />
            </Field>
            <Field>
              <FieldLabel htmlFor="message">Message</FieldLabel>
              <Textarea id="message" name="message" rows={6} required minLength={10} maxLength={8000} />
            </Field>
            {/* Honeypot for bots; hidden from people and screen readers. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            {error && (
              <FieldDescription role="alert" className="text-destructive">
                {error}
              </FieldDescription>
            )}
            <Button type="submit" disabled={submitting} className="w-fit">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
