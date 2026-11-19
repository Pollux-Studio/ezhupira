import { revalidateTag } from "next/cache";

// Called by the API after a book is added or edited in the admin, so the change shows on the
// next visit instead of after the 60-second cache. Needs REVALIDATE_SECRET set here (Vercel)
// and on the API (Render) to the same value.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag("books", { expire: 0 });
  return Response.json({ revalidated: true });
}
