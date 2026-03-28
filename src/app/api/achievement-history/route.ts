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

  try {
    const { data: history, error } = await supabase.rpc(
      "get_achievement_history",
      { p_user_id: user.id }
    );

    if (error) {
      console.error("Fehler beim Laden der Achievement History:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary stats
    const entries = history || [];
    const uniqueAchievements = new Set(entries.map((e: { achievement_id: number }) => e.achievement_id)).size;
    const highestPrestige = entries.length > 0 
      ? Math.max(...entries.map((e: { prestige_level: number }) => e.prestige_level))
      : 0;

    return NextResponse.json({
      entries,
      totalAchievements: entries.length,
      uniqueAchievements,
      highestPrestige,
    });
  } catch (error) {
    console.error("Unerwarteter Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
