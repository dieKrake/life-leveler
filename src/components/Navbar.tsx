import NavUser from "./NavUser";
import NavLinks from "./NavLinks";
import LanguageToggle from "./LanguageToggle";
import { Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import PlayerStatsBar from "./PlayerStatsBar";

export default async function Navbar() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/20 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl shadow-xl border-none">
      <div className="relative flex h-16 items-center justify-between px-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LifeLeveler
          </span>
        </div>

        {/* Navigation Links - Absolutely centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavLinks />
        </div>

        {/* User Section - Always on the right */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <NavUser />
        </div>
      </div>
      {session && <PlayerStatsBar />}
    </nav>
  );
}
