"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield } from "lucide-react";
import { formatMonth } from "@/lib/report-utils";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ReportHeaderProps {
  month: string;
  entryCount: number;
  daysJournaled: number;
}

export default function ReportHeader({
  month,
  entryCount,
  daysJournaled,
}: ReportHeaderProps) {
  return (
    <motion.div variants={itemVariants} className="text-center space-y-3 pt-2">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center">
          <Sparkles className="text-violet-300" size={24} />
        </div>
      </div>
      <h1 className="font-(family-name:--font-playfair) text-[24px] font-bold text-text-primary">
        AI Monthly Reflection ✨
      </h1>
      <p className="text-sm text-text-secondary">
        Your emotional story, gently uncovered.
      </p>
      <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
        <span>{formatMonth(month)}</span>
        <span>·</span>
        <span>{entryCount ?? 0} entries analyzed</span>
        <span>·</span>
        <span>{daysJournaled ?? 0} days journaled</span>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 glass rounded-full border border-glass-border">
        <Shield size={12} className="text-text-muted" />
        <span className="text-[10px] text-text-muted">End-to-end encrypted</span>
      </div>
    </motion.div>
  );
}
