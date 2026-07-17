"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Calendar, BarChart3, User } from "lucide-react";

type ActivePage = "dashboard" | "calendar" | "report" | "settings";

interface NavBarProps {
  active?: ActivePage;
  /** Show back arrow + title instead of brand (for sub-pages like report) */
  title?: string;
}

function NavButton({
  icon: Icon,
  isActive,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isActive: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-[44px] h-[44px] rounded-[22px] flex items-center justify-center transition-all duration-200 ${
        isActive
          ? "bg-accent/25 border border-accent/50 text-accent shadow-[0_0_12px_rgba(124,92,252,0.3)]"
          : "bg-white/[0.05] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.12] hover:border-accent/40 hover:shadow-[0_0_16px_rgba(124,92,252,0.25)] hover:scale-110"
      }`}
    >
      <Icon size={20} />
    </button>
  );
}

export default function NavBar({ active = "dashboard", title }: NavBarProps) {
  const router = useRouter();

  if (title) {
    // Sub-page mode: back arrow + centered title
    return (
      <div className="flex items-center justify-between px-5 py-3 md:px-10 lg:px-20">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary">
          {title}
        </span>
        <div className="w-9" />
      </div>
    );
  }

  // Default mode: brand left, 3 icon buttons right
  return (
    <div className="flex items-center justify-between px-5 py-3 md:px-10 lg:px-20">
      {/* Nav Left — Brand */}
      <div className="flex flex-col" style={{ gap: 2 }}>
        <span className="font-(family-name:--font-playfair) text-[20px] font-bold text-text-primary tracking-tight leading-none">
          SoulScript
        </span>
        <span className="text-[10px] text-text-muted leading-none">
          Write. Reflect. Grow.
        </span>
      </div>

      {/* Nav Right — 4 icon buttons */}
      <div className="flex items-center" style={{ gap: 10 }}>
        <NavButton
          icon={Sparkles}
          isActive={active === "dashboard"}
          onClick={() => router.push("/")}
          label="Dashboard"
        />
        <NavButton
          icon={Calendar}
          isActive={active === "calendar"}
          onClick={() => router.push("/calendar")}
          label="Calendar"
        />
        <NavButton
          icon={BarChart3}
          isActive={active === "report"}
          onClick={() => router.push("/report")}
          label="Report"
        />
        <NavButton
          icon={User}
          isActive={active === "settings"}
          onClick={() => router.push("/settings")}
          label="Settings"
        />
      </div>
    </div>
  );
}
