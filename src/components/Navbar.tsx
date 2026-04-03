import NavUser from "./NavUser";
import NavLinks from "./NavLinks";
import LanguageToggle from "./LanguageToggle";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import PlayerStatsBar from "./PlayerStatsBar";
import Logo from "./Logo";

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
        <Logo logoName="LifeLeveler" />
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <NavUser />
        </div>
      </div>
      {session && <PlayerStatsBar />}
    </nav>
  );
}
