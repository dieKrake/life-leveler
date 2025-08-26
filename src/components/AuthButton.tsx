// src/components/AuthButton.tsx
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return user ? (
    <Button variant="destructive" onClick={handleSignOut}>
      Abmelden
    </Button>
  ) : (
    <Button onClick={handleSignIn}>Anmelden</Button>
  );
}
