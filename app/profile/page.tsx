import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/profile-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RELEASE_LABEL } from "@/lib/release";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default function Profile() {
  return (
    <>
      <SiteHeader />
      <ProfilePage releaseLabel={RELEASE_LABEL} />
      <SiteFooter />
    </>
  );
}
