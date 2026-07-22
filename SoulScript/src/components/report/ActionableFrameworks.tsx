"use client";

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ActionableFrameworksProps {
  recommendations: { title: string; description: string }[];
}

export default function ActionableFrameworks({
  recommendations,
}: ActionableFrameworksProps) {
  if (recommendations.length === 0) return null;

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[2.5px] text-text-muted">
        ACTIONABLE FRAMEWORKS
      </p>
      <p className="text-[13px] text-text-secondary leading-relaxed">
        Gentle practices tailored to your emotional patterns.
      </p>
      <div className="space-y-2.5">
        {recommendations.map((rec, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">💡</span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-text-primary">
                  {rec.title}
                </h4>
                {rec.description && (
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    {rec.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
