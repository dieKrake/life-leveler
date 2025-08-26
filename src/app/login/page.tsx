// app/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Lade...</p>
      </div>
    );
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes:
          "https://www.googleapis.com/auth/calendar profile email https://www.googleapis.com/auth/tasks",
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Anmelden</h1>
      <p className="mb-8 text-center">
        Bitte melde dich an, um auf alle Funktionen zuzugreifen.
      </p>
      <Button onClick={handleSignIn}>Mit Google anmelden</Button>
    </div>
  );
}
