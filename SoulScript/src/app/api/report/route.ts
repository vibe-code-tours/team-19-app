import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";
import { callAIForReport } from "@/lib/ai";
import {
  computeMoodDistribution,
  computeDaysJournaled,
  computeStreak,
} from "@/lib/report-stats";

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

    // Fetch entries for the month (newest first)
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

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

    // Check if an existing report is already up-to-date
    const { data: existingReport } = await supabase
      .from("monthly_reports")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("month_year", month)
      .single();

    if (existingReport) {
      const latestEntry = entries[0]; // entries are sorted by created_at desc
      const reportTime = new Date(existingReport.created_at).getTime();
      const latestEntryTime = new Date(latestEntry.created_at).getTime();

      // If no new entries since last report, return existing
      if (latestEntryTime <= reportTime) {
        const { data: fullReport } = await supabase
          .from("monthly_reports")
          .select("summary_overview, dominant_mood, pattern_insights, actionable_recommendations")
          .eq("user_id", user.id)
          .eq("month_year", month)
          .single();

        if (fullReport) {
          return NextResponse.json({ report: fullReport, cached: true });
        }
      }
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
          created_at: new Date().toISOString(),
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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1).toISOString();
    const endDate = new Date(year, monthNum, 1).toISOString();

    // Fetch entries for stats (no content needed)
    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("primary_emotion, emoji, created_at, secondary_emotions")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .is("deleted_at", null);

    if (entriesError) throw entriesError;

    // Fetch existing AI report (may be null)
    const { data: report, error: reportError } = await supabase
      .from("monthly_reports")
      .select(
        "summary_overview, dominant_mood, pattern_insights, actionable_recommendations, created_at"
      )
      .eq("user_id", user.id)
      .eq("month_year", month)
      .single();

    // Ignore "not found" errors for report (PGRST116 = no rows)
    if (reportError && reportError.code !== "PGRST116") throw reportError;

    const entryCount = entries?.length || 0;
    const moodDistribution = computeMoodDistribution(entries || []);
    const daysJournaled = computeDaysJournaled(entries || []);
    const streak = computeStreak(entries || []);

    // Get latest entry time for staleness check
    const latestEntryTime = entries && entries.length > 0
      ? entries.reduce((latest, entry) =>
          new Date(entry.created_at) > new Date(latest) ? entry.created_at : latest
        , entries[0].created_at)
      : null;

    return NextResponse.json({
      stats: {
        entryCount,
        daysJournaled,
        moodDistribution,
        streak,
      },
      report: report
        ? {
            summary: report.summary_overview,
            dominantMood: report.dominant_mood,
            insights: report.pattern_insights,
            recommendations: report.actionable_recommendations,
          }
        : null,
      latestEntryTime,
      reportCreatedAt: report?.created_at || null,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
