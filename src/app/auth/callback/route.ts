// app/auth/callback/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  console.log("Auth callback - Code:", code ? "present" : "missing");
  console.log("Auth callback - Error:", error);
  console.log("Auth callback - Error Description:", error_description);

  if (error) {
    console.error("Auth error:", error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      console.log("Session exchange result:", {
        success: !exchangeError,
        user: data?.user?.email,
        error: exchangeError?.message,
      });

      if (exchangeError) {
        console.error("Session exchange error:", exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }

      if (data?.user) {
        console.log("Login successful for user:", data.user.email);
        return NextResponse.redirect(requestUrl.origin);
      }
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_failed`
      );
    }
  }

  console.log("No code provided, redirecting to login");
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
