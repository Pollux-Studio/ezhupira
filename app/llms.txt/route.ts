import { getBooks } from "@/lib/catalog";
import { llmsTxt } from "@/lib/llms";

export const revalidate = 60;

export async function GET() {
  return new Response(llmsTxt(await getBooks()), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
