"use client";

import { useQuery } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  // Compute UTC boundaries for the user's local day
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useTodayEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "today"],
    staleTime: 30_000,
    queryFn: async () => {
      const { start, end } = getTodayRange();
      const res = await fetch(
        `/api/entries?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch today's entries");
      }
      const data = await res.json();
      return data.entries || [];
    },
  });
}
