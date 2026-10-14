import type { Metadata } from "next";
import { TamilTypeGarden } from "@/components/type-garden/tamil-type-garden";

export const metadata: Metadata = {
  title: "Tamil Type Garden | Ezhupira",
  description:
    "An interactive Tamil Type Garden built with Mallikai, where letters grow stems, leaves, and flowers.",
};

export default function TypeGardenPage() {
  return <TamilTypeGarden />;
}
