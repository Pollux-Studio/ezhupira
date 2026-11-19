import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/profile-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBooks } from "@/lib/catalog";
import { releaseLabel } from "@/lib/release";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function Profile() {
  const books = await getBooks();
  const upcoming = books.find((b) => b.status === "upcoming");
  return (
    <>
      <SiteHeader />
      <ProfilePage releaseLabel={releaseLabel(upcoming?.releaseAt)} books={books} />
      <SiteFooter />
    </>
  );
}
