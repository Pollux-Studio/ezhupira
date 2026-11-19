// Tells the website to drop its cached catalogue after a book changes in the admin, so the
// change shows on the next visit (otherwise it appears within the website's 60-second cache).
import { env } from "../env.js";

export async function revalidateWebsite() {
  if (!env.REVALIDATE_SECRET) return;
  try {
    const res = await fetch(`${env.SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": env.REVALIDATE_SECRET },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`Website revalidate returned ${res.status}`);
  } catch (err) {
    console.warn("Website revalidate failed:", (err as Error).message);
  }
}
