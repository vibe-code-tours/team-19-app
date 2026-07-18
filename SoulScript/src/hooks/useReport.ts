"use client";

import { useQuery } from "@tanstack/react-query";
import type { MoodDistributionItem, StreakResult } from "@/lib/report-stats";

interface ReportStats {
  entryCount: number;
  daysJournaled: number;
  moodDistribution: MoodDistributionItem[];
  streak: StreakResult;
}

interface ReportData {
  summary: string;
  dominantMood: string;
  insights: string;
  recommendations: string[];
}

interface ReportResponse {
  stats: ReportStats;
  report: ReportData | null;
  latestEntryTime: string | null;
  reportCreatedAt: string | null;
}

export function useReport(month: string) {
  return useQuery<ReportResponse>({
    queryKey: ["report", month],
    staleTime: 30_000,
    enabled: !!month && /^\d{4}-\d{2}$/.test(month),
    queryFn: async () => {
      const res = await fetch(
        `/api/report?month=${encodeURIComponent(month)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch report");
      }
      return res.json();
    },
  });
}
