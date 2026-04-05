import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.access_token) {
    redirect("/login");
  }

  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.log(
      "Proaktive Prüfung: Google Token ist abgelaufen. Leite Logout ein.",
    );

    redirect("/auth/logout");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main>{children}</main>
    </div>
  );
}
