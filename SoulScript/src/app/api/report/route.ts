import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";
import { callAIForReport } from "@/lib/ai";

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
