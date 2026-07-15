import { openai } from "./client";
import { parseJsonResponse } from "./parse";
import type { AnalysisResult } from "./types";
import { validateGlowTheme, MOOD_THEMES } from "@/lib/mood-themes";

export async function callAI(
  content: string,
): Promise<AnalysisResult> {
  const systemPrompt = `You are an empathetic, highly analytical, emotionally intelligent AI psychologist. The input text may be in Burmese or English. Analyze the text payload regardless of language. Always return emotion labels in English. Return ONLY a valid JSON object (no markdown, no code blocks) containing: 'primary_emotion' (1 word, in English), 'emoji' (1 character), 'secondary_emotions' (string array of 1-3 terms in English — only include emotions you genuinely identify in the text; if the input is sparse, infer from tone, brevity, or word choice — do not pad), and 'glow_theme' (a valid Tailwind gradient class from the allowed mood themes: ${Object.values(MOOD_THEMES).join(", ")}).`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  const rawContent = response.choices[0].message.content || "{}";
  return parseJsonResponse<AnalysisResult>(rawContent);
}

export function validateResult(result: Partial<AnalysisResult>): AnalysisResult {
  let emotions = result.secondary_emotions || ["neutral"];
  if (!Array.isArray(emotions) || emotions.length === 0) {
    emotions = ["neutral"];
  }
  if (emotions.length > 3) emotions = emotions.slice(0, 3);

  return {
    primary_emotion: result.primary_emotion || "Uncertain",
    emoji: result.emoji || "💭",
    secondary_emotions: emotions,
    glow_theme: validateGlowTheme(result.glow_theme || ""),
  };
}
