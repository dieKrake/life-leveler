"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Home,
  CheckSquare,
  User,
  ShoppingBag,
  Trophy,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const navItems = [
  {
    key: "nav.dashboard",
    href: "/dashboard",
    icon: Home,
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    key: "nav.todos",
    href: "/todos",
    icon: CheckSquare,
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    key: "nav.profile",
    href: "/profile",
    icon: User,
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    key: "nav.shop",
    href: "/shop",
    icon: ShoppingBag,
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    key: "nav.challenges",
    href: "/challenges",
    icon: Trophy,
    gradient: "from-red-500/20 to-pink-500/20",
  },
  {
    key: "nav.stats",
    href: "/stats",
    icon: BarChart3,
    gradient: "from-indigo-500/20 to-purple-500/20",
  },
];

export default function NavLinks() {
  const { t } = useTranslation();

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-1">
        {navItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              asChild
              className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-lg hover:scale-105"
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span>{t(item.key)}</span>
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                ></div>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
