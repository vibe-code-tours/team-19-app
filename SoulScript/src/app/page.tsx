import type { Metadata } from "next";
import DashboardPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Dashboard — SoulScript",
  description:
    "Write your daily journal entry, track your mood, and reflect.",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
