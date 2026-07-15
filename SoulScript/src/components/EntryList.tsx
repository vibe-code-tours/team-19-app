"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { JournalEntry } from "@/lib/types";
import EntryCard from "./EntryCard";

export default function EntryList({
  entries,
  isLoading,
}: {
  entries: JournalEntry[];
  isLoading: boolean;
}) {
  // Loading state — show skeletons
  if (isLoading && entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 text-center space-y-3"
      >
        <div className="breathe mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-text-secondary text-sm">
          No entries yet today. Start writing above!
        </p>
      </motion.div>
    );
  }

  // Entry list
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <EntryCard entry={entry} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
