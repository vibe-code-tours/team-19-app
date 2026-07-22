"use client";

import { useId } from "react";

interface DailyEntryTrackerProps {
  usedCount: number;
  maxCount: number;
}

export default function DailyEntryTracker({
  usedCount,
  maxCount,
}: DailyEntryTrackerProps) {
  const gradientId = useId();
  const remaining = Math.max(0, maxCount - usedCount);
  const progress = maxCount > 0 ? usedCount / maxCount : 0;

  // SVG donut config
  const size = 104;
  const strokeWidth = 8;
  const radius = 35;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="glass rounded-[20px] p-4 lg:p-5 shadow-[0_1px_3px_rgba(255,255,255,0.04)_inset]">
      <p className="text-[11px] font-semibold tracking-wider text-accent mb-4">
        TODAY&apos;S ENTRIES
      </p>

      <div className="flex items-center gap-5">
        {/* Donut chart */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B7CF6" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            {/* Track ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--circle-track)"
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            {usedCount > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[28px] font-bold text-text-primary leading-none">
              {usedCount}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-[15px] font-semibold text-text-primary">
              {usedCount} of {maxCount} used
            </p>
            <p className="text-[13px] text-text-secondary mt-0.5">
              {remaining} {remaining === 1 ? "entry" : "entries"} remaining
            </p>
          </div>

          {/* 10-dot indicator */}
          <div className="flex gap-[5px]">
            {Array.from({ length: maxCount }, (_, i) => (
              <div
                key={i}
                className={`w-[7px] h-[7px] rounded-full transition-colors duration-300 ${
                  i < usedCount
                    ? "bg-accent"
                    : "border border-white/15 bg-gray-700/20 dark:bg-gray-700/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
