import { openai } from "./client";
import { parseJsonResponse } from "./parse";
import type { ReportResult } from "./types";

export async function callAIForReport(
  entries: { content: string; primary_emotion: string; emoji: string; secondary_emotions: string[] }[]
): Promise<ReportResult> {
  const entrySummaries = entries
    .map(
      (e, i) =>
        `Entry ${i + 1}: Emotion=${e.primary_emotion} (${e.emoji}), Secondary=[${e.secondary_emotions.join(", ")}]\nContent: ${e.content.slice(0, 500)}`
    )
    .join("\n\n");

  const systemPrompt = `You are an empathetic AI psychologist analyzing a month of journal entries. Return ONLY a valid JSON object (no markdown, no code blocks) with: 'summary_overview' (2-3 sentence overview of the month), 'dominant_mood' (1 word, the most frequent emotion), 'pattern_insights' (a single string containing 2-3 insights about emotional patterns, each insight as a separate sentence separated by periods — do NOT use an array), 'actionable_recommendations' (array of 2-3 objects, each with 'title' (short recommendation name like "Morning Breathing Exercise") and 'description' (1-2 sentence explanation of the benefit and how to practice it)).`;

  const userPrompt = `Analyze these ${entries.length} journal entries from this month:\n\n${entrySummaries}`;

  // Retry up to 2 times if JSON parsing fails
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3000,
      });

      return parseJsonResponse<ReportResult>(response.choices[0].message.content || "{}");
    } catch (error) {
      if (attempt === 2) throw error;
      console.warn(`Report AI attempt ${attempt + 1} failed, retrying...`);
    }
  }

  throw new Error("Failed to generate report after 3 attempts");
}
