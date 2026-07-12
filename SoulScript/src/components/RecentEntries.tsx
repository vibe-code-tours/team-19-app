"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOOD_EMOJIS } from "@/lib/mood-themes";

interface Entry {
  id: string;
  content: string;
  primary_emotion: string;
  emoji: string;
  created_at: string;
}

const MOOD_COLORS: Record<string, string> = {
  joy: "bg-mood-joy",
  sadness: "bg-mood-sadness",
  anger: "bg-mood-anger",
  fear: "bg-mood-fear",
  surprise: "bg-mood-calm",
  disgust: "bg-mood-uncertain",
  calm: "bg-mood-calm",
  love: "bg-mood-love",
  anxious: "bg-mood-anxious",
  uncertain: "bg-mood-uncertain",
};

export default function RecentEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadEntries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("journal_entries")
        .select("id, content, primary_emotion, emoji, created_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) setEntries(data);
    }
    loadEntries();
  }, [supabase]);

  if (entries.length === 0) return null;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, max) + "..." : text;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl glass p-4 sm:p-5"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">
                  {MOOD_EMOJIS[entry.primary_emotion] || entry.emoji}
                </span>
                <span className="text-xs text-text-secondary sm:text-sm">
                  {formatDate(entry.created_at)}
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium text-text-primary ${MOOD_COLORS[entry.primary_emotion] || "bg-mood-uncertain"}`}
              >
                {entry.primary_emotion.charAt(0).toUpperCase() +
                  entry.primary_emotion.slice(1)}
              </span>
            </div>

            {/* Divider */}
            <div className="mb-3 h-px bg-white/[0.06]" />

            {/* Entry Text */}
            <p className="text-sm leading-relaxed text-text-secondary">
              {truncate(entry.content, 150)}
            </p>
          </div>
        ))}
      </div>

      <button className="text-sm font-medium text-accent transition-colors hover:text-accent-glow">
        View all entries →
      </button>
    </div>
  );
}
