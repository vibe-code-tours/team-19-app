import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";
import OpenAI from "openai";

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

  // Try parsing directly first
  try {
    return JSON.parse(cleaned);
  } catch {
    // If direct parse fails, try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  }
}

interface ReportResult {
  summary_overview: string;
  dominant_mood: string;
  pattern_insights: string;
  actionable_recommendations: { title: string; description: string }[];
}

async function callAIForReport(
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month } = await request.json();

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1).toISOString();
    const endDate = new Date(year, monthNum, 1).toISOString();

    // Fetch entries for the month
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .is("deleted_at", null);

    if (error) throw error;

    if (!entries || entries.length < 10) {
      return NextResponse.json(
        {
          error:
            "Keep journaling! You need at least 10 entries to unlock your monthly journey.",
          count: entries?.length || 0,
        },
        { status: 400 }
      );
    }

    // Decrypt entries for AI analysis
    const decryptedEntries = entries.map((e) => ({
      ...e,
      content: decrypt(e.content, e.content_iv),
    }));

    // Generate report
    const report = await callAIForReport(decryptedEntries);

    // Upsert report
    const { data: savedReport, error: saveError } = await supabase
      .from("monthly_reports")
      .upsert(
        {
          user_id: user.id,
          month_year: month,
          summary_overview: report.summary_overview,
          dominant_mood: report.dominant_mood,
          pattern_insights: report.pattern_insights,
          actionable_recommendations: (Array.isArray(report.actionable_recommendations)
            ? report.actionable_recommendations
            : []
          ).map((r) => JSON.stringify(r)),
        },
        { onConflict: "user_id,month_year" }
      )
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ report: savedReport });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
