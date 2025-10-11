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
    const { userChallengeId } = await request.json();

    if (!userChallengeId) {
      return NextResponse.json(
        { error: "Challenge ID fehlt" },
        { status: 400 }
      );
    }

    // Call the claim function
    const { data, error } = await supabase.rpc("claim_challenge_reward", {
      p_user_challenge_id: userChallengeId,
    });

    if (error) {
      console.error("Error claiming challenge reward:", error);
      return NextResponse.json(
        { error: "Fehler beim Einfordern der Belohnung" },
        { status: 500 }
      );
    }

    const result = data[0];

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      xp_earned: result.xp_earned,
      gems_earned: result.gems_earned,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in claim-challenge route:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
