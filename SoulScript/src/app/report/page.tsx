"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import { useReport } from "@/hooks/useReport";
import { MOOD_EMOJIS } from "@/lib/mood-themes";
import { Sparkles, Shield, TrendingUp, Brain, Heart, ArrowRight } from "lucide-react";

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

  const { data, isLoading, error } = useReport(month);
  const stats = data?.stats;
  const report = data?.report;

  const hasEnoughEntries = (stats?.entryCount ?? 0) >= 10;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="report" />
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-2xl mx-auto w-full">
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
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-2xl mx-auto w-full flex items-center justify-center">
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

  const dominantMood = report?.dominantMood || "uncertain";
  const dominantEmoji = MOOD_EMOJIS[dominantMood] || "💭";
  const insights = report ? splitInsights(report.insights) : [];
  const recommendations = report ? parseRecommendations(report.recommendations) : [];

  // Entries for emotional rhythm (derived from mood distribution for day-of-week)
  // We use the stats' moodDistribution and streak data to show what we have
  const dayMoodData = hasEnoughEntries && report ? null : null; // Will compute from entries when available

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="report" />

      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-10 max-w-2xl mx-auto w-full">
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
              <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
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

          {/* PATTERN RECOGNITION — only when enough entries + report exists */}
          {hasEnoughEntries && report && insights.length > 0 && (
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

          {/* YOUR EMOTIONAL RHYTHM — only when enough entries + report exists */}
          {hasEnoughEntries && report && (
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
                      <span className="text-xl">📊</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* A MOMENT WORTH NOTING — only when enough entries + report exists */}
          {hasEnoughEntries && report && (
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

          {/* Report Actions */}
          <motion.div variants={itemVariants} className="space-y-3 pt-2">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(88,44,255,0.35)] hover:shadow-[0_6px_24px_rgba(88,44,255,0.45)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Save Reflection
            </button>
            <button
              onClick={() => router.push("/calendar")}
              className="w-full py-3 glass rounded-full text-sm font-medium text-text-secondary hover:text-text-primary border border-glass-border transition-colors flex items-center justify-center gap-2"
            >
              Back to Calendar
              <ArrowRight size={14} />
            </button>
          </motion.div>
        </motion.div>
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
