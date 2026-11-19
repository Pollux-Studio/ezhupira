import { getBooks } from "@/lib/catalog";
import { llmsFullTxt } from "@/lib/llms";

export const revalidate = 60;

export async function GET() {
  return new Response(llmsFullTxt(await getBooks()), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
