import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all user data
    const { error: entriesError } = await supabase
      .from("journal_entries")
      .delete()
      .eq("user_id", user.id);

    if (entriesError) throw new Error("Failed to delete journal entries");

    const { error: reportsError } = await supabase
      .from("monthly_reports")
      .delete()
      .eq("user_id", user.id);

    if (reportsError) throw new Error("Failed to delete monthly reports");

    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", user.id);

    if (profileError) throw new Error("Failed to delete user profile");

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
