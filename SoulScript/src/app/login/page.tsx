import type { Metadata } from "next";
import LoginPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Sign In — SoulScript",
  description: "Sign in to your SoulScript account.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
