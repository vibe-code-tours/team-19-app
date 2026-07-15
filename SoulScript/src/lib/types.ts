export interface JournalEntry {
  id: string;
  content: string;
  primary_emotion: string;
  emoji: string;
  secondary_emotions: string[];
  bg_glow_gradient: string;
  created_at: string;
}
