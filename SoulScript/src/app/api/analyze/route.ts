import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { callAI, validateResult } from "@/lib/ai";

const MAX_LENGTH = 5000;
const MIN_LENGTH = 10;
const DAILY_LIMIT = 10;

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

    // Analyze content
    const truncatedContent = content.slice(0, MAX_LENGTH);
    const analysis = await callAI(truncatedContent);
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
