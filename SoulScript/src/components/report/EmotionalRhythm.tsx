"use client";

import { motion } from "framer-motion";
import { BarChart } from "lucide-react";
import { MOOD_EMOJIS } from "@/lib/mood-themes";
import type { MoodDistributionItem, StreakResult } from "@/lib/report-stats";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface EmotionalRhythmProps {
  streak: StreakResult;
  dominantMood: string;
  moodDistribution: MoodDistributionItem[];
  daysJournaled: number;
}

export default function EmotionalRhythm({
  streak,
  dominantMood,
  moodDistribution,
  daysJournaled,
}: EmotionalRhythmProps) {
  const mood = dominantMood.toLowerCase();
  const emoji = MOOD_EMOJIS[mood] || "💭";

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        YOUR EMOTIONAL RHYTHM
      </p>
      <div className="space-y-2.5">
        {streak && (
          <div className="glass rounded-xl p-4 border-l-[3px] border-l-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Journaling Streak</p>
                <p className="text-sm font-medium text-text-primary">
                  {streak.current} day{streak.current !== 1 ? "s" : ""} current
                  {streak.best > 0 && ` · ${streak.best} day best`}
                </p>
              </div>
              <span className="text-xl">🔥</span>
            </div>
          </div>
        )}
        {moodDistribution.length > 0 && (
          <div className="glass rounded-xl p-4 border-l-[3px] border-l-sky-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Dominant Emotion</p>
                <p className="text-sm font-medium text-text-primary capitalize">
                  {mood} ({moodDistribution[0]?.percentage ?? 0}%)
                </p>
              </div>
              <span className="text-xl">{emoji}</span>
            </div>
          </div>
        )}
        {daysJournaled > 0 && (
          <div className="glass rounded-xl p-4 border-l-[3px] border-l-pink-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Consistency</p>
                <p className="text-sm font-medium text-text-primary">
                  {daysJournaled} of 30 days (
                  {Math.round((daysJournaled / 30) * 100)}%)
                </p>
              </div>
              <span className="text-xl">
                <BarChart />
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
