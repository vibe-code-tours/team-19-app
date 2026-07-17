"use client";

import { motion } from "framer-motion";
import type { JournalEntry } from "@/lib/types";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MOOD_COLORS: Record<string, string> = {
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

const LEGEND_ITEMS = [
  { emotion: "Joy", color: "#22D3EE" },
  { emotion: "Calm", color: "#A78BFA" },
  { emotion: "Love", color: "#EC4899" },
  { emotion: "Neutral", color: "#F59E0B" },
  { emotion: "Sad", color: "#3B82F6" },
  { emotion: "Angry", color: "#EF4444" },
];

function getEntriesForDay(entries: JournalEntry[], day: number): JournalEntry[] {
  return entries.filter((e) => new Date(e.created_at).getDate() === day);
}

interface CalendarGridProps {
  entries: JournalEntry[];
  year: number;
  month: number;
  daysInMonth: number;
  firstDay: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onDayClick: (entries: JournalEntry[]) => void;
}

export default function CalendarGrid({
  entries,
  year,
  month,
  daysInMonth,
  firstDay,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="glass rounded-[20px] p-5 space-y-3 border border-[#332867] shadow-[0_24px_24px_rgba(124,92,252,0.07),0_8px_8px_rgba(0,0,0,0.19)]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-16 bg-white/[0.05] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary tracking-tight">
            {MONTHS[month]} {year}
          </h2>
        </div>

        <button
          onClick={onGoToToday}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-text-primary hover:bg-white/[0.08] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-accent" />
          Today
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-white/[0.04]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-[11px] font-semibold text-text-muted tracking-[1.5px]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEntries = getEntriesForDay(entries, day);
          const latestEntry =
            dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <button
              key={day}
              onClick={() => dayEntries.length > 0 && onDayClick(dayEntries)}
              className="aspect-square flex flex-col items-center justify-center gap-0.5 relative"
            >
              {latestEntry ? (
                <motion.div
                  layoutId={`entry-${latestEntry.id}`}
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center gap-0.5 ${
                    isToday
                      ? "bg-gradient-to-b from-accent/20 to-accent/8 border border-accent shadow-[0_0_12px_rgba(124,92,252,0.3)]"
                      : ""
                  }`}
                  style={{
                    boxShadow: isToday
                      ? undefined
                      : `0 0 6px ${MOOD_COLORS[latestEntry.primary_emotion] || "#7C5CFC"}20`,
                  }}
                >
                  <span className="text-[10px] text-text-secondary font-medium leading-none">
                    {day}
                  </span>
                  <span className="text-sm leading-none">{latestEntry.emoji}</span>
                </motion.div>
              ) : (
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs text-text-muted ${
                    isToday
                      ? "bg-accent/10 border border-accent/50 text-accent font-semibold"
                      : "border border-dashed border-white/[0.07]"
                  }`}
                >
                  {day}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mood Legend */}
      <div className="border-t border-white/[0.04] pt-3">
        <div className="flex items-center justify-around">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.emotion} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-text-muted font-medium">
                {item.emotion}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
