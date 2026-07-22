import { openai } from "./client";
import { parseJsonResponse } from "./parse";
import type { AnalysisResult } from "./types";
import { validateGlowTheme, MOOD_THEMES, MOOD_EMOJIS } from "@/lib/mood-themes";

const ALLOWED_PRIMARY_EMOTIONS = ["joy", "sadness", "anger", "fear", "surprise", "disgust", "calm", "love", "anxious", "uncertain"];

export async function callAI(
  content: string,
): Promise<AnalysisResult> {
  const systemPrompt = `You are an empathetic, highly analytical, emotionally intelligent AI psychologist. 
The input text may be in Burmese or English. Analyze the text payload regardless of language. 
Always return emotion labels in English lowercase to match the theme keys. 

Rules:
- 'primary_emotion' MUST be strictly one of these exact terms: ${ALLOWED_PRIMARY_EMOTIONS.join(", ")}.
- 'emoji' (1 character representing the mood).
- 'secondary_emotions' (string array of 1-3 standard terms in English; keep them consistent and avoid chaotic synonym switching).
- 'glow_theme' (a valid Tailwind gradient class from the allowed mood themes: ${Object.values(MOOD_THEMES).join(", ")}).

Return ONLY a valid JSON object (no markdown, no code blocks).

Here are examples of expected outputs to maintain consistency:

Input: "I am so excited and happy about this new project!"
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["excited", "optimistic"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}

Input: "ဒီနေ့တော့ အရာရာ အင်မတန် အဆင်ပြေပြီး ပျော်စရာတွေ ချည်းပဲ..."
Output: {"primary_emotion": "joy", "emoji": "😊", "secondary_emotions": ["grateful", "happy"], "glow_theme": "from-amber-500/20 to-yellow-600/20"}

Input: "I feel so down and heartbroken after hearing that news."
Output: {"primary_emotion": "sadness", "emoji": "😢", "secondary_emotions": ["heartbroken", "gloomy"], "glow_theme": "from-blue-500/20 to-indigo-600/20"}

Input: "ရင်ထဲမှာ အရမ်းနာကျင်ပြီး ဝမ်းနည်းနေမိတယ်..."
Output: {"primary_emotion": "sadness", "emoji": "😢", "secondary_emotions": ["lonely", "grief"], "glow_theme": "from-blue-500/20 to-indigo-600/20"}

Input: "ဒီနေ့ ကျရောက်တဲ့ ကျောင်းပြီးခါနီး အခမ်းအနားမှာ သူငယ်ချင်းတွေနဲ့အတူ ပျော်စရာအမှတ်တရတွေ ဖန်တီးနိုင်ခဲ့လို့ ရင်ထဲမှာ အလွန်တရာမှ ဝမ်းမြောက်ကြည်နူးမိပေမဲ့၊ မကြာခင်မှာ ဒီမြို့ကိုစွန့်ခွာပြီး တစ်ယောက်ချင်းစီ လမ်းခွဲကြရတော့မှာကို တွေးမိတိုင်း ရင်ထဲမှာ တအားနာကျင်ပြီး ဝမ်းနည်းမှုတွေကလည်း ကြီးစိုးနေပါတယ်..."
Output: {"primary_emotion": "sadness", "emoji": "😢", "secondary_emotions": ["grateful", "heartbroken", "nostalgic"], "glow_theme": "from-blue-500/20 to-indigo-600/20"}`;

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

  let primary = (result.primary_emotion || "uncertain").toLowerCase();
  if (!ALLOWED_PRIMARY_EMOTIONS.includes(primary)) {
    primary = "uncertain";
  }

  const emoji = MOOD_EMOJIS[primary] || "💭";

  return {
    primary_emotion: primary,
    emoji: emoji,
    secondary_emotions: emotions,
    glow_theme: validateGlowTheme(result.glow_theme || ""),
  };
}