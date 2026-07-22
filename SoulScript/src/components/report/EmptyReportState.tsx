"use client";

import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface EmptyReportStateProps {
  entryCount: number;
  month: string;
  generating: boolean;
  onGenerate: () => void;
}

export default function EmptyReportState({
  entryCount,
  month,
  generating,
  onGenerate,
}: EmptyReportStateProps) {
  const router = useRouter();
  const hasEnoughEntries = entryCount >= 10;

  if (!hasEnoughEntries) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
          <div className="glass rounded-2xl p-8 text-center space-y-4 max-w-md">
            <div className="text-4xl">🌱</div>
            <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
              Not enough entries yet
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              You need at least <strong>10 journal entries</strong> this month to
              generate your AI reflection. You currently have{" "}
              <strong>{entryCount}</strong>.
            </p>
            <button
              onClick={() => router.push("/calendar")}
              className="py-2.5 px-6 glass rounded-full text-sm font-medium text-text-primary hover:text-accent border border-glass-border transition-colors"
            >
              Back to Calendar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center space-y-4 max-w-md">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center">
            <Sparkles className="text-violet-300" size={28} />
          </div>
          <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
            Ready for your reflection?
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            You have <strong>{entryCount} entries</strong> this month. Generate
            your AI-powered monthly reflection to uncover emotional patterns and
            insights.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent/90 hover:bg-accent text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
