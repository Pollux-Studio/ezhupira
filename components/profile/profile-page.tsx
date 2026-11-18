"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, LibraryBig, LogOut, MessageSquareText, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSession } from "@/components/auth/session";
import { BookCover, MallikaiText } from "@/components/book/book-parts";
import { OrderList } from "@/components/orders/order-list";
import { StatusBadge, formatDate } from "@/components/orders/order-status";
import { Bookshelf } from "@/components/profile/bookshelf";
import { MyReviews } from "@/components/profile/my-reviews";
import { SideNoise } from "@/components/side-noise";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { api, type MyReview, type Order, type ReadBook } from "@/lib/api";
import { books } from "@/lib/books";
import { cn } from "@/lib/utils";

/** Orders that count as owning the book. */
const OWNED: Order["status"][] = ["paid", "shipped", "delivered"];

const TABS = ["bookshelf", "purchased", "orders", "reviews"] as const;
type Tab = (typeof TABS)[number];

// The open tab lives in the URL hash (/profile#orders): it survives a reload, and Back
// steps through tabs. Hash changes never refetch the page.
const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
function useTab(): [Tab, (tab: Tab) => void] {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");
  const tab = (TABS as readonly string[]).includes(hash) ? (hash as Tab) : "bookshelf";
  return [tab, (next) => void (window.location.hash = next)];
}

// Tabs run down the profile card on wide screens and across it on phones.
const WIDE = "(min-width: 768px)";
const subscribeWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);

function PanelHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed bg-background/60 p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

