import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

  const { data: stats, error } = await supabase
    .from("player_stats")
    .select("xp, level")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Fehler beim Laden der Player Stats:", error);
    // Gib Standardwerte zurück, falls noch kein Eintrag existiert
    if (error.code === "PGRST116") {
      return NextResponse.json({ level: 1, xp: 0 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(stats);
}
