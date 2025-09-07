// Der neue, vereinfachte NavUser.tsx
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AuthButton from "./AuthButton";
import type { User } from "@supabase/supabase-js";

export default function NavUser() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();
  const pathname = usePathname();

  const isOnLoginPage = pathname === "/login";

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <div className="flex flex-row gap-4 items-center h-full">
      {user && <p className="">{user.email}</p>}

      {!isOnLoginPage && <AuthButton user={user} />}
    </div>
  );
}
