import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Card */}
        <div className="relative glass rounded-[20px] p-10 text-center space-y-5 max-w-xs">
          {/* 404 Badge */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
              <span className="text-2xl">🌙</span>
            </div>
          </div>

          <p className="text-xs font-semibold tracking-wider text-accent">
            4 0 4
          </p>

          <h1 className="font-(family-name:--font-playfair) text-[22px] font-bold text-text-primary leading-tight">
            This page wandered off.
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed">
            The place you&apos;re looking for isn&apos;t here, but your journal is waiting.
          </p>

          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(88,44,255,0.35)] hover:shadow-[0_6px_24px_rgba(88,44,255,0.45)] transition-all text-sm"
            >
              ← Back to journal
            </Link>
            <p className="text-xs text-text-muted">
              Return to a familiar page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
