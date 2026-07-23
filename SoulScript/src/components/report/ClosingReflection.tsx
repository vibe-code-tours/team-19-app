"use client";

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ClosingReflection() {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <div className="glass rounded-2xl p-6 text-center space-y-3">
        <span className="text-3xl">🌙</span>
        <p className="text-sm text-text-secondary leading-relaxed italic">
          &ldquo;Your journal is more than words — it&apos;s a mirror of your
          inner world. Each entry is a step toward understanding yourself more
          deeply.&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
