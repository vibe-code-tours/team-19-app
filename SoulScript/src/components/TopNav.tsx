"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Calendar", href: "/calendar" },
  { label: "Report", href: "/report" },
  { label: "Settings", href: "/settings" },
];

export default function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function navigate(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0B0F19]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 items-center justify-between px-5 sm:h-15 sm:px-8 lg:h-16 lg:px-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="font-[family-name:var(--font-playfair)] text-base font-bold text-text-primary sm:text-lg">
            SoulScript
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className={`relative py-1 text-sm transition-colors ${
                  isActive
                    ? "font-semibold text-accent"
                    : "font-medium text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 rounded bg-text-secondary transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 rounded bg-text-secondary transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 rounded bg-text-secondary transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="border-t border-white/[0.06] bg-[#0B0F19]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "font-semibold text-accent"
                        : "font-normal text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {isActive && (
                      <span className="h-4 w-0.5 rounded-full bg-accent" />
                    )}
                    <span className={isActive ? "" : "ml-3.5"}>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
