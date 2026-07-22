"use client";

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface MomentWorthNotingProps {
  summary: string;
}

export default function MomentWorthNoting({
  summary,
}: MomentWorthNotingProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        A MOMENT WORTH NOTING
      </p>
      <div className="glass rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-xs text-text-muted">AI Reflection</span>
        </div>
        <p className="text-sm text-text-primary leading-relaxed italic">
          &ldquo;{summary}&rdquo;
        </p>
        <p className="text-xs text-text-muted">
          This month&apos;s emotional synthesis from your journal entries.
        </p>
      </div>
    </motion.div>
  );
}
