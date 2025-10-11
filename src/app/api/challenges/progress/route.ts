import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  try {
    const { challenge_id, increment = 1 } = await request.json();

    if (!challenge_id) {
      return NextResponse.json(
        { error: "Challenge ID fehlt" },
        { status: 400 }
      );
    }

    // Update challenge progress
    const { data, error } = await supabase.rpc("update_challenge_progress", {
      p_user_id: session.user.id,
      p_challenge_id: challenge_id,
      p_increment: increment,
    });

    if (error) {
      console.error("Error updating challenge progress:", error);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren des Fortschritts" },
        { status: 500 }
      );
    }

    const result = data?.[0];

    return NextResponse.json({
      completed: result?.challenge_completed || false,
      xp_earned: result?.xp_earned || 0,
      gems_earned: result?.gems_earned || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
