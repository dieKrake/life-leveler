// src/components/AuthButton.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return user ? (
    <Button variant="destructive" onClick={handleSignOut}>
      {t("nav.signOut")}
    </Button>
  ) : (
    <Button
      className="bg-gradient-to-br from-purple-400 via-pink-500 to-red-500"
      onClick={handleSignIn}
    >
      {t("nav.signIn")}
    </Button>
  );
}
