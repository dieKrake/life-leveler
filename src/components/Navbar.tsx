import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import NavUser from "./NavUser";
import {
  Home,
  CheckSquare,
  User,
  ShoppingBag,
  Trophy,
  BarChart3,
  Sparkles,
} from "lucide-react";
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
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/todos" className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    <span>Todos</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Profil</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/shop" className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shop</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/challenges" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>Herausforderungen</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
                >
                  <Link href="/stats" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Statistiken</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Section - Always on the right */}
        <div className="flex items-center">
          <NavUser />
        </div>
      </div>
      {session && <PlayerStatsBar />}
    </nav>
  );
}
