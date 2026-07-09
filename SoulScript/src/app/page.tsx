"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const [error, setError] = useState("");
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

  const handleSubmit = useCallback(async () => {
    if (content.length < MIN_LENGTH || submitting) return;
    setSubmitting(true);
    setError("");

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
      setToast({ entryId: entry.id, countdown: 4 });
      setContent("");
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
    setToast(null);
  }

  const charCount = content.length;
  const isOverWarn = charCount >= WARN_LENGTH;
  const isOverMax = charCount >= MAX_LENGTH;
  const canSubmit = charCount >= MIN_LENGTH && !submitting;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="skeleton h-10 w-3/4 rounded-lg" />
          <div className="skeleton h-5 w-1/2 rounded-lg" />
          <div className="skeleton h-56 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-end p-5">
        <button
          onClick={() => router.push("/settings")}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full gap-7">
        {/* Greeting */}
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-text-primary leading-tight">
            {getGreeting()}, {userName}.
          </h1>
          <p className="text-text-secondary text-base">
            How does your soul feel {getGreeting().split(" ")[1]}?
          </p>
        </div>

        {/* Textarea with Glow */}
        <div className="relative">
          <div className="absolute inset-0 mood-glow rounded-2xl" />
          <div className="relative glass rounded-2xl p-5 min-h-[220px]">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setContent(e.target.value);
                }
              }}
              placeholder="Write your thoughts here..."
              className="w-full h-full min-h-[180px] bg-transparent text-text-primary text-[15px] leading-relaxed placeholder:text-text-muted focus:outline-none resize-none"
            />
          </div>
        </div>

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
            className="flex items-center gap-2.5 px-8 py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-accent-glow transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
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
