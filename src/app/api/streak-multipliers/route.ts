import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { StreakMultiplier } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  const { data: multipliers, error } = await supabase
    .from("streak_multipliers")
    .select("*")
    .order("min_streak_days", { ascending: true });

  if (error) {
    console.error("Fehler beim Laden der Streak Multipliers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(multipliers);
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  try {
    const { id, multiplier } = await request.json();

    if (!id || !multiplier || multiplier <= 0) {
      return NextResponse.json(
        { error: "ID und gültiger Multiplier sind erforderlich" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("streak_multipliers")
      .update({ multiplier })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Fehler beim Aktualisieren des Streak Multipliers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler beim Parsen der Anfrage:", error);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
