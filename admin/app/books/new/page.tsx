"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookEditor, emptyBook, toPayload } from "@/components/book-editor";
import { PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewBookPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/books" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Books
      </Link>
      <PageHeader title="Add upcoming book" description="Create it here, then open pre-orders from its page once the prices are set." />
      <BookEditor
        initial={emptyBook()}
        isNew
        onSave={async (b) => {
          await api("/admin/books", { body: toPayload(b, true) });
          router.push(`/books/${b.slug}`);
        }}
      />
    </div>
  );
}
