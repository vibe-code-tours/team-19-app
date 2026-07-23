import type { Metadata } from "next";
import SettingsPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Settings — SoulScript",
  description: "Manage your profile, appearance, and account settings.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
