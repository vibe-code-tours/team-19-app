const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Returns a human-readable relative timestamp from an ISO date string.
 * - < 60s: "just now"
 * - < 60min: "Xm ago"
 * - < 24h: "Xh ago"
 * - < 7d: "Xd ago"
 * - >= 7d: formatted "Month Day" (e.g. "Jul 5")
 */
export function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;

  if (diff < MINUTE_MS) {
    return "just now";
  }
  if (diff < HOUR_MS) {
    const mins = Math.floor(diff / MINUTE_MS);
    return `${mins}m ago`;
  }
  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return `${hours}h ago`;
  }
  if (diff < 7 * DAY_MS) {
    const days = Math.floor(diff / DAY_MS);
    return `${days}d ago`;
  }

  // Format as "Month Day" for dates 7+ days ago
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}
