import type { Metadata } from "next";
import ReportPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Monthly Report — SoulScript",
  description: "AI-powered insights and patterns from your journal entries this month.",
};

export default function ReportPage() {
  return <ReportPageClient />;
}
