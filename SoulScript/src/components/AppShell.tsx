"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";
import Footer from "./Footer";

const authRoutes = ["/login", "/signup", "/auth/callback"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
