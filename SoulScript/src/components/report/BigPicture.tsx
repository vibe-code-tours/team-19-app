"use client";

import { motion } from "framer-motion";
import { MOOD_EMOJIS } from "@/lib/mood-themes";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface BigPictureProps {
  dominantMood: string;
  summary: string | null;
}

export default function BigPicture({ dominantMood, summary }: BigPictureProps) {
  const mood = dominantMood.toLowerCase();
  const emoji = MOOD_EMOJIS[mood] || "💭";

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        THE BIG PICTURE
      </p>
      <div className="glass rounded-2xl p-8 text-center space-y-4 bg-gradient-to-b from-violet-500/[0.08] via-cyan-500/[0.04] to-transparent">
        <div className="text-5xl">{emoji}</div>
        <h3 className="font-(family-name:--font-playfair) text-2xl font-bold text-text-primary capitalize">
          {mood}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {summary ||
            "This month, your emotional landscape is taking shape. Keep journaling to unlock deeper insights."}
        </p>
      </div>
    </motion.div>
  );
}
