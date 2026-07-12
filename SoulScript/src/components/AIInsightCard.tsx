"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AIInsightCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadInsight() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date(Date.now() - 7 * 86400000);

      const { data: entries } = await supabase
        .from("journal_entries")
        .select("primary_emotion, created_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!entries || entries.length === 0) {
        setInsight(
          "Start journaling to receive personalized insights about your emotional patterns."
        );
        return;
      }

      const emotionCounts: Record<string, number> = {};
      const hourCounts: Record<number, number> = {};

      for (const entry of entries) {
        emotionCounts[entry.primary_emotion] =
          (emotionCounts[entry.primary_emotion] || 0) + 1;
        const hour = new Date(entry.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      const dominant = Object.entries(emotionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      const peakHour = Object.entries(hourCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      let timeOfDay = "during the day";
      if (peakHour) {
        const hour = parseInt(peakHour[0]);
        if (hour < 12) timeOfDay = "in the morning";
        else if (hour < 17) timeOfDay = "in the afternoon";
        else timeOfDay = "in the evening";
      }

      const moodWord = dominant ? dominant[0] : "reflective";
      setInsight(
        `You've been feeling more ${moodWord} this week. You tend to journal most ${timeOfDay}.`
      );
    }
    loadInsight();
  }, [supabase]);

  return (
    <div className="rounded-2xl glass p-5 sm:p-6 lg:p-7">
      <div className="mb-4 flex items-center justify-between">
        {/* Cosmic Orb */}
        <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-accent-glow to-transparent opacity-60 blur-xl" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-accent via-accent-glow to-transparent opacity-80" />
        </div>

        {/* Title */}
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary sm:text-base">
            AI Insight Preview
          </p>
          <span className="text-sm">✨</span>
        </div>
      </div>

      {/* Insight Text */}
      <p className="mb-5 text-sm leading-relaxed text-text-secondary sm:text-[15px]">
        {insight || "Loading insight..."}
      </p>

      {/* CTA Button */}
      <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-glow">
        View Insights →
      </button>
    </div>
  );
}
