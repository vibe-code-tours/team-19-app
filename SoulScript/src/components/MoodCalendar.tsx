"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MonthlyReport from "./MonthlyReport";
import type { JournalEntry } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function getEntriesForDay(entries: JournalEntry[], day: number): JournalEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.created_at);
    return d.getDate() === day;
  });
}

const MOOD_OPTIONS = [
  { name: "joy", emoji: "😊" },
  { name: "sadness", emoji: "😢" },
  { name: "anger", emoji: "😠" },
  { name: "fear", emoji: "😨" },
  { name: "surprise", emoji: "😲" },
  { name: "disgust", emoji: "🤢" },
  { name: "calm", emoji: "😌" },
  { name: "love", emoji: "💜" },
  { name: "anxious", emoji: "😰" },
  { name: "uncertain", emoji: "💭" },
];

function EntryCard({
  entry,
  onEditMood,
}: {
  entry: JournalEntry;
  onEditMood: () => void;
}) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {/* Entry Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xl">{entry.emoji}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary capitalize">
              {entry.primary_emotion}
            </p>
            <p className="text-xs text-text-secondary">
              {new Date(entry.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={onEditMood}
          className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-xs text-text-secondary hover:text-text-primary"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Entry Content */}
      <p className="text-[14px] text-text-primary leading-relaxed">
        {entry.content}
      </p>

      {/* Emotion Pills */}
      {entry.secondary_emotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.secondary_emotions.map((emotion) => (
            <span
              key={emotion}
              className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize"
            >
              {emotion}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoodCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<JournalEntry[] | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [moodUpdateSuccess, setMoodUpdateSuccess] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/entries?month=${monthStr}`);
      const data = await res.json();
      if (!cancelled && data.entries) {
        setEntries(data.entries);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1));
    setLoading(true);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1));
    setLoading(true);
  }

  async function handleMoodUpdate(
    entryId: string,
    newMood: string,
    newEmoji: string
  ) {
    await fetch(`/api/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_emotion: newMood, emoji: newEmoji }),
    });

    setMoodUpdateSuccess(true);
    setTimeout(() => {
      setMoodUpdateSuccess(false);
      setShowMoodPicker(false);
      setEditingEntry(null);
      // Refresh entries to show updated emoji on calendar
      setCurrentDate(new Date(currentDate));
    }, 1500);
  }

  async function handleGenerateReport() {
    if (reportLoading) return;
    setReportLoading(true);
    setReportError("");

    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthStr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "Failed to generate report");
        return;
      }

      setReport(data.report);
    } catch {
      setReportError("Something went wrong. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-5">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="skeleton h-8 w-40 rounded-lg mx-auto" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-5 pb-8 max-w-lg mx-auto w-full">
        {/* Back to Dashboard */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Journal
          </button>
          <img src="/logo-horizontal.png" alt="SoulScript" className="h-6" />
        </div>

        {/* Month Header */}
        <div className="flex items-center justify-between py-4">
          <button onClick={prevMonth} className="p-2 text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-text-primary">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 text-text-secondary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-text-muted py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEntries = getEntriesForDay(entries, day);
            const latestEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;

            return (
              <button
                key={day}
                onClick={() => dayEntries.length > 0 && setSelectedEntries(dayEntries)}
                className="aspect-square flex items-center justify-center relative"
              >
                {latestEntry ? (
                  <motion.div
                    layoutId={`entry-${latestEntry.id}`}
                    className="w-full h-full rounded-full glass flex items-center justify-center"
                  >
                    <span className="text-lg">{latestEntry.emoji}</span>
                  </motion.div>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-dashed border-glass-border" />
                )}
              </button>
            );
          })}
        </div>

        {/* Monthly Report Trigger / Loading / Error / Report */}
        {entries.length > 0 && !report && !reportLoading && !reportError && (
          <button
            onClick={handleGenerateReport}
            className="mt-6 w-full glass rounded-2xl p-5 text-center space-y-2 hover:bg-white/[0.08] transition-colors"
          >
            <span className="text-2xl">✨</span>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-text-primary">
              Reveal This Month&apos;s Journey
            </h3>
            <p className="text-sm text-text-secondary">
              {entries.length} of {daysInMonth} days journaled — tap to generate
              insights
            </p>
          </button>
        )}

        {reportLoading && (
          <div className="mt-6 space-y-4">
            <div className="skeleton h-48 w-full rounded-2xl" />
            <div className="skeleton h-32 w-full rounded-2xl" />
            <div className="skeleton h-24 w-full rounded-xl" />
          </div>
        )}

        {reportError && (
          <div className="mt-6 glass rounded-2xl p-5 text-center space-y-3">
            <p className="text-sm text-red-400">{reportError}</p>
            <button
              onClick={handleGenerateReport}
              className="text-sm font-medium text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {report && (
          <div className="mt-6">
            <MonthlyReport
              report={report as never}
              entryCount={entries.length}
              daysInMonth={daysInMonth}
            />
          </div>
        )}

        {/* Empty State — breathing glassmorphism overlay */}
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 glass-strong rounded-2xl p-6 text-center space-y-3"
          >
            <div className="breathe mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your mood constellation awaits. Start journaling to see your
              emotions map.
            </p>
          </motion.div>
        )}
      </div>

      {/* Entry Overlay — Bottom Sheet with scrollable entry list */}
      <AnimatePresence>
        {selectedEntries && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => {
              setSelectedEntries(null);
              setEditingEntry(null);
              setShowMoodPicker(false);
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setSelectedEntries(null);
                  setEditingEntry(null);
                  setShowMoodPicker(false);
                }
              }}
              className="glass rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-text-primary">
                  {new Date(selectedEntries[0].created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm text-text-secondary">
                  {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              <div className="h-px bg-glass-border mb-4" />

              {/* Scrollable Entry List */}
              <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
                {selectedEntries.map((entry) => (
                  <div key={entry.id}>
                    <EntryCard
                      entry={entry}
                      onEditMood={() => {
                        setEditingEntry(entry);
                        setShowMoodPicker(true);
                      }}
                    />

                    {/* Mood Picker — slides in below the entry being edited */}
                    <AnimatePresence>
                      {showMoodPicker && editingEntry?.id === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {moodUpdateSuccess ? (
                            <p className="text-center text-sm text-green-400 py-3">
                              Mood updated ✓
                            </p>
                          ) : (
                            <div className="grid grid-cols-5 gap-2 pt-2 mt-2">
                              {MOOD_OPTIONS.map((mood) => (
                                <button
                                  key={mood.name}
                                  onClick={() =>
                                    handleMoodUpdate(editingEntry.id, mood.name, mood.emoji)
                                  }
                                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                  <span className="text-xl">{mood.emoji}</span>
                                  <span className="text-[10px] text-text-secondary capitalize">
                                    {mood.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
