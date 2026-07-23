import { openai } from "./client";
import { parseJsonResponse } from "./parse";
import type { AnalysisResult } from "./types";
import { validateGlowTheme, MOOD_THEMES } from "@/lib/mood-themes";

export async function callAI(
  content: string,
): Promise<AnalysisResult> {
  const SYSTEMPROMPT = `You are an expert AI psychologist and emotional intelligence specialist. 
Your task is to analyze the emotional state of the provided input text (which may be in Burmese, English, or mixed) with high accuracy and nuance.

### Instructions & Rules:
1. **primary_emotion**: Identify the core emotion of the text in lowercase English (e.g., joy, sadness, anger, fear, surprise, disgust, calm, love, anxious, uncertain, overwhelmed, etc.). Do not restrict yourself to a rigid hardcoded list; use the most accurate psychological term fitting the text.
2. **emoji**: Provide exactly ONE representative emoji that matches the primary emotion.
3. **secondary_emotions**: Provide a JSON array of 1 to 3 secondary or sub-emotions in lowercase English to capture the nuance of the text.
4. **glow_theme**: Select the most appropriate Tailwind CSS gradient class from the allowed theme list based on the mood.
   Allowed themes: ${Object.values(MOOD_THEMES).join(", ")}

### Consistency Rules:
- **Primary Emotion Form**: Always use the **adjective form** for primary emotions (e.g., use "anxious" instead of "anxiety", "sad" instead of "sadness", "angry" instead of "anger") to maintain consistency across journal entries.

### Edge-Case & Cultural Rules:
- **Mixed Input / Code-Switching**: Consider the overall emotional weight of the combined thought.
- **Neutral / Ambiguous**: If the text carries no emotional weight, default to primary_emotion: "calm" or "neutral", emoji: ":neutral_face:", and secondary_emotions: ["indifferent"].

### Output Format:
Return **ONLY** a single valid JSON object matching the exact key names. DO NOT include markdown backticks (e.g. no \`\`\`json), preamble, or commentary.

<example>
Input: "I am so excited and happy about this new project!"
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["excited", "optimistic"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}
</example>

<example>
Input: "ဒီနေ့တော့ အရာရာ အင်မတန် အဆင်ပြေပြီး ပျော်စရာတွေ ချည်းပဲ..."
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["grateful", "happy"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}
</example>

<example>
Input: "I feel so down and heartbroken after hearing that news."
Output: {"primary_emotion": "sad", "emoji": "😢", "secondary_emotions": ["heartbroken", "gloomy"], "glow_theme": "from-blue-500/20 to-indigo-600/20"}
</example>

<example>
Input: "ဒီနေ့တော့ ဘာမှန်းလည်း မသိဘူး၊ ရင်ထဲမှာ ထူးထူးဆန်းဆန်းကြီး ဖြစ်နေတယ်။ ဘာကိုမှလည်း စိတ်မဝင်စားချင်ဘူး၊ ဘာလုပ်ရမှန်းလည်း လုံးဝ မသိတော့ဘူး။"
Output: {"primary_emotion": "confused", "emoji": "🤔", "secondary_emotions": ["uncertain", "lost", "indifferent"], "glow_theme": "from-slate-700/20 to-slate-900/20"}
</example>

<example>
Input: "အရမ်းကို ဒေါသထွက်မိတယ်, ဘာလို့ ငါ့ကို လာမပြောတာလဲ!"
Output: {"primary_emotion": "angry", "emoji": "😡", "secondary_emotions": ["furious", "annoyed"], "glow_theme": "from-red-500/20 to-orange-600/20"}
</example>`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
    messages: [
      { role: "system", content: SYSTEMPROMPT },
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