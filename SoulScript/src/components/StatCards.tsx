import { Pencil, Flame, TrendingUp } from "lucide-react";

interface StatCardsProps {
  entryCount: number;
  streak: number;
  positivePercentage: number;
}

export default function StatCards({
  entryCount,
  streak,
  positivePercentage,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="glass rounded-[14px] p-4 space-y-1 border border-white/[0.04]">
        <Pencil size={18} className="text-accent" />
        <p className="text-2xl font-bold text-text-primary font-[family-name:var(--font-caption)]">
          {entryCount}
        </p>
        <p className="text-xs text-text-muted font-medium">Entries this month</p>
      </div>
      <div className="glass rounded-[14px] p-4 space-y-1 border border-white/[0.04]">
        <Flame size={18} className="text-amber-400" />
        <p className="text-2xl font-bold text-text-primary font-[family-name:var(--font-caption)]">
          {streak}
        </p>
        <p className="text-xs text-text-muted font-medium">Day streak</p>
      </div>
      <div className="glass rounded-[14px] p-4 space-y-1 border border-white/[0.04]">
        <TrendingUp size={18} className="text-emerald-400" />
        <p className="text-2xl font-bold text-text-primary font-[family-name:var(--font-caption)]">
          {positivePercentage}%
        </p>
        <p className="text-xs text-text-muted font-medium">Positive days</p>
      </div>
    </div>
  );
}
