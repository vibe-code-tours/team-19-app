"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "@/components/NavBar";
import DailyEntryTracker from "@/components/DailyEntryTracker";
import { useTodayEntries } from "@/hooks/useTodayEntries";
import { useCreateEntry } from "@/hooks/useCreateEntry";
import { useDeleteEntry } from "@/hooks/useDeleteEntry";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;
const WARN_LENGTH = 4500;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    entryId: string;
    countdown: number;
  } | null>(null);
  const [savedDraft, setSavedDraft] = useState("");
  const [error, setError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { data: todayEntries = [], isLoading: entriesLoading } =
    useTodayEntries();
  const createEntry = useCreateEntry();
  const deleteEntry = useDeleteEntry();
  const { stats } = useDashboardStats();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      setUserName(
        profile?.display_name || user.email?.split("@")[0] || "Friend"
      );
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  useEffect(() => {
    if (!toast || toast.countdown <= 0) return;
    const timer = setTimeout(() => {
      setToast((prev) => {
        if (!prev || prev.countdown <= 1) return null;
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toast && savedDraft) {
      const timer = setTimeout(() => {
        setSavedDraft("");
        setContent("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [toast, savedDraft]);

  const handleSubmit = useCallback(async () => {
    if (content.length < MIN_LENGTH || createEntry.isPending) return;
    setError("");
    setToast(null);
    setSavedDraft("");

    try {
      const entry = await createEntry.mutateAsync({
        content: content.slice(0, MAX_LENGTH),
      });
      setSavedDraft(content);
      setJustSubmitted(true);
      setToast({ entryId: entry.id, countdown: 4 });
      setContent("");
      setTimeout(() => setJustSubmitted(false), 600);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }, [content, createEntry]);

  async function handleUndo() {
    if (!toast) return;
    try {
      await deleteEntry.mutateAsync(toast.entryId);
    } catch {
      // Optimistic rollback already handled by useDeleteEntry
    }
    setContent(savedDraft);
    setSavedDraft("");
    setToast(null);
  }

  const charCount = content.length;
  const isOverWarn = charCount >= WARN_LENGTH;
  const isOverMax = charCount >= MAX_LENGTH;
  const canSubmit = charCount >= MIN_LENGTH && !createEntry.isPending;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar active="dashboard" />
        <div className="flex-1 px-5 md:px-10 lg:px-20 pb-8 max-w-5xl mx-auto w-full">
          {/* Mobile skeleton */}
          <div className="lg:hidden space-y-7">
            <div className="space-y-2 pt-2">
              <div className="skeleton h-9 w-3/4 rounded-lg" />
              <div className="skeleton h-5 w-1/2 rounded-lg" />
            </div>
            <div className="glass rounded-[20px] p-4 space-y-3.5">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-24 rounded-lg" />
                <div className="skeleton h-3 w-32 rounded-lg" />
              </div>
              <div className="skeleton h-40 w-full rounded-xl" />
              <div className="flex justify-end">
                <div className="skeleton h-3 w-20 rounded-lg" />
              </div>
              <div className="flex justify-center">
                <div className="skeleton h-11 w-48 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-[14px] p-3 space-y-1.5">
                  <div className="skeleton h-4 w-4 rounded-full mx-auto" />
                  <div className="skeleton h-3 w-16 rounded-lg mx-auto" />
                  <div className="skeleton h-5 w-12 rounded-lg mx-auto" />
                </div>
              ))}
            </div>
            <div className="glass rounded-[20px] p-4 space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="skeleton w-14 h-14 rounded-[28px] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-28 rounded-lg" />
                  <div className="skeleton h-4 w-full rounded-lg" />
                  <div className="skeleton h-3 w-24 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="glass rounded-[20px] p-4 space-y-3">
              <div className="space-y-1">
                <div className="skeleton h-3 w-32 rounded-lg" />
                <div className="skeleton h-3 w-48 rounded-lg" />
              </div>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="skeleton h-2.5 w-5 rounded-lg" />
                    <div className="skeleton w-8 h-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop skeleton */}
          <div className="hidden lg:block pt-2">
            <div className="space-y-2 mb-6">
              <div className="skeleton h-9 w-3/4 rounded-lg" />
              <div className="skeleton h-5 w-1/2 rounded-lg" />
            </div>
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">
                <div className="glass rounded-[20px] p-5 space-y-4">
                  <div className="flex justify-between">
                    <div className="skeleton h-4 w-24 rounded-lg" />
                    <div className="skeleton h-3 w-32 rounded-lg" />
                  </div>
                  <div className="skeleton h-60 w-full rounded-xl" />
                  <div className="flex justify-end">
                    <div className="skeleton h-3 w-20 rounded-lg" />
                  </div>
                  <div className="flex justify-center">
                    <div className="skeleton h-11 w-48 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="w-[340px] shrink-0 space-y-5">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-[14px] p-4 flex items-center gap-3">
                      <div className="skeleton w-5 h-5 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-20 rounded-lg" />
                        <div className="skeleton h-5 w-16 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-[20px] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="skeleton w-11 h-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-28 rounded-lg" />
                      <div className="skeleton h-4 w-full rounded-lg" />
                      <div className="skeleton h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="glass rounded-[20px] p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="skeleton h-3 w-32 rounded-lg" />
                    <div className="skeleton h-3 w-20 rounded-lg" />
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="skeleton h-2.5 w-5 rounded-lg" />
                        <div className="skeleton w-8 h-8 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <NavBar active="dashboard" />

      {/* Content */}
      <div className="flex-1 px-5 md:px-10 lg:px-20 pb-8 max-w-5xl mx-auto w-full">
        {/* Mobile / Tablet: single column */}
        <div className="lg:hidden space-y-7">
          {/* Hero Greeting */}
          <div className="space-y-2 pt-2">
            <h1 className="font-(family-name:--font-playfair) text-[28px] font-bold text-text-primary leading-tight tracking-[-1px]">
              {getGreeting()}, {userName} ✨
            </h1>
            <p className="text-text-secondary text-[15px]">
              Your mind is a universe. Let it out.
            </p>
          </div>

          {/* Journal Card */}
          <motion.div
            className="relative"
            animate={
              justSubmitted
                ? { y: -20, opacity: 0, scale: 0.98 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="glass rounded-[20px] p-4 space-y-3.5 shadow-[0_1px_2px_rgba(255,255,255,0.03)_inset]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Journal</h2>
                <span className="text-xs text-text-muted">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>
              <div className="bg-white/[0.025] border border-white/[0.05] rounded-xl p-3 min-h-[160px]">
                <textarea
                  value={content}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_LENGTH) {
                      setContent(e.target.value);
                    }
                  }}
                  placeholder="What's on your mind today? Write freely — your thoughts are encrypted and safe."
                  className="w-full h-full min-h-[140px] bg-transparent text-text-primary text-[15px] leading-relaxed placeholder:text-text-muted focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end">
                <span className={`text-xs ${isOverMax ? "text-red-400" : isOverWarn ? "text-amber-400" : "text-text-muted"}`}>
                  {charCount} / {MAX_LENGTH}
                </span>
              </div>
              {error && (
                <div className="rounded-xl p-3 text-center bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                  <button onClick={() => setError("")} className="text-xs text-accent mt-1 hover:underline">Dismiss</button>
                </div>
              )}
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] hover:scale-105 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createEntry.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Releasing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Release to SoulScript ✨
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {!entriesLoading && todayEntries.length === 0 && (
            <p className="text-xs text-text-muted text-center">
              No entries yet today — your thoughts are safe here, encrypted &amp; private.
            </p>
          )}

          {/* Daily Entry Tracker */}
          <DailyEntryTracker
            usedCount={todayEntries.length}
            maxCount={10}
          />

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass rounded-[14px] p-3 text-center space-y-1.5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
              <svg className="w-4 h-4 mx-auto text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
              <p className="text-[11px] text-text-muted">Current Streak</p>
              <p className="text-lg font-bold text-text-primary">
                {stats.streak} day{stats.streak !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="glass rounded-[14px] p-3 text-center space-y-1.5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
              <svg className="w-4 h-4 mx-auto text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-[11px] text-text-muted">This Month</p>
              <p className="text-lg font-bold text-text-primary">
                {stats.monthEntryCount} entries
              </p>
            </div>
            <div className="glass rounded-[14px] p-3 text-center space-y-1.5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
              <span className="text-lg">{stats.lastMood?.emoji || "💭"}</span>
              <p className="text-[11px] text-text-muted">Last Mood</p>
              <p className="text-sm font-semibold text-text-primary capitalize">
                {stats.lastMood?.emotion || "—"}
              </p>
            </div>
          </div>

          {/* AI Insight Preview */}
          <div className="glass rounded-[20px] p-4 space-y-3.5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-[28px] bg-gradient-to-br from-accent/40 via-accent/15 to-transparent shadow-[0_0_20px_rgba(124,92,252,0.3)] flex items-center justify-center shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold tracking-wider text-accent">AI INSIGHT PREVIEW</p>
                <p className="text-sm text-text-primary leading-relaxed">
                  Your emotions are trending toward clarity this week. Mindfulness will help maintain your focus.
                </p>
                <button onClick={() => router.push("/report")} className="text-xs font-medium text-accent hover:underline">
                  View Insights →
                </button>
              </div>
            </div>
          </div>

          {/* Mood Calendar Preview */}
          <div className="glass rounded-[20px] p-4 space-y-3.5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-accent">YOUR MOOD CALENDAR</p>
              <p className="text-xs text-text-muted">Last 7 days — see your emotions at a glance</p>
            </div>
            <div className="flex items-center justify-between">
              {stats.last7Days.map((day) => (
                <div key={day.dayLabel + day.isToday} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-text-muted">{day.dayLabel}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    day.emoji ? "glass" : day.isToday ? "ring-1 ring-accent/50" : "border border-dashed border-glass-border"
                  }`}>
                    {day.emoji && <span className="text-xs">{day.emoji}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button onClick={() => router.push("/calendar")} className="text-xs font-medium text-accent hover:underline">
                View Calendar →
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: two-column layout */}
        <div className="hidden lg:block pt-2">
          {/* Hero Greeting */}
          <div className="space-y-2 mb-6">
            <h1 className="font-(family-name:--font-playfair) text-[28px] font-bold text-text-primary leading-tight tracking-[-1px]">
              {getGreeting()}, {userName} ✨
            </h1>
            <p className="text-text-secondary text-[15px]">
              Your mind is a universe. Let it out.
            </p>
          </div>

          <div className="flex gap-8">
            {/* Left: Journal */}
            <div className="flex-1 min-w-0">
              <motion.div
                className="relative"
                animate={
                  justSubmitted
                    ? { y: -20, opacity: 0, scale: 0.98 }
                    : { y: 0, opacity: 1, scale: 1 }
                }
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="glass rounded-[20px] p-5 space-y-4 shadow-[0_1px_2px_rgba(255,255,255,0.03)_inset]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Journal</h2>
                    <span className="text-xs text-text-muted">
                      {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  <div className="bg-white/[0.025] border border-white/[0.05] rounded-xl p-3 min-h-[240px]">
                    <textarea
                      value={content}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_LENGTH) {
                          setContent(e.target.value);
                        }
                      }}
                      placeholder="What's on your mind today? Write freely — your thoughts are encrypted and safe."
                      className="w-full h-full min-h-[220px] bg-transparent text-text-primary text-[15px] leading-relaxed placeholder:text-text-muted focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className={`text-xs ${isOverMax ? "text-red-400" : isOverWarn ? "text-amber-400" : "text-text-muted"}`}>
                      {charCount} / {MAX_LENGTH}
                    </span>
                  </div>
                  {error && (
                    <div className="rounded-xl p-3 text-center bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400">{error}</p>
                      <button onClick={() => setError("")} className="text-xs text-accent mt-1 hover:underline">Dismiss</button>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-b from-accent to-accent-glow text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:shadow-[0_6px_24px_rgba(124,92,252,0.45)] hover:scale-105 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {createEntry.isPending ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Releasing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          Release to SoulScript ✨
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {!entriesLoading && todayEntries.length === 0 && (
                <p className="text-xs text-text-muted text-center mt-3">
                  No entries yet today — your thoughts are safe here, encrypted &amp; private.
                </p>
              )}
            </div>

            {/* Right: Stats + Insight + Calendar */}
            <div className="w-[340px] shrink-0 space-y-5">
              {/* Stat Cards — stacked vertically on desktop */}
              <div className="space-y-3">
                <div className="glass rounded-[14px] p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
                  <svg className="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-muted">Current Streak</p>
                    <p className="text-lg font-bold text-text-primary">
                      {stats.streak} day{stats.streak !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="glass rounded-[14px] p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
                  <svg className="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-muted">This Month</p>
                    <p className="text-lg font-bold text-text-primary">
                      {stats.monthEntryCount} entries
                    </p>
                  </div>
                </div>
                <div className="glass rounded-[14px] p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
                  <span className="text-xl shrink-0">{stats.lastMood?.emoji || "💭"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-muted">Last Mood</p>
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {stats.lastMood?.emotion || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Entry Tracker */}
              <DailyEntryTracker
                usedCount={todayEntries.length}
                maxCount={10}
              />

              {/* AI Insight Preview */}
              <div className="glass rounded-[20px] p-4 space-y-3 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent/40 via-accent/15 to-transparent shadow-[0_0_16px_rgba(124,92,252,0.3)] flex items-center justify-center shrink-0">
                    <span className="text-lg">✨</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-wider text-accent">AI INSIGHT PREVIEW</p>
                    <p className="text-[13px] text-text-primary leading-relaxed">
                      Your emotions are trending toward clarity this week. Mindfulness will help maintain your focus.
                    </p>
                    <button onClick={() => router.push("/report")} className="text-xs font-medium text-accent hover:underline">
                      View Insights →
                    </button>
                  </div>
                </div>
              </div>

              {/* Mood Calendar Preview */}
              <div className="glass rounded-[20px] p-4 space-y-3 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-wider text-accent">YOUR MOOD CALENDAR</p>
                  <p className="text-[11px] text-text-muted">Last 7 days</p>
                </div>
                <div className="flex items-center justify-between">
                  {stats.last7Days.map((day) => (
                    <div key={day.dayLabel + day.isToday} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">{day.dayLabel}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        day.emoji ? "glass" : day.isToday ? "ring-1 ring-accent/50" : "border border-dashed border-glass-border"
                      }`}>
                        {day.emoji && <span className="text-xs">{day.emoji}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button onClick={() => router.push("/calendar")} className="text-xs font-medium text-accent hover:underline">
                    View Calendar →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Undo Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm glass-strong rounded-xl p-4 flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">✓</span>
              <span className="text-sm text-text-primary">Saved</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">
                {toast.countdown}s
              </span>
              <button
                onClick={handleUndo}
                className="text-sm font-medium text-accent hover:underline"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
