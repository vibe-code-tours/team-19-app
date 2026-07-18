export interface MoodDistributionItem {
  emotion: string;
  emoji: string;
  count: number;
  percentage: number;
}

export interface StreakResult {
  current: number;
  best: number;
}

interface MoodEntry {
  primary_emotion: string;
  emoji: string;
}

interface TimestampEntry {
  created_at: string;
}

/**
 * Compute mood distribution from journal entries.
 * Groups by primary_emotion, counts occurrences, computes percentages,
 * and sorts descending by count.
 */
export function computeMoodDistribution(
  entries: MoodEntry[]
): MoodDistributionItem[] {
  if (entries.length === 0) return [];

  const total = entries.length;
  const groups: Record<string, { emoji: string; count: number }> = {};

  for (const entry of entries) {
    const emotion = entry.primary_emotion.toLowerCase();
    if (!groups[emotion]) {
      groups[emotion] = { emoji: entry.emoji, count: 0 };
    }
    groups[emotion].count++;
  }

  const distribution: MoodDistributionItem[] = Object.entries(groups).map(
    ([emotion, data]) => ({
      emotion,
      emoji: data.emoji,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
    })
  );

  distribution.sort((a, b) => b.count - a.count);
  return distribution;
}

/**
 * Count unique days that have at least one journal entry.
 */
export function computeDaysJournaled(entries: TimestampEntry[]): number {
  if (entries.length === 0) return 0;

  const uniqueDays = new Set<string>();
  for (const entry of entries) {
    uniqueDays.add(new Date(entry.created_at).toISOString().slice(0, 10));
  }
  return uniqueDays.size;
}

/**
 * Compute current and best streak of consecutive journaling days.
 * Current streak counts backwards from today (or yesterday if today has no entry).
 * Best streak is the longest consecutive run in the dataset.
 */
export function computeStreak(entries: TimestampEntry[]): StreakResult {
  if (entries.length === 0) return { current: 0, best: 0 };

  // Extract unique day strings
  const uniqueDays = new Set<string>();
  for (const entry of entries) {
    uniqueDays.add(new Date(entry.created_at).toISOString().slice(0, 10));
  }

  const sortedDays = Array.from(uniqueDays).sort();

  // Compute best streak
  let best = 1;
  let currentRun = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > best) {
        best = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  // Compute current streak (backwards from today)
  const today = new Date().toISOString().slice(0, 10);
  const daySet = new Set(sortedDays);

  let startDate: string;
  if (daySet.has(today)) {
    startDate = today;
  } else {
    // Start from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = yesterday.toISOString().slice(0, 10);
  }

  let current = 0;
  let checkDate = new Date(startDate + "T12:00:00Z");
  while (daySet.has(checkDate.toISOString().slice(0, 10))) {
    current++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { current, best };
}
