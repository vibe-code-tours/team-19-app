"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import StatCards from "./StatCards";
import CalendarGrid from "./CalendarGrid";
import RecentEntries from "./RecentEntries";
import MoodTrend from "./MoodTrend";
import { useCalendar } from "@/hooks/useCalendar";
import type { JournalEntry } from "@/lib/types";

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
      <p className="text-sm text-text-primary leading-relaxed">{entry.content}</p>
      {entry.secondary_emotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.secondary_emotions.map((emotion) => (
            <span
              key={emotion}
              className="px-2 py-0.5 glass rounded-full text-xs font-medium text-text-secondary capitalize"
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
  const {
    entries,
    loading,
    currentDate,
    year,
    month,
    daysInMonth,
    firstDay,
    stats,
    prevMonth,
    nextMonth,
    goToToday,
  } = useCalendar();

  const [selectedEntries, setSelectedEntries] = useState<JournalEntry[] | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [moodUpdateSuccess, setMoodUpdateSuccess] = useState(false);

  async function handleMoodUpdate(entryId: string, newMood: string, newEmoji: string) {
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
      // Force refetch by toggling date
      goToToday();
    }, 1500);
  }

  function handleEntryClick(entry: JournalEntry) {
    setSelectedEntries([entry]);
  }

  function handleDayClick(dayEntries: JournalEntry[]) {
    setSelectedEntries(dayEntries);
  }

  function closeModal() {
    setSelectedEntries(null);
    setEditingEntry(null);
    setShowMoodPicker(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen p-5">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="skeleton h-8 w-40 rounded-lg mx-auto" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-[14px]" />
            ))}
          </div>
          <div className="skeleton h-[400px] rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="calendar" />

      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-8 max-w-5xl mx-auto w-full space-y-5">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-heading)] text-[28px] font-bold text-text-primary tracking-[-0.8px]">
            Mood Calendar
          </h1>
          <p className="text-[15px] text-text-secondary">
            Track your emotions. Understand your journey.
          </p>
        </div>

        {/* Stat Cards */}
        <StatCards
          entryCount={stats.uniqueDays}
          streak={stats.streak}
          positivePercentage={stats.positivePercentage}
        />

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Calendar */}
          <div className="lg:flex-1">
            <CalendarGrid
              entries={entries}
              year={year}
              month={month}
              daysInMonth={daysInMonth}
              firstDay={firstDay}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onGoToToday={goToToday}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Right: Recent Entries + Mood Trend */}
          <div className="lg:w-[340px] space-y-6">
            <RecentEntries
              entries={stats.recentEntries}
              onEntryClick={handleEntryClick}
            />
            <MoodTrend
              entries={entries}
              moodDistribution={stats.moodDistribution}
              daysInMonth={daysInMonth}
            />
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-6 text-center space-y-3"
          >
            <div className="breathe mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your mood constellation awaits. Start journaling to see your emotions map.
            </p>
          </motion.div>
        )}

        {/* Generate AI Report CTA */}
        {entries.length > 0 && (
          <div className="space-y-2 text-center">
            <button
              onClick={() => router.push(`/report?month=${year}-${String(month + 1).padStart(2, '0')}`)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Generate AI Report
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p className="text-xs text-text-muted">
              AI will analyze your month and reveal emotional patterns
            </p>
          </div>
        )}
      </div>

      {/* Entry Overlay */}
      <AnimatePresence>
        {selectedEntries && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={closeModal}
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
                  closeModal();
                }
              }}
              className="glass rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-text-primary">
                  {new Date(selectedEntries[0].created_at).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </h3>
                <p className="text-sm text-text-secondary">
                  {selectedEntries.length}{" "}
                  {selectedEntries.length === 1 ? "entry" : "entries"}
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

                    {/* Mood Picker */}
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
                                    handleMoodUpdate(
                                      editingEntry.id,
                                      mood.name,
                                      mood.emoji
                                    )
                                  }
                                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                  <span className="text-xl">{mood.emoji}</span>
                                  <span className="text-xs text-text-secondary capitalize">
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
