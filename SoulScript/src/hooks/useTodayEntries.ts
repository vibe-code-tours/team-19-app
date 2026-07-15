"use client";

import { useQuery } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useTodayEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "today"],
    staleTime: 30_000,
    queryFn: async () => {
      const today = getTodayKey();
      const res = await fetch(`/api/entries?day=${today}`);
      if (!res.ok) {
        throw new Error("Failed to fetch today's entries");
      }
      const data = await res.json();
      return data.entries || [];
    },
  });
}
