import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function checkSession() {
  const supabase = createClientComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.provider_token) {
    return { valid: false };
  }

  // Verify the Google token is still valid
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${session.provider_token}` },
        cache: "no-store",
      }
    );

    return { valid: response.ok };
  } catch (error) {
    console.error("Error verifying session:", error);
    return { valid: false };
  }
}
