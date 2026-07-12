"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOOD_EMOJIS } from "@/lib/mood-themes";

interface Stats {
  streak: number;
  entryCount: number;
  dominantMood: string;
  dominantEmoji: string;
}

function calculateStreak(
  dates: string[]
): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);
    const diffDays =
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function StatsRow() {
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    entryCount: 0,
    dominantMood: "Calm",
    dominantEmoji: "😌",
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: entries } = await supabase
        .from("journal_entries")
        .select("created_at, primary_emotion, emoji")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("created_at", monthStart.toISOString())
        .order("created_at", { ascending: false });

      if (!entries || entries.length === 0) return;

      const streak = calculateStreak(entries.map((e) => e.created_at));

      const emotionCounts: Record<string, number> = {};
      for (const entry of entries) {
        emotionCounts[entry.primary_emotion] =
          (emotionCounts[entry.primary_emotion] || 0) + 1;
      }
      const dominant = Object.entries(emotionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      setStats({
        streak,
        entryCount: entries.length,
        dominantMood: dominant
          ? dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)
          : "Calm",
        dominantEmoji: dominant ? MOOD_EMOJIS[dominant[0]] || "😌" : "😌",
      });
    }
    loadStats();
  }, [supabase]);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {/* Streak Card */}
        <div className="flex flex-col items-center gap-1 rounded-xl glass p-3.5 sm:p-4 lg:p-5">
          <svg
            className="h-5 w-5 text-accent sm:h-[22px] sm:w-[22px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
            />
          </svg>
          <span className="text-lg font-bold text-text-primary sm:text-xl lg:text-2xl">
            {stats.streak}
          </span>
          <span className="text-[11px] text-text-muted">day streak</span>
        </div>

        {/* Entries Card */}
        <div className="flex flex-col items-center gap-1 rounded-xl glass p-3.5 sm:p-4 lg:p-5">
          <svg
            className="h-5 w-5 text-accent sm:h-[22px] sm:w-[22px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <span className="text-lg font-bold text-text-primary sm:text-xl lg:text-2xl">
            {stats.entryCount}
          </span>
          <span className="text-[11px] text-text-muted">{monthName}</span>
        </div>

        {/* Mood Card */}
        <div className="flex flex-col items-center gap-1 rounded-xl glass p-3.5 sm:p-4 lg:p-5">
          <span className="text-lg sm:text-xl">{stats.dominantEmoji}</span>
          <span className="text-base font-bold text-text-primary sm:text-lg">
            {stats.dominantMood}
          </span>
          <span className="text-[11px] text-text-muted">dominant mood</span>
        </div>
      </div>

      <p className="text-center text-xs text-text-muted">
        keep going, you are doing great ✨
      </p>
    </div>
  );
}
