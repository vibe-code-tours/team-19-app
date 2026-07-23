"use client";

import { Suspense, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import {
  ReportHeader,
  BigPicture,
  EmotionalLandscape,
  PatternRecognition,
  EmotionalRhythm,
  MomentWorthNoting,
  ActionableFrameworks,
  ClosingReflection,
  ReportSkeleton,
  ReportError,
  EmptyReportState,
} from "@/components/report";
import NavBar from "@/components/NavBar";
import { useReport, type ReportResponse } from "@/hooks/useReport";
import { splitInsights, parseRecommendations } from "@/lib/report-utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const reportRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useReport(month);
  const stats = data?.stats;
  const report = data?.report;

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const entryCount = stats?.entryCount ?? 0;
  const hasEnoughEntries = entryCount >= 10;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) {
        setGenerating(false);
        return;
      }

      const body = await res.json();
      const raw = body.report;

      // Write to cache
      if (raw) {
        queryClient.setQueryData(["report", month], (old: ReportResponse | undefined) => ({
          stats: old?.stats ?? stats,
          report: {
            summary: raw.summary_overview,
            dominantMood: raw.dominant_mood,
            insights: raw.pattern_insights,
            recommendations: raw.actionable_recommendations,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  }, [month, queryClient, stats]);

  // Save report as PNG
  const handleSavePng = useCallback(async () => {
    if (!reportRef.current || saving) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: "#0f0a1f",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `soulscript-reflection-${month}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to save PNG:", err);
    } finally {
      setSaving(false);
    }
  }, [month, saving]);

  // Loading skeleton
  if (isLoading) {
    return <ReportSkeleton />;
  }

  // Error state
  if (error) {
    return <ReportError message={error.message} />;
  }

  // No report exists — show empty state
  if (!report) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="report" />
        <EmptyReportState
          entryCount={entryCount}
          month={month}
          generating={generating}
          onGenerate={handleGenerate}
        />
      </div>
    );
  }

  const dominantMood = (report?.dominantMood || "uncertain").toLowerCase();
  const insights = report ? splitInsights(report.insights) : [];
  const recommendations = report ? parseRecommendations(report.recommendations) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />

      <div className="flex-1 px-5 md:px-10 lg:px-10 pb-10 max-w-5xl mx-auto w-full">
        <div ref={reportRef} className="p-6 md:p-10 rounded-2xl">
          <div className="bg-background rounded-2xl p-6 md:p-8">
            <motion.div
              className="space-y-7"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <ReportHeader
                month={month}
                entryCount={entryCount}
                daysJournaled={stats?.daysJournaled ?? 0}
              />

              {/* Glow Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

              {/* TOP SECTION — Two columns on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
                <BigPicture dominantMood={dominantMood} summary={report?.summary ?? null} />
                <EmotionalLandscape
                  moodDistribution={stats?.moodDistribution ?? []}
                />
              </div>

              {/* BOTTOM SECTION — Two columns on desktop */}
              {hasEnoughEntries && report && (
                <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
                  <PatternRecognition insights={insights} />

                  <div className="space-y-5">
                    <EmotionalRhythm
                      streak={stats?.streak ?? { current: 0, best: 0 }}
                      dominantMood={dominantMood}
                      moodDistribution={stats?.moodDistribution ?? []}
                      daysJournaled={stats?.daysJournaled ?? 0}
                    />
                    <MomentWorthNoting summary={report.summary} />
                  </div>
                </div>
              )}

              {/* ACTIONABLE FRAMEWORKS */}
              {hasEnoughEntries && report && (
                <ActionableFrameworks recommendations={recommendations} />
              )}

              {/* CLOSING REFLECTION */}
              <ClosingReflection />
            </motion.div>
          </div>
        </div>

        {/* Report Actions — outside export wrapper so they are excluded from the PNG */}
        <div className="space-y-3 p-6 md:p-10 lg:p-0 lg:pt-2 lg:w-3/10 lg:mx-auto">
          {/* Generate fresh report button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-12 px-6 bg-accent/90 hover:bg-accent text-white text-sm font-semibold rounded-full shadow-[0_2px_8px_rgba(124,92,252,0.2)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating fresh report...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Fresh Report</span>
              </>
            )}
          </button>
          <button
            onClick={handleSavePng}
            disabled={saving}
            className="w-full h-12 px-6 bg-accent/90 hover:bg-accent text-white text-sm font-semibold rounded-full shadow-[0_2px_8px_rgba(124,92,252,0.2)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving reflection...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Save Reflection</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.push("/calendar")}
            className="w-full p-3 glass rounded-full text-sm font-medium text-text-secondary hover:text-text-primary border border-glass-border hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Back to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="skeleton h-10 w-48 rounded-lg" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
