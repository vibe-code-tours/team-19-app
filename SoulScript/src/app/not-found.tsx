import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-72 rounded-full bg-slate-700/20 blur-3xl" />
        </div>

        {/* Card */}
        <div className="relative glass rounded-2xl p-10 text-center space-y-5 max-w-xs">
          <div className="flex justify-center">
            <img src="/logo-icon.png" alt="SoulScript" className="w-16 h-16" />
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-text-primary">
            Lost in the sanctuary?
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed">
            This page doesn&apos;t exist. Let&apos;s guide you back.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-glow transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
