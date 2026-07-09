import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { validateGlowTheme, MOOD_THEMES } from "@/lib/mood-themes";
import { detectLanguage } from "@/lib/language";
import OpenAI from "openai";

const MAX_LENGTH = 5000;
const MIN_LENGTH = 10;
const DAILY_LIMIT = 10;

const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_AI_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

function parseJsonResponse<T>(content: string): T {
  // Strip markdown code blocks if present
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

interface AnalysisResult {
  primary_emotion: string;
  emoji: string;
  secondary_emotions: string[];
  glow_theme: string;
}

async function callAI(
  content: string,
  _language: "burmese" | "english"
): Promise<AnalysisResult> {
  const systemPrompt = `You are an empathetic, highly analytical, emotionally intelligent AI psychologist. The input text may be in Burmese or English. Analyze the text payload regardless of language. Always return emotion labels in English. Return a strictly valid JSON object containing: 'primary_emotion' (1 word, in English), 'emoji' (1 character), 'secondary_emotions' (string array of 1-3 terms in English — only include emotions you genuinely identify in the text; if the input is sparse, infer from tone, brevity, or word choice — do not pad), and 'glow_theme' (a valid Tailwind gradient class from the allowed mood themes: ${Object.values(MOOD_THEMES).join(", ")}).`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENROUTER_AI_MODEL || "meta-llama/llama-3-8b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 300,
  });
  return parseJsonResponse<AnalysisResult>(response.choices[0].message.content || "{}");
}

function validateResult(result: Partial<AnalysisResult>): AnalysisResult {
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length < MIN_LENGTH) {
      return NextResponse.json(
        { error: `Entry must be at least ${MIN_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Rate limit: 10 entries per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .is("deleted_at", null);

    if (count && count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error:
            "You've reached your daily limit of 10 entries. Come back tomorrow!",
        },
        { status: 429 }
      );
    }

    // Detect language and analyze
    const language = detectLanguage(content);
    const truncatedContent = content.slice(0, MAX_LENGTH);
    const analysis = await callAI(truncatedContent, language);
    const validated = validateResult(analysis);

    // Encrypt content
    const { encrypted, iv } = encrypt(truncatedContent);

    // Insert entry
    const { data: entry, error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        content: encrypted,
        content_iv: iv,
        primary_emotion: validated.primary_emotion,
        emoji: validated.emoji,
        secondary_emotions: validated.secondary_emotions,
        bg_glow_gradient: validated.glow_theme,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze entry" },
      { status: 500 }
    );
  }
}
