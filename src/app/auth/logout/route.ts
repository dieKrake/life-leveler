// app/auth/logout/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Session holen, um den Nutzer ausloggen zu können
  await supabase.auth.signOut();

  // Nach dem Logout zur Login-Seite umleiten
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
