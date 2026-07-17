"use client";

import { Lock, ChevronRight } from "lucide-react";
import type { JournalEntry } from "@/lib/types";

interface RecentEntriesProps {
  entries: JournalEntry[];
  onEntryClick: (entry: JournalEntry) => void;
}

export default function RecentEntries({
  entries,
  onEntryClick,
}: RecentEntriesProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
        Recent Journal Entries
      </h3>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onEntryClick(entry)}
              className="w-full glass rounded-2xl p-4 space-y-2.5 border border-[#332867] text-left hover:bg-white/[0.06] transition-colors"
            >
              {/* Top row: emoji + emotion + lock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{entry.emoji}</span>
                  <span className="text-sm font-medium text-text-primary capitalize">
                    {entry.primary_emotion}
                  </span>
                </div>
                <Lock size={14} className="text-text-muted" />
              </div>

              {/* Content preview */}
              <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                {entry.content}
              </p>

              {/* Bottom row: time + chevron */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted font-[family-name:var(--font-caption)]">
                  {new Date(entry.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <ChevronRight size={14} className="text-text-muted" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 text-center border border-[#332867]">
          <p className="text-sm text-text-muted">No entries this month</p>
        </div>
      )}
    </div>
  );
}
