"use client";

import { motion } from "framer-motion";
import { getBarColor } from "@/lib/report-utils";
import type { MoodDistributionItem } from "@/lib/report-stats";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface EmotionalLandscapeProps {
  moodDistribution: MoodDistributionItem[];
}

export default function EmotionalLandscape({
  moodDistribution,
}: EmotionalLandscapeProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        EMOTIONAL LANDSCAPE
      </p>
      <div className="glass rounded-2xl p-5 space-y-4">
        {moodDistribution.length > 0 ? (
          moodDistribution.map((item) => (
            <div key={item.emotion} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-sm text-text-primary">
                    {item.emotion}
                  </span>
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {item.percentage}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(item.emotion)} rounded-full`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            No entries yet this month. Start journaling to see your emotional
            landscape.
          </p>
        )}
      </div>
    </motion.div>
  );
}
