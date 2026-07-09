import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

interface ReportResult {
  summary_overview: string;
  dominant_mood: string;
  pattern_insights: string;
  actionable_recommendations: string[];
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

  const systemPrompt = `You are an empathetic AI psychologist analyzing a month of journal entries. Return a strictly valid JSON object with: 'summary_overview' (2-3 sentence overview of the month), 'dominant_mood' (1 word, the most frequent emotion), 'pattern_insights' (2-3 insights about emotional patterns, each as a separate sentence), 'actionable_recommendations' (array of 2-3 short recommendation titles like "Morning Breathing Exercise", "Digital Detox Evenings", "Gratitude Journaling").`;

  const userPrompt = `Analyze these ${entries.length} journal entries from this month:\n\n${entrySummaries}`;

  // Try OpenAI first
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch {
    // Fall through to OpenRouter
  }

  // Fallback
  const fallbackResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      }),
    }
  );

  if (!fallbackResponse.ok) {
    throw new Error("AI providers unavailable");
  }

  const fallbackData = await fallbackResponse.json();
  return JSON.parse(fallbackData.choices[0].message.content);
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
          actionable_recommendations: report.actionable_recommendations,
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
