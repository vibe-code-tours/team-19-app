/**
 * Shared utility functions for the report feature.
 */

/**
 * Format "YYYY-MM" to "Month Year" (e.g. "2026-07" → "July 2026").
 */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Split AI-generated insight text into up to 3 individual strings.
 * Handles JSON array format and plain sentence-separated text.
 */
export function splitInsights(text: string): string[] {
  if (text.trimStart().startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .slice(0, 3);
      }
    } catch {
      // Not valid JSON, fall through to sentence splitting
    }
  }
  const sentences = text
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.slice(0, 3);
}

/**
 * Parse AI-generated recommendations into { title, description } objects.
 * Handles JSON object strings and plain string formats.
 */
export function parseRecommendations(
  items: string[]
): { title: string; description: string }[] {
  return items
    .map((item) => {
      if (item.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.title && parsed.description) {
            return { title: parsed.title, description: parsed.description };
          }
        } catch {
          // Not valid JSON, fall through
        }
      }
      return { title: item, description: "" };
    })
    .filter((r) => r.title.length > 0);
}

/**
 * Get a Tailwind background-colour class for a given emotion name.
 */
export function getBarColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    joy: "bg-amber-400",
    sadness: "bg-blue-400",
    anger: "bg-red-400",
    fear: "bg-purple-400",
    surprise: "bg-cyan-400",
    disgust: "bg-green-400",
    calm: "bg-sky-400",
    love: "bg-pink-400",
    anxious: "bg-yellow-400",
    uncertain: "bg-slate-400",
  };
  return colorMap[emotion.toLowerCase()] || "bg-violet-400";
}
