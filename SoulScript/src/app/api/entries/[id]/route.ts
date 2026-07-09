import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MOOD_THEMES } from "@/lib/mood-themes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { primary_emotion, emoji } = body;

    if (!primary_emotion && !emoji) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    if (primary_emotion && !(primary_emotion in MOOD_THEMES)) {
      return NextResponse.json(
        { error: "Invalid primary emotion" },
        { status: 400 }
      );
    }

    if (emoji && typeof emoji === "string" && [...emoji].length !== 1) {
      return NextResponse.json(
        { error: "Emoji must be a single character" },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    if (primary_emotion) {
      updateData.primary_emotion = primary_emotion;
      updateData.bg_glow_gradient = MOOD_THEMES[primary_emotion];
    }
    if (emoji) {
      updateData.emoji = emoji;
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error("Mood override error:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from("journal_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json(
        { error: "Entry not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
