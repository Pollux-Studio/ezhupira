"use client";

import { Check, Star, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, cx } from "@/components/ui";
import { api, type Review } from "@/lib/api";
import { dateTime } from "@/lib/format";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cx("size-4", n <= value ? "fill-brand text-brand" : "text-line")} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<"pending" | "published">("pending");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    setReviews(null);
    api<{ reviews: Review[] }>(`/admin/reviews?approved=${tab === "published"}`).then((r) => setReviews(r.reviews), (err: Error) => setError(err.message));
  }, [tab]);
  useEffect(load, [load]);

  async function act(id: string, action: "approve" | "unpublish" | "delete") {
    setError(null);
    try {
      if (action === "delete") await api(`/admin/reviews/${id}`, { method: "DELETE" });
      else await api(`/admin/reviews/${id}`, { method: "PATCH", body: { approved: action === "approve" } });
      setReviews((rs) => rs?.filter((r) => r._id !== id) ?? null);
      setConfirmDelete(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Reviews" description="Approve reviews before they appear on book pages. Edited reviews come back here." />
      <div className="mb-4 inline-flex rounded-md border border-line bg-surface p-1">
        {(["pending", "published"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx("rounded px-3 py-1.5 text-sm font-medium capitalize", tab === t ? "bg-brand text-brand-ink" : "text-muted hover:text-ink")}
          >
            {t === "pending" ? "Waiting for approval" : "Published"}
          </button>
        ))}
      </div>
      <ErrorNote error={error} />
      {!reviews ? (
        <Loading />
      ) : reviews.length === 0 ? (
        <Empty>{tab === "pending" ? "Nothing waiting. All caught up." : "No published reviews yet."}</Empty>
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => (
            <Card key={r._id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-sm text-muted">{r.user?.email}</span>
                </div>
                <span className="text-sm text-muted">
                  /books/{r.bookSlug} · {dateTime(r.updatedAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{r.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tab === "pending" ? (
                  <Button onClick={() => act(r._id, "approve")}>
                    <Check /> Approve
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => act(r._id, "unpublish")}>
                    <Undo2 /> Unpublish
                  </Button>
                )}
                {confirmDelete === r._id ? (
                  <>
                    <Button variant="danger" onClick={() => act(r._id, "delete")}>
                      Yes, delete it
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                      Keep it
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => setConfirmDelete(r._id)}>
                    <Trash2 /> Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
