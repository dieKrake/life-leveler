// app/api/player-stats/route.ts
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
    .rpc("get_player_stats_with_level_info")
    .single(); // <--- DIESE ZEILE IST NEU UND WICHTIG

  if (error) {
    console.error("Fehler beim Laden der Player Stats:", error);
    // Behandelt den Fall, dass für einen Nutzer noch keine Stats existieren
    if (error.code === "PGRST116") {
      // Wir holen die Startwerte für Level 1 manuell aus der levels Tabelle
      const { data: level1Stats } = await supabase
        .from("levels")
        .select("xp_required")
        .eq("level", 1)
        .single();
      const { data: level2Stats } = await supabase
        .from("levels")
        .select("xp_required")
        .eq("level", 2)
        .single();
      return NextResponse.json({
        level: 1,
        xp: 0,
        xp_for_current_level: level1Stats?.xp_required ?? 0,
        xp_for_next_level: level2Stats?.xp_required ?? 100,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(stats);
}
