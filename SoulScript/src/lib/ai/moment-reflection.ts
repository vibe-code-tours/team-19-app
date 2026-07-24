import { openai } from "./client";
import { parseJsonResponse } from "./parse";

export interface MomentReflectionInput {
  dominantMood: string;
  emoji: string;
  dominantEntries: {
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
 * Takes the dominant mood and ALL entries matching that mood, lets the AI
 * analyze which ones are most content-rich (based on depth, specificity,
 * vulnerability — not character count), then produces a singular reflection.
 */
export async function callAIForMoment(
  input: MomentReflectionInput,
): Promise<MomentReflectionResult> {
  const entrySummaries = input.dominantEntries
    .map(
      (e, i) =>
        `Entry ${i + 1}: Emotion=${e.primary_emotion} (${e.emoji}), Date=${e.created_at.slice(0, 10)}\nContent: ${e.content}`,
    )
    .join("\n\n");

  const systemPrompt = `You are an empathetic AI psychologist identifying a single moment worth noting from a month of journal entries.

Your task has two steps:
Step 1 — Review ALL entries provided below. Analyze each one for emotional depth, specific details, vulnerability, and personal meaning. Identify which entry or entries are the most content-rich and emotionally substantive (based on substance, not word count).
Step 2 — Extract one moment worth noting which is also a entry among the entry list feed to you, not a summary of the entire month. For example,"ဒီနေ့ အခက်အခဲလေးတွေရှိပေမယ့် လက်မလျှော့ဘဲ ဆက်ကြိုးစားခဲ့တယ်။ နေ့တိုင်း နည်းနည်းချင်းတိုးတက်လာတယ်လို့ ယုံကြည်ပြီး ရှေ့ဆက်သွားချင်တယ်။
ဒီနေ့က တကယ်ကို ပျော်စရာကောင်းတဲ့နေ့ပါ။ လုပ်စရာတွေကို အချိန်မီပြီးအောင်လုပ်နိုင်ခဲ့ပြီး ကိုယ့်ကိုယ်ကိုယ်လည်း ဂုဏ်ယူမိတယ်။ သူငယ်ချင်းတွေနဲ့ အတူရယ်မောရင်း ကောင်းမွန်တဲ့နေ့တစ်နေ့ဖြစ်ခဲ့တယ်။"

Return ONLY a valid JSON object (no markdown, no code blocks) with a single key: 'reflection'. The reflection should be 1-3 sentences focusing on one specific moment or insight that stands out: a contrast, an outlier, a pattern that matters. Be specific and human, not generic. Write in first-person voice as if addressing the user.

The user's dominant mood this month is "${input.dominantMood}" (${input.emoji}). Here are all the entries reflecting this mood — analyze them for richness and substance, then identify the one moment worth noting:\n\n${entrySummaries}\n\nWhat is the one moment worth noting?`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model:
          process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
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
