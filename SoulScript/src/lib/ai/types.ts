export interface AnalysisResult {
  primary_emotion: string;
  emoji: string;
  secondary_emotions: string[];
  glow_theme: string;
}

export interface ReportResult {
  summary_overview: string;
  dominant_mood: string;
  pattern_insights: string;
  actionable_recommendations: { title: string; description: string }[];
}
