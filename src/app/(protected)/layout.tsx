// app/(protected)/layout.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.provider_token) {
    redirect("/login");
  }

  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
      },
    }
  );

  if (!response.ok) {
    console.log(
      "Proaktive Prüfung: Google Token ist abgelaufen. Leite Logout ein."
    );

    redirect("/auth/logout");
  }

  return <>{children}</>;
}
