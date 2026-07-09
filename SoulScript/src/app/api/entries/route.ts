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
    const month = searchParams.get("month"); // YYYY-MM format

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1).toISOString();
    const endDate = new Date(year, monthNum, 1).toISOString();

    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lt("created_at", endDate)
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
