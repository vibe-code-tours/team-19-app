import type { Metadata } from "next";
import SignupPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Create Account — SoulScript",
  description: "Create your private, encrypted journal.",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
