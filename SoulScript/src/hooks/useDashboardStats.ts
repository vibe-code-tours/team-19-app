"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface DayMood {
  dayLabel: string;
  emoji: string | null;
  isToday: boolean;
}

interface DashboardStats {
  streak: number;
  monthEntryCount: number;
  lastMood: { emotion: string; emoji: string } | null;
  last7Days: DayMood[];
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function computeStreak(entryDates: string[]): number {
  if (entryDates.length === 0) return 0;

  // Build set of local day keys — use UTC boundaries to map each timestamp to its local date
  const daySet = new Set(
    entryDates.map((iso) => {
      const t = new Date(iso).getTime();
      // Find which local day this UTC timestamp falls into
      const local = new Date(t);
      return `${local.getFullYear()}-${local.getMonth()}-${local.getDate()}`;
    })
  );

  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i++) {
    const check = new Date(now);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    if (daySet.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function useDashboardStats() {
  const monthKey = getMonthKey();

  const { data: entries = [], isLoading } = useQuery<{
    id: string;
    primary_emotion: string;
    emoji: string;
    created_at: string;
  }[]>({
    queryKey: ["entries", "month", monthKey],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/entries?month=${monthKey}`);
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      return data.entries || [];
    },
  });

  const stats = useMemo<DashboardStats>(() => {
    if (entries.length === 0) {
      return { streak: 0, monthEntryCount: 0, lastMood: null, last7Days: [] };
    }

    const streak = computeStreak(entries.map((e) => e.created_at));

    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const last = sorted[0];

    // Build last 7 days using UTC day boundaries (matches useTodayEntries pattern)
    const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const last7Days: DayMood[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      // Compute UTC boundaries for this local day
      const dayStart = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
      const dayEnd = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      );
      const startMs = dayStart.getTime();
      const endMs = dayEnd.getTime();

      // Find latest entry whose timestamp falls within this local day
      const dayEntry = sorted.find((e) => {
        const t = new Date(e.created_at).getTime();
        return t >= startMs && t < endMs;
      });

      last7Days.push({
        dayLabel: WEEKDAY_SHORT[d.getDay()],
        emoji: dayEntry?.emoji || null,
        isToday: i === 0,
      });
    }

    return {
      streak,
      monthEntryCount: entries.length,
      lastMood: {
        emotion: last.primary_emotion,
        emoji: last.emoji || "💭",
      },
      last7Days,
    };
  }, [entries]);

  return { stats, isLoading };
}
