import { openai } from "./client";
import { parseJsonResponse } from "./parse";

export interface MomentReflectionInput {
  dominantMood: string;
  emoji: string;
  notableEntries: {
    content: string;
    emoji: string;
    created_at: string;
    primary_emotion: string;
  }[];
}

export interface MomentReflectionResult {
  reflection: string;
}

/**
 * Generate a one-shot AI reflection for "A Moment Worth Noting".
 *
 * Takes the dominant mood and 1-2 content-rich entries matching that mood,
 * then produces a singular, poignant observation — not a summary.
 */
export async function callAIForMoment(
  input: MomentReflectionInput,
): Promise<MomentReflectionResult> {
  const entrySummaries = input.notableEntries
    .map(
      (e, i) =>
        `Entry ${i + 1}: Emotion=${e.primary_emotion} (${e.emoji}), Date=${e.created_at.slice(0, 10)}\nContent: ${e.content.slice(0, 500)}`,
    )
    .join("\n\n");

  const systemPrompt = `You are an empathetic AI psychologist identifying a single moment worth noting from a month of journal entries.

Return ONLY a valid JSON object (no markdown, no code blocks) with a single key: 'reflection'. The reflection should be 1-3 sentences identifying one specific, poignant observation about the user's emotional journey — not a summary of the entire month.

Focus on what stands out: a contrast, an outlier, a pattern that matters. Be specific and human, not generic. Write in first-person voice as if addressing the user.

Example: "You felt calm 12 times this month, but one entry stands out — the day you wrote about reconnecting with an old friend. The warmth and relief in that moment is worth holding onto."`;

  const userPrompt = `The user's dominant mood this month is "${input.dominantMood}" (${input.emoji}). Here are notable entries that reflect this mood:\n\n${entrySummaries}\n\nWhat is the one moment worth noting?`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model:
          process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      });

      return parseJsonResponse<MomentReflectionResult>(
        response.choices[0].message.content || "{}",
      );
    } catch (error) {
      if (attempt === 2) throw error;
      console.warn(
        `Moment reflection AI attempt ${attempt + 1} failed, retrying...`,
      );
    }
  }

  throw new Error("Failed to generate moment reflection after 3 attempts");
}
