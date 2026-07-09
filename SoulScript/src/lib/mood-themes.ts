export const MOOD_THEMES: Record<string, string> = {
  joy: "from-amber-500/20 to-yellow-600/20",
  sadness: "from-blue-500/20 to-indigo-600/20",
  anger: "from-red-500/20 to-orange-600/20",
  fear: "from-purple-500/20 to-violet-600/20",
  surprise: "from-cyan-500/20 to-teal-600/20",
  disgust: "from-green-500/20 to-emerald-600/20",
  calm: "from-sky-500/20 to-blue-600/20",
  love: "from-pink-500/20 to-rose-600/20",
  anxious: "from-yellow-500/20 to-amber-600/20",
  uncertain: "from-slate-700/20 to-slate-900/20",
};

export const MOOD_EMOJIS: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  calm: "😌",
  love: "💜",
  anxious: "😰",
  uncertain: "💭",
};

export const DEFAULT_THEME = "from-slate-700/20 to-slate-900/20";

export function validateGlowTheme(input: string): string {
  return Object.values(MOOD_THEMES).includes(input) ? input : DEFAULT_THEME;
}
