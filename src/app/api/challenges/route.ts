import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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
    // Reset expired challenges and create new ones
    const { error: resetError } = await supabase.rpc(
      "reset_expired_challenges",
      {
        p_user_id: session.user.id,
      }
    );

    if (resetError) {
      console.error("Error resetting challenges:", resetError);
    }

    // Initialize challenges for user if they don't exist
    const { error: initError } = await supabase.rpc(
      "initialize_user_challenges",
      {
        p_user_id: session.user.id,
      }
    );

    if (initError) {
      console.error("Error initializing challenges:", initError);
    }

    // Get user's active challenges
    const { data, error } = await supabase.rpc("get_user_challenges", {
      p_user_id: session.user.id,
    });

    if (error) {
      console.error("Error fetching challenges:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Herausforderungen" },
        { status: 500 }
      );
    }

    // Group challenges by type
    const dailyChallenges = data?.filter((c: any) => c.type === "daily") || [];
    const weeklyChallenges =
      data?.filter((c: any) => c.type === "weekly") || [];

    console.log("Daily Challenges:", dailyChallenges);
    console.log("Weekly Challenges:", weeklyChallenges);
    return NextResponse.json({
      daily: dailyChallenges,
      weekly: weeklyChallenges,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
