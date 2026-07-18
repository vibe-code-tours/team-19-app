"use client";

import { Suspense, useRef, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useQueryClient } from "@tanstack/react-query";
import NavBar from "@/components/NavBar";
import { useReport } from "@/hooks/useReport";
import { MOOD_EMOJIS } from "@/lib/mood-themes";
import { Sparkles, Shield, TrendingUp, Brain, Heart, ArrowLeft, BarChart, Loader2, Download } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function splitInsights(text: string): string[] {
  if (text.trimStart().startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .slice(0, 3);
      }
    } catch {
      // Not valid JSON, fall through to sentence splitting
    }
  }
  const sentences = text
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.slice(0, 3);
}

function parseRecommendations(items: string[]): { title: string; description: string }[] {
  return items
    .map((item) => {
      if (item.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.title && parsed.description) {
            return { title: parsed.title, description: parsed.description };
          }
        } catch {
          // Not valid JSON, fall through
        }
      }
      return { title: item, description: "" };
    })
    .filter((r) => r.title.length > 0);
}

function getBarColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    joy: "bg-amber-400",
    sadness: "bg-blue-400",
    anger: "bg-red-400",
    fear: "bg-purple-400",
    surprise: "bg-cyan-400",
    disgust: "bg-green-400",
    calm: "bg-sky-400",
    love: "bg-pink-400",
    anxious: "bg-yellow-400",
    uncertain: "bg-slate-400",
  };
  return colorMap[emotion.toLowerCase()] || "bg-violet-400";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDominantDayMood(
  entries: { primary_emotion: string; emoji: string; created_at: string }[]
): Record<number, { emotion: string; emoji: string; count: number }> {
  const dayGroups: Record<number, Record<string, { emoji: string; count: number }>> = {};

  for (const entry of entries) {
    const day = new Date(entry.created_at).getDay();
    if (!dayGroups[day]) dayGroups[day] = {};
    const emotion = entry.primary_emotion;
    if (!dayGroups[day][emotion]) {
      dayGroups[day][emotion] = { emoji: entry.emoji, count: 0 };
    }
    dayGroups[day][emotion].count++;
  }

  const result: Record<number, { emotion: string; emoji: string; count: number }> = {};
  for (const [day, emotions] of Object.entries(dayGroups)) {
    const dayNum = Number(day);
    let maxEmotion = "";
    let maxCount = 0;
    let emoji = "";
    for (const [emotion, data] of Object.entries(emotions)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxEmotion = emotion;
        emoji = data.emoji;
      }
    }
    result[dayNum] = { emotion: maxEmotion, emoji, count: maxCount };
  }
  return result;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const reportRef = useRef<HTMLDivElement>(null);
  const generatedRef = useRef(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useReport(month);
  const stats = data?.stats;
  const report = data?.report;

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasEnoughEntries = (stats?.entryCount ?? 0) >= 10;

  // Auto-generate report on load — fire POST silently (no spinner)
  // Server returns cached:true if no new entries; only shows spinner for fresh generation
  useEffect(() => {
    if (isLoading || !hasEnoughEntries || generatedRef.current) return;
    generatedRef.current = true;

    let cancelled = false;
    async function generate() {
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month }),
        });
        if (!res.ok || cancelled) return;

        const body = await res.json();
        const raw = body.report;

        if (!body.cached) {
          // Fresh report — show spinner until data arrives
          if (!cancelled) setGenerating(true);
        }

        // Write to cache (works for both cached and fresh)
        if (raw) {
          queryClient.setQueryData(["report", month], (old: any) => ({
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
      }
    }
    generate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss generating spinner once report data arrives
  useEffect(() => {
    if (generating && data?.report) {
      setGenerating(false);
    }
  }, [generating, data?.report]);

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

  // Generating state (auto-generating report)
  if (generating) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="report" />
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <Loader2 size={32} className="text-accent animate-spin mx-auto" />
            <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
              Generating your reflection...
            </h2>
            <p className="text-sm text-text-secondary">
              AI is analyzing your journal entries. This may take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="report" />
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full">
          <div className="space-y-7">
            {/* Header skeleton */}
            <div className="text-center space-y-3 pt-2">
              <div className="skeleton w-12 h-12 rounded-3xl mx-auto" />
              <div className="skeleton h-7 w-48 mx-auto rounded-lg" />
              <div className="skeleton h-4 w-64 mx-auto rounded-lg" />
              <div className="skeleton h-3 w-40 mx-auto rounded-lg" />
            </div>
            <div className="h-px bg-white/5" />
            {/* Big picture skeleton */}
            <div className="space-y-3">
              <div className="skeleton h-3 w-32 rounded-lg" />
              <div className="glass rounded-2xl p-8 space-y-4">
                <div className="skeleton w-12 h-12 rounded-full mx-auto" />
                <div className="skeleton h-6 w-24 mx-auto rounded-lg" />
                <div className="skeleton h-4 w-64 mx-auto rounded-lg" />
              </div>
            </div>
            {/* Mood distribution skeleton */}
            <div className="space-y-3">
              <div className="skeleton h-3 w-40 rounded-lg" />
              <div className="glass rounded-2xl p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="skeleton h-4 w-20 rounded-lg" />
                      <div className="skeleton h-4 w-8 rounded-lg" />
                    </div>
                    <div className="skeleton h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="report" />
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-4xl mx-auto w-full flex items-center justify-center">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="text-4xl">😔</div>
            <h2 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
              Unable to load report
            </h2>
            <p className="text-sm text-text-secondary">
              {error.message || "Something went wrong while fetching your report."}
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

  const dominantMood = (report?.dominantMood || "uncertain").toLowerCase();
  const dominantEmoji = MOOD_EMOJIS[dominantMood] || "💭";
  const insights = report ? splitInsights(report.insights) : [];
  const recommendations = report ? parseRecommendations(report.recommendations) : [];

  // Entries for emotional rhythm (derived from mood distribution for day-of-week)
  // We use the stats' moodDistribution and streak data to show what we have
  const dayMoodData = hasEnoughEntries && report ? null : null; // Will compute from entries when available

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />

      <div className="flex-1 px-5 md:px-10 lg:px-10 pb-10 max-w-4xl mx-auto w-full">
        <div ref={reportRef} className="p-6 md:p-10 rounded-2xl">
          <div className="bg-[#0f0a1f] rounded-2xl p-6 md:p-8">
        <motion.div
          className="space-y-7"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Report Header */}
          <motion.div variants={itemVariants} className="text-center space-y-3 pt-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center">
                <Sparkles className="text-violet-300" size={24} />
              </div>
            </div>
            <h1 className="font-(family-name:--font-playfair) text-[24px] font-bold text-text-primary">
              AI Monthly Reflection ✨
            </h1>
            <p className="text-sm text-text-secondary">
              Your emotional story, gently uncovered.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
              <span>{formatMonth(month)}</span>
              <span>·</span>
              <span>{stats?.entryCount ?? 0} entries analyzed</span>
              <span>·</span>
              <span>{stats?.daysJournaled ?? 0} days journaled</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 glass rounded-full border border-glass-border">
              <Shield size={12} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">End-to-end encrypted</span>
            </div>
          </motion.div>

          {/* Glow Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          {/* TOP SECTION — Two columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
            {/* THE BIG PICTURE */}
            <motion.div variants={itemVariants} className="space-y-3">
              <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                THE BIG PICTURE
              </p>
              <div className="glass rounded-2xl p-8 text-center space-y-4 bg-gradient-to-b from-violet-500/[0.08] via-cyan-500/[0.04] to-transparent">
                <div className="text-5xl">{dominantEmoji}</div>
                <h3 className="font-(family-name:--font-playfair) text-2xl font-bold text-text-primary capitalize">
                  {dominantMood}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {report?.summary ||
                    `This month, your emotional landscape is taking shape. Keep journaling to unlock deeper insights.`}
                </p>
              </div>
            </motion.div>

            {/* EMOTIONAL LANDSCAPE */}
            <motion.div variants={itemVariants} className="space-y-3">
              <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                EMOTIONAL LANDSCAPE
              </p>
              <div className="glass rounded-2xl p-5 space-y-4">
                {stats?.moodDistribution && stats.moodDistribution.length > 0 ? (
                  stats.moodDistribution.map((item) => (
                    <div key={item.emotion} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.emoji}</span>
                          <span className="text-sm text-text-primary">{item.emotion}</span>
                        </div>
                        <span className="text-sm font-semibold text-text-primary">{item.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getBarColor(item.emotion)} rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No entries yet this month. Start journaling to see your emotional landscape.
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* BOTTOM SECTION — Two columns on desktop */}
          {hasEnoughEntries && report && (
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-start gap-5">
              {/* PATTERN RECOGNITION — Left column */}
              {insights.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                    PATTERN RECOGNITION
                  </p>
                  <div className="glass rounded-2xl p-5 space-y-5">
                    {insights.map((insight, i) => (
                      <div key={i} className="flex gap-3.5">
                        <div className="w-0.5 shrink-0 rounded-full bg-accent" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {i === 0 && <TrendingUp size={14} className="text-accent" />}
                            {i === 1 && <Brain size={14} className="text-accent" />}
                            {i === 2 && <Heart size={14} className="text-accent" />}
                            <h4 className="text-sm font-semibold text-text-primary">
                              {i === 0 ? "Trend" : i === 1 ? "Insight" : "Pattern"}
                            </h4>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* RIGHT COLUMN — Emotional Rhythm + Moment Worth Noting */}
              <div className="space-y-5">
                {/* YOUR EMOTIONAL RHYTHM */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                    YOUR EMOTIONAL RHYTHM
                  </p>
                  <div className="space-y-2.5">
                    {stats?.streak && (
                      <div className="glass rounded-xl p-4 border-l-[3px] border-l-accent">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted">Journaling Streak</p>
                            <p className="text-sm font-medium text-text-primary">
                              {stats.streak.current} day{stats.streak.current !== 1 ? "s" : ""} current
                              {stats.streak.best > 0 && ` · ${stats.streak.best} day best`}
                            </p>
                          </div>
                          <span className="text-xl">🔥</span>
                        </div>
                      </div>
                    )}
                    {stats?.moodDistribution && stats.moodDistribution.length > 0 && (
                      <div className="glass rounded-xl p-4 border-l-[3px] border-l-sky-400">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted">Dominant Emotion</p>
                            <p className="text-sm font-medium text-text-primary capitalize">
                              {dominantMood} ({stats.moodDistribution[0]?.percentage ?? 0}%)
                            </p>
                          </div>
                          <span className="text-xl">{dominantEmoji}</span>
                        </div>
                      </div>
                    )}
                    {stats?.daysJournaled !== undefined && stats.daysJournaled > 0 && (
                      <div className="glass rounded-xl p-4 border-l-[3px] border-l-pink-400">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-muted">Consistency</p>
                            <p className="text-sm font-medium text-text-primary">
                              {stats.daysJournaled} of 30 days ({Math.round((stats.daysJournaled / 30) * 100)}%)
                            </p>
                          </div>
                          <span className="text-xl"><BarChart/></span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* A MOMENT WORTH NOTING */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                    A MOMENT WORTH NOTING
                  </p>
                  <div className="glass rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span className="text-xs text-text-muted">AI Reflection</span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed italic">
                      &ldquo;{report.summary}&rdquo;
                    </p>
                    <p className="text-xs text-text-muted">
                      This month&apos;s emotional synthesis from your journal entries.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ACTIONABLE FRAMEWORKS — only when enough entries + report exists */}
          {hasEnoughEntries && report && recommendations.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
                ACTIONABLE FRAMEWORKS
              </p>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Gentle practices tailored to your emotional patterns.
              </p>
              <div className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">💡</span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-text-primary">{rec.title}</h4>
                        {rec.description && (
                          <p className="text-[13px] text-text-secondary leading-relaxed">
                            {rec.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CLOSING REFLECTION */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="glass rounded-2xl p-6 text-center space-y-3">
              <span className="text-3xl">🌙</span>
              <p className="text-sm text-text-secondary leading-relaxed italic">
                &ldquo;Your journal is more than words — it&apos;s a mirror of your inner world.
                Each entry is a step toward understanding yourself more deeply.&rdquo;
              </p>
            </div>
          </motion.div>
        </motion.div>
          </div>
        </div>

        {/* Report Actions — outside export wrapper so they are excluded from the PNG */}
        <div className="space-y-3 pt-2 flex flex-col justify-center w-fit">
          <button
            onClick={handleSavePng}
            disabled={saving}
            className="h-12 px-6 bg-accent/90 hover:bg-accent text-white text-sm font-semibold rounded-full shadow-[0_2px_8px_rgba(124,92,252,0.2)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            className="p-3 glass rounded-full text-sm font-medium text-text-secondary hover:text-text-primary border border-glass-border hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Back to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
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
