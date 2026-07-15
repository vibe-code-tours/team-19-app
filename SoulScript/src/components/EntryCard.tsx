"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { JournalEntry } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

export default function EntryCard({ entry }: { entry: JournalEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const preview =
    entry.content.length > 100 ? entry.content.slice(0, 100) + "..." : entry.content;

  return (
    <motion.div
      layout="position"
      onClick={() => setIsExpanded((prev) => !prev)}
      className="glass rounded-xl p-4 cursor-pointer"
    >
      {/* Header row: emoji + relative timestamp */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{entry.emoji}</span>
        <span className="text-sm text-text-secondary">
          {relativeTime(entry.created_at)}
        </span>
      </div>

      {/* Content preview / full */}
      <p className="text-sm text-text-primary mt-2">
        {isExpanded ? entry.content : preview}
      </p>

      {/* Emotion pills — only when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize">
                {entry.primary_emotion}
              </span>
              {entry.secondary_emotions.map((emotion) => (
                <span
                  key={emotion}
                  className="px-2 py-0.5 glass rounded-full text-[11px] font-medium text-text-secondary capitalize"
                >
                  {emotion}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
