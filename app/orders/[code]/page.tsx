import type { Metadata } from "next";
import { OrderDetails } from "@/components/orders/order-details";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageNoise, TOP_NOISE_OFFSET } from "@/components/page-noise";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

// Cashfree sends customers back here after paying: /orders/EZH-1001
export default async function OrderPage({ params }: PageProps<"/orders/[code]">) {
  const { code } = await params;
  return (
    <>
      <SiteHeader />
      <div className="relative isolate flex flex-1 flex-col">
        <PageNoise variant="top" />
        <main className={`mx-auto w-full max-w-xl flex-1 px-4 pb-16 ${TOP_NOISE_OFFSET}`}>
          <OrderDetails code={decodeURIComponent(code)} />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
