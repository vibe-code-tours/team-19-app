"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StatsRow from "@/components/StatsRow";
import AIInsightCard from "@/components/AIInsightCard";
import RecentEntries from "@/components/RecentEntries";

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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    entryId: string;
    countdown: number;
  } | null>(null);
  const [savedDraft, setSavedDraft] = useState("");
  const [error, setError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  // Clear draft when toast expires (entry is permanent)
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
    if (content.length < MIN_LENGTH || submitting) return;
    setSubmitting(true);
    setError("");
    setToast(null);
    setSavedDraft("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.slice(0, MAX_LENGTH) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save entry");
      }

      const { entry } = await res.json();
      setSavedDraft(content);
      setJustSubmitted(true);
      setToast({ entryId: entry.id, countdown: 4 });
      setContent("");
      setTimeout(() => setJustSubmitted(false), 600);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting]);

  async function handleUndo() {
    if (!toast) return;
    await fetch(`/api/entries/${toast.entryId}`, { method: "DELETE" });
    setContent(savedDraft);
    setSavedDraft("");
    setToast(null);
  }

  const charCount = content.length;
  const isOverWarn = charCount >= WARN_LENGTH;
  const isOverMax = charCount >= MAX_LENGTH;
  const canSubmit = charCount >= MIN_LENGTH && !submitting;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6 sm:max-w-xl lg:max-w-2xl">
          <div className="skeleton h-10 w-3/4 rounded-lg sm:h-12 lg:h-14" />
          <div className="skeleton h-5 w-1/2 rounded-lg sm:h-6" />
          <div className="skeleton h-56 w-full rounded-xl sm:h-64 lg:h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Content */}
      <div className="flex flex-1 flex-col gap-7 px-5 pb-8 pt-6 sm:px-8 md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl lg:gap-9 lg:px-10 lg:pt-8">
        {/* Greeting */}
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-text-primary sm:text-4xl lg:text-[40px]">
            {getGreeting()}, {userName}.
          </h1>
          <p className="text-base text-text-secondary sm:text-lg">
            How does your soul feel {getGreeting().split(" ")[1]}?
          </p>
        </div>

        {/* Textarea with Glow */}
        <motion.div
          className="relative"
          animate={
            justSubmitted
              ? { y: -20, opacity: 0, scale: 0.98 }
              : { y: 0, opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 mood-glow rounded-2xl" />
          <div className="relative min-h-[220px] rounded-2xl glass p-5 sm:min-h-[260px] lg:min-h-[280px]">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setContent(e.target.value);
                }
              }}
              placeholder="Write your thoughts here..."
              className="min-h-[180px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none sm:min-h-[220px] lg:min-h-[240px]"
            />
          </div>
        </motion.div>

        {/* Character Counter */}
        <div className="flex justify-end">
          <span
            className={`text-xs ${
              isOverMax
                ? "text-red-400"
                : isOverWarn
                  ? "text-amber-400"
                  : "text-text-muted"
            }`}
          >
            {charCount} / {MAX_LENGTH}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-xs text-accent mt-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2.5 rounded-full bg-accent px-8 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-40 sm:px-10 sm:py-4"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
            Release to Calendar
          </button>
        </div>

        {/* Stats Row */}
        <StatsRow />

        {/* AI Insight Card */}
        <AIInsightCard />

        {/* Recent Entries */}
        <RecentEntries />
      </div>

      {/* Undo Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm glass-strong rounded-xl p-4 flex items-center justify-between"
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
