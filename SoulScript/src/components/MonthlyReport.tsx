"use client";

import { motion } from "framer-motion";

interface ReportData {
  summary_overview: string;
  dominant_mood: string;
  actionable_recommendations: string[];
  pattern_insights: string;
}

interface Recommendation {
  title: string;
  description: string;
}

interface MonthlyReportProps {
  report: ReportData;
  entryCount: number;
  daysInMonth: number;
}

const MOOD_EMOJIS: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  calm: "😌",
  love: "💜",
  anxious: "😰",
  uncertain: "💭",
};

function splitInsights(text: string): string[] {
  // Handle JSON array format (AI sometimes returns this)
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
  // Split by sentence boundaries or newlines
  const sentences = text
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.slice(0, 3);
}

function parseRecommendations(items: string[]): Recommendation[] {
  return items
    .map((item) => {
      // Handle JSON string format (new format)
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
      // Handle plain string format (legacy format) — use as title with no description
      return { title: item, description: "" };
    })
    .filter((r) => r.title.length > 0);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function MonthlyReport({
  report,
  entryCount,
  daysInMonth,
}: MonthlyReportProps) {
  const emoji = MOOD_EMOJIS[report.dominant_mood] || "💭";
  const insights = splitInsights(report.pattern_insights);
  const recommendations = parseRecommendations(
    report.actionable_recommendations.slice(0, 3)
  );

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stage 1: The Big Picture */}
      <motion.div variants={itemVariants}>
        <div className="glass rounded-2xl p-7 text-center space-y-4">
          <p className="text-[10px] font-semibold tracking-wider text-accent">
            THE BIG PICTURE
          </p>
          <div className="text-5xl">{emoji}</div>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-text-primary capitalize">
            {report.dominant_mood}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
            This month, you felt {report.dominant_mood} on {entryCount} of{" "}
            {daysInMonth} days.
          </p>
        </div>
      </motion.div>

      {/* Stage 2: Pattern Recognition */}
      <motion.div variants={itemVariants}>
        <div className="space-y-3">
          <p className="text-[10px] font-semibold tracking-wider text-accent px-1">
            PATTERN RECOGNITION
          </p>
          <div className="glass rounded-2xl p-5 space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3.5">
                <div className="w-[3px] shrink-0 rounded-full bg-accent" />
                <p className="text-[14px] text-text-primary leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stage 3: Actionable Frameworks */}
      <motion.div variants={itemVariants}>
        <div className="space-y-3">
          <p className="text-[10px] font-semibold tracking-wider text-accent px-1">
            ACTIONABLE FRAMEWORKS
          </p>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-text-primary">
                      {rec.title}
                    </h4>
                    {rec.description && (
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {rec.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
