import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Profile not found. Please contact support." },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { display_name } = body;

    const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) {
      if (typeof display_name !== "string") {
        return NextResponse.json(
          { error: "Display Name must be a string" },
          { status: 400 }
        );
      }
      const trimmed = display_name.trim();
      if (trimmed.length < 4 || trimmed.length > 100) {
        return NextResponse.json(
          { error: "Display Name must be 4–100 characters" },
          { status: 400 }
        );
      }
      updateData.display_name = trimmed;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
