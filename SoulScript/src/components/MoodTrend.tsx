"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { JournalEntry } from "@/lib/types";

const MOOD_BAR_COLORS: Record<string, string> = {
  joy: "#F59E0B",
  calm: "#0EA5E9",
  love: "#EC4899",
  sadness: "#3B82F6",
  anger: "#EF4444",
  fear: "#8B5CF6",
  surprise: "#22D3EE",
  anxious: "#EAB308",
  uncertain: "#475569",
  disgust: "#10B981",
};

interface MoodTrendProps {
  entries: JournalEntry[];
  moodDistribution: { emotion: string; emoji: string; count: number; percentage: number }[];
  daysInMonth: number;
}

interface DayBar {
  day: number;
  emotion: string;
  emoji: string;
  color: string;
  entryCount: number;
  heightPercent: number;
}

export default function MoodTrend({ entries, moodDistribution, daysInMonth }: MoodTrendProps) {
  const dailyMoods = useMemo<DayBar[]>(() => {
    // Count entries per day
    const dayCounts = new Map<number, number>();
    const dayLatest = new Map<number, JournalEntry>();

    for (const entry of entries) {
      const day = new Date(entry.created_at).getDate();
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      // Keep the latest entry per day
      const existing = dayLatest.get(day);
      if (!existing || new Date(entry.created_at) > new Date(existing.created_at)) {
        dayLatest.set(day, entry);
      }
    }

    const maxCount = Math.max(1, ...Array.from(dayCounts.values()));

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const count = dayCounts.get(day) || 0;
      const latest = dayLatest.get(day);

      if (latest) {
        return {
          day,
          emotion: latest.primary_emotion,
          emoji: latest.emoji,
          color: MOOD_BAR_COLORS[latest.primary_emotion] || "#7C5CFC",
          entryCount: count,
          // Min 30% height, scale to 100% based on relative count
          heightPercent: 30 + (count / maxCount) * 70,
        };
      }

      return { day, emotion: "", emoji: "", color: "transparent", entryCount: 0, heightPercent: 0 };
    });
  }, [entries, daysInMonth]);

  const topEmotions = moodDistribution.slice(0, 3);

  // Day labels: show every 5th day + last day for compact display
  const labelInterval = daysInMonth > 28 ? 7 : 5;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
          Mood Trend
        </h3>
        <p className="text-xs text-text-secondary">
          Your emotional flow this month
        </p>
      </div>

      {/* Chart Card */}
      <div className="glass rounded-2xl p-4 space-y-3 border border-white/[0.04]">
        {/* Bar Chart */}
        <div className="flex items-end gap-[3px] h-[200px] overflow-visible">
          {dailyMoods.map((d, i) => (
            <motion.div
              key={d.day}
              initial={{ height: 0 }}
              animate={{ height: `${d.heightPercent || 8}%` }}
              transition={{ delay: i * 0.015, duration: 0.4, ease: "easeOut" }}
              className="flex-1 rounded-t-sm relative group cursor-default hover:brightness-125 hover:z-10 transition-[filter] duration-150"
              style={{
                backgroundColor: d.emotion ? `${d.color}` : "rgba(255,255,255)",
              }}
            >
              {/* Hover tooltip */}
              {d.emotion && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-[#1a1530] border border-white/10 text-[10px] text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-100 shadow-lg">
                  <span className="mr-1">{d.emoji}</span>
                  <span className="capitalize text-white">{d.emotion}</span>
                  <span className="text-text-muted ml-1">· Day {d.day}</span>
                  {d.entryCount > 1 && (
                    <span className="text-text-muted ml-1">({d.entryCount})</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Day Labels */}
        <div className="flex items-center">
          {dailyMoods.map((d) => (
            <div key={d.day} className="flex-1 text-center">
              {(d.day === 1 || (d.day - 1) % labelInterval === 0 || d.day === daysInMonth) ? (
                <span className="text-[8px] text-text-muted font-[family-name:var(--font-caption)]">
                  {d.day}
                </span>
              ) : (
                <span className="text-[8px]">&nbsp;</span>
              )}
            </div>
          ))}
        </div>

        {/* Legend + Most Common */}
        <div className="pt-2 border-t border-white/[0.04] space-y-2">
          {/* Color legend for top 3 */}
          {/* {topEmotions.length > 0 && (
            <div className="flex items-center gap-3">
              {topEmotions.map((e) => (
                <div key={e.emotion} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: MOOD_BAR_COLORS[e.emotion] || "#7C5CFC" }}
                  />
                  <span className="text-[10px] text-text-muted capitalize">{e.emotion}</span>
                </div>
              ))}
            </div>
          )} */}

          {/* Most Common Highlight */}
          {topEmotions[0] && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{topEmotions[0].emoji}</span>
                <span className="text-xs text-text-muted capitalize">
                  {topEmotions[0].emotion} most frequent
                </span>
              </div>
              <span className="text-lg font-bold text-accent font-[family-name:var(--font-caption)]">
                {topEmotions[0].percentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
