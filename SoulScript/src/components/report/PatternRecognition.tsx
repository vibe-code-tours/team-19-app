"use client";

import { motion } from "framer-motion";
import { TrendingUp, Brain, Heart } from "lucide-react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const insightMeta = [
  { icon: TrendingUp, label: "Trend" },
  { icon: Brain, label: "Insight" },
  { icon: Heart, label: "Pattern" },
];

interface PatternRecognitionProps {
  insights: string[];
}

export default function PatternRecognition({
  insights,
}: PatternRecognitionProps) {
  if (insights.length === 0) return null;

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        PATTERN RECOGNITION
      </p>
      <div className="glass rounded-2xl p-5 space-y-5">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-3.5">
            <div className="w-0.5 shrink-0 rounded-full bg-accent" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {i < insightMeta.length && (() => {
                  const Icon = insightMeta[i].icon;
                  return <Icon size={14} className="text-accent" />;
                })()}
                <h4 className="text-sm font-semibold text-text-primary">
                  {i < insightMeta.length ? insightMeta[i].label : "Pattern"}
                </h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
