// Der neue, vereinfachte NavUser.tsx
"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AuthButton from "./AuthButton";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Zap, Gem } from "lucide-react";

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

  if (!user && !isOnLoginPage) {
    return <AuthButton user={user} />;
  }

  if (!user) {
    return null;
  }

  if (isOnLoginPage) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {/* User Stats */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-100">1,250</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
          <Gem className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-100">42</span>
        </div>
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-100"
        >
          Level 12
        </Badge>
      </div>

      {/* User Avatar & Info */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-slate-200">
            {user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Player"}
          </span>
          <span className="text-xs text-slate-400">Level 12 • Streak 7</span>
        </div>

        <div className="relative">
          <Avatar className="w-10 h-10 border-2 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg">
            <AvatarImage
              src={
                user.user_metadata?.avatar_url || user.user_metadata?.picture
              }
              alt="Profile"
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {(user.user_metadata?.full_name ||
                user.email ||
                "P")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
        </div>
      </div>

      <AuthButton user={user} />
    </div>
  );
}
