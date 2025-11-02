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
    const { data: achievements, error } = await supabase.rpc(
      "get_user_achievements_with_progress",
      { user_id_param: user.id }
    );

    if (error) {
      console.error("Fehler beim Laden der Achievements:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Unerwarteter Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
