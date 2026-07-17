"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

interface CalendarStats {
  uniqueDays: number;
  streak: number;
  positivePercentage: number;
  moodDistribution: { emotion: string; emoji: string; count: number; percentage: number }[];
  recentEntries: JournalEntry[];
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function computeStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const daySet = new Set(
    entries.map((e) => {
      const d = new Date(e.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

const POSITIVE_EMOTIONS = new Set(["joy", "calm", "love", "surprise"]);

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = getMonthKey(currentDate);

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["entries", "month", monthKey],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/entries?month=${monthKey}`);
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      return data.entries || [];
    },
  });

  const stats = useMemo<CalendarStats>(() => {
    const daySet = new Set(
      entries.map((e) => new Date(e.created_at).getDate())
    );
    const uniqueDays = daySet.size;

    const streak = computeStreak(entries);

    const positiveCount = entries.filter((e) =>
      POSITIVE_EMOTIONS.has(e.primary_emotion)
    ).length;
    const positivePercentage =
      entries.length > 0 ? Math.round((positiveCount / entries.length) * 100) : 0;

    // Mood distribution
    const emotionMap = new Map<string, { emoji: string; count: number }>();
    for (const e of entries) {
      const existing = emotionMap.get(e.primary_emotion);
      if (existing) {
        existing.count++;
      } else {
        emotionMap.set(e.primary_emotion, { emoji: e.emoji, count: 1 });
      }
    }
    const moodDistribution = Array.from(emotionMap.entries())
      .map(([emotion, { emoji, count }]) => ({
        emotion,
        emoji,
        count,
        percentage: Math.round((count / entries.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const recentEntries = [...entries]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 3);

    return { uniqueDays, streak, positivePercentage, moodDistribution, recentEntries };
  }, [entries]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return {
    entries,
    loading: isLoading,
    currentDate,
    year,
    month,
    daysInMonth: getDaysInMonth(year, month),
    firstDay: getFirstDayOfMonth(year, month),
    stats,
    prevMonth,
    nextMonth,
    goToToday,
  };
}