/** A book from an order: its cover when it's on the site, otherwise a red title card. */
function PurchasedBook({ order }: { order: Order }) {
  const book = books.find((b) => b.slug === order.bookSlug);
  return (
    <li>
      <Link href={`/orders/${order.code}`} className="group flex gap-4 rounded-lg border bg-background p-3 hover:bg-muted/40">
        <div className="w-16 shrink-0 overflow-hidden rounded-sm shadow ring-1 ring-foreground/10">
          {book?.cover ? (
            <BookCover book={book} sizes="64px" />
          ) : (
            <div className="flex aspect-[5/8] items-center justify-center bg-primary p-1 text-center text-[0.6rem] font-semibold text-primary-foreground">
              {order.item.title}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="truncate font-medium group-hover:underline">
            {book ? <MallikaiText unicode={book.title} mallikai={book.titleMallikai} className="text-lg" /> : order.item.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.item.edition} · bought {formatDate(order.paidAt ?? order.createdAt)}
          </p>
          <StatusBadge status={order.status} />
        </div>
      </Link>
    </li>
  );
}

function Stat({ value, label, onClick }: { value: number | string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md px-1 py-2 text-center hover:bg-muted">
      <span className="block text-xl font-bold tabular-nums">{value}</span>
      <span className="block text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

export function ProfilePage({ releaseLabel }: { releaseLabel: string }) {
  const router = useRouter();
  const { user, signOut } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [read, setRead] = useState<ReadBook[] | null>(null);
  const [reviews, setReviews] = useState<MyReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useTab();
  const wide = useWide();

  useEffect(() => {
    if (user === null) router.replace("/login?next=/profile");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      api<{ orders: Order[] }>("/orders/mine"),
      api<{ read: ReadBook[] }>("/me/shelf"),
      api<{ reviews: MyReview[] }>("/me/reviews"),
    ]).then(
      ([o, s, r]) => {
        if (!active) return;
        setOrders(o.orders);
        setRead(s.read);
        setReviews(r.reviews);
      },
      (err: Error) => active && setError(err.message),
    );
    return () => {
      active = false;
    };
  }, [user]);

  const shelfBooks = books.filter((b) => b.status === "published");
  const owned = (orders ?? []).filter((o) => OWNED.includes(o.status));
  const readCount = read ? shelfBooks.filter((b) => read.some((r) => r.bookSlug === b.slug)).length : 0;
  const loading = !user || (!orders && !error);

  return (
    <div className="relative isolate flex flex-1 flex-col">
      {/* The site's red noise: a vertical strip down the left on wide screens, a band behind
          the profile card on phones. */}
      <SideNoise
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden md:block"
        style={{ width: "calc((100vw - min(100vw, 64rem)) / 2 + 1rem + 9rem)" }}
      />
      <SideNoise className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 md:hidden" />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        orientation={wide ? "vertical" : "horizontal"}
        render={<main />}
        className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[17rem_1fr] md:gap-12 md:py-12"
      >
        {/* Left: who you are */}
        <aside className="md:sticky md:top-24 md:self-start">
          {user ? (
            <div className="space-y-5 border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-4 md:flex-col md:items-start">
                <UserAvatar seed={user.avatarSeed} name={user.name} className="size-20 ring-4 ring-background md:size-24" />
                <div className="min-w-0 space-y-0.5">
                  <h1 className="truncate text-2xl font-bold tracking-tight">{user.name}</h1>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  {user.memberSince && (
                    <p className="text-xs text-muted-foreground">
                      Reader since {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(user.memberSince))}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 border-y py-2">
                <Stat value={loading ? "–" : readCount} label="Read" onClick={() => setTab("bookshelf")} />
                <Stat value={loading ? "–" : owned.length} label="Bought" onClick={() => setTab("purchased")} />
                <Stat value={loading ? "–" : (orders?.length ?? 0)} label="Orders" onClick={() => setTab("orders")} />
                <Stat value={loading ? "–" : (reviews?.length ?? 0)} label="Reviews" onClick={() => setTab("reviews")} />
              </div>

              <TabsList variant="line" aria-label="Profile sections" className="w-full gap-1 md:items-stretch">
                {[
                  { value: "bookshelf", label: "Bookshelf", short: "Shelf", Icon: LibraryBig },
                  { value: "purchased", label: "Purchased books", short: "Bought", Icon: ShoppingBag },
                  { value: "orders", label: "Orders", short: "Orders", Icon: Package },
                  { value: "reviews", label: "Your reviews", short: "Reviews", Icon: MessageSquareText },
                ].map(({ value, label, short, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-10 gap-2 px-3 text-sm data-active:bg-primary/10 data-active:text-primary md:h-9 md:after:bg-primary"
                  >
                    <Icon aria-hidden className="size-4" />
                    <span className="md:hidden">{short}</span>
                    <span className="max-md:hidden">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="grid gap-2">
                <Link href="/dashboard" className={buttonVariants()}>
                  Pre-order the next book
                </Link>
                <Button variant="outline" onClick={() => signOut().then(() => router.replace("/"))} className="gap-2">
                  <LogOut aria-hidden />
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96 animate-pulse border bg-muted" aria-label="Loading" />
          )}
        </aside>

        {/* Right: your books and orders */}
        <div className={cn("min-w-0 space-y-6", loading && "opacity-60")}>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <TabsContent value="bookshelf" className="space-y-4 text-base">
            <PanelHeading icon={<BookOpenCheck aria-hidden />} title="Your bookshelf" />
            {read ? (
              <Bookshelf books={shelfBooks} read={read} onChange={setRead} upcomingLabel={releaseLabel.split(" · ")[0]} />
            ) : (
              <div className="h-72 animate-pulse rounded-lg bg-muted" />
            )}
          </TabsContent>

          <TabsContent value="purchased" className="space-y-4 text-base">
            <PanelHeading icon={<ShoppingBag aria-hidden />} title="Purchased books" />
            {orders && owned.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {owned.map((o) => (
                  <PurchasedBook key={o.code} order={o} />
                ))}
              </ul>
            ) : orders ? (
              <Empty>
                Books you buy on Ezhupira appear here. Bought <MallikaiText unicode="நான் யார்?" mallikai="ehd; ahu;?" className="text-base text-foreground" /> on
                Pothi? Mark it read on your bookshelf above.
              </Empty>
            ) : (
              <div className="h-28 animate-pulse rounded-lg bg-muted" />
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 text-base">
            <PanelHeading
              icon={<Package aria-hidden />}
              title="Orders"
              action={
                <Link href="/track-order" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                  Track an order
                </Link>
              }
            />
            {orders && orders.length > 0 ? (
              <OrderList orders={orders} />
            ) : orders ? (
              <Empty>
                No orders yet.{" "}
                <Link href="/dashboard" className="font-medium text-foreground underline">
                  Pre-order the next book
                </Link>
                .
              </Empty>
            ) : (
              <div className="h-28 animate-pulse rounded-lg bg-muted" />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 text-base">
            <PanelHeading icon={<MessageSquareText aria-hidden />} title="Your reviews" />
            {reviews ? <MyReviews reviews={reviews} onChange={setReviews} /> : <div className="h-28 animate-pulse rounded-lg bg-muted" />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
