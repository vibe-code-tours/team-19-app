import { openai } from "./client";
import { parseJsonResponse } from "./parse";
import type { AnalysisResult } from "./types";
import { validateGlowTheme, MOOD_THEMES } from "@/lib/mood-themes";

export async function callAI(
  content: string,
): Promise<AnalysisResult> {
  const systemPrompt = `You are an expert AI psychologist and emotional intelligence specialist. 
Your task is to analyze the emotional state of the provided input text (which may be in Burmese, English, or mixed) with high accuracy and nuance.

### Instructions & Rules:
1. **primary_emotion**: Identify the core emotion of the text in lowercase English (e.g., joy, sadness, anger, fear, surprise, disgust, calm, love, anxious, uncertain, overwhelmed, etc.). Do not restrict yourself to a rigid hardcoded list; use the most accurate psychological term fitting the text.
2. **emoji**: Provide exactly ONE representative emoji that matches the primary emotion.
3. **secondary_emotions**: Provide a JSON array of 1 to 3 secondary or sub-emotions in lowercase English to capture the nuance of the text.
4. **glow_theme**: Select the most appropriate Tailwind CSS gradient class from the allowed theme list based on the mood.
   Allowed themes: ${Object.values(MOOD_THEMES).join(", ")}

### Output Format:
Return **ONLY** a valid JSON object. No markdown formatting, no code blocks, no extra text.

### Examples:

Input: "I am so excited and happy about this new project!"
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["excited", "optimistic"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}

Input: "ဒီနေ့တော့ အရာရာ အင်မတန် အဆင်ပြေပြီး ပျော်စရာတွေ ချည်းပဲ..."
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["grateful", "happy"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}

Input: "I feel so down and heartbroken after hearing that news."
Output: {"primary_emotion": "sadness", "emoji": "😢", "secondary_emotions": ["heartbroken", "gloomy"], "glow_theme": "from-blue-500/20 to-indigo-600/20"}

Input: "ဒီနေ့တော့ ဘာမှန်းလည်း မသိဘူး၊ ရင်ထဲမှာ ထူးထူးဆန်းဆန်းကြီး ဖြစ်နေတယ်။ ဘာကိုမှလည်း စိတ်မဝင်စားချင်ဘူး၊ ဘာလုပ်ရမှန်းလည်း လုံးဝ မသိတော့ဘူး။"
Output: {"primary_emotion": "confused", "emoji": "🤔", "secondary_emotions": ["uncertain", "lost", "indifferent"], "glow_theme": "from-slate-700/20 to-slate-900/20"}

Input: "အရမ်းကို ဒေါသထွက်မိတယ်, ဘာလို့ ငါ့ကို လာမပြောတာလဲ!"
Output: {"primary_emotion": "anger", "emoji": "😡", "secondary_emotions": ["furious", "annoyed"], "glow_theme": "from-red-500/20 to-orange-600/20"}`;

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
  return {
    primary_emotion: result.primary_emotion || "uncertain",
    emoji: result.emoji || "💭",
    secondary_emotions: result.secondary_emotions || ["neutral"],
    glow_theme: validateGlowTheme(result.glow_theme || ""),
  };
}