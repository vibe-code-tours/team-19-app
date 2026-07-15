import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

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
    const day = searchParams.get("day"); // YYYY-MM-DD format
    const month = searchParams.get("month"); // YYYY-MM format

    let startDate: string;
    let endDate: string;

    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
      // Day param takes precedence over month
      startDate = `${day}T00:00:00`;
      endDate = `${day}T23:59:59.999`;
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNum] = month.split("-").map(Number);
      startDate = new Date(year, monthNum - 1, 1).toISOString();
      endDate = new Date(year, monthNum, 1).toISOString();
    } else {
      return NextResponse.json(
        { error: "Provide day (YYYY-MM-DD) or month (YYYY-MM)" },
        { status: 400 }
      );
    }

    // Build query — use lte for day param (end-of-day inclusive), lt for month param
    const baseQuery = supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate);

    const dateQuery = day
      ? baseQuery.lte("created_at", endDate)
      : baseQuery.lt("created_at", endDate);

    const { data: entries, error } = await dateQuery
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Decrypt entries on server
    const decryptedEntries = entries?.map((e) => ({
      ...e,
      content: decrypt(e.content, e.content_iv),
    })) || [];

    return NextResponse.json({ entries: decryptedEntries });
  } catch (error) {
    console.error("Entries fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
