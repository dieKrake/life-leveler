/**
 * Global constants and configurations
 */

import { Trophy, Flame, Gem, TrendingUp, Target } from "lucide-react";

/**
 * Icon mapping for achievements and challenges
 */
export const ICON_MAP = {
  Trophy,
  Flame,
  Gem,
  TrendingUp,
  Target,
} as const;

export type IconType = keyof typeof ICON_MAP;

/**
 * Common gradient backgrounds used throughout the app
 */
export const GRADIENTS = {
  // Page backgrounds
  pageBg: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
  
  // Card backgrounds
  cardBg: "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
  cardBorder: "border-slate-700/50",
  
  // Stats badges
  level: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  xp: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
  gems: "from-blue-500/20 to-purple-500/20 border-blue-500/30",
  streak: "from-orange-500/20 to-red-500/20 border-orange-500/30",
  prestige: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
  
  // Progress bars
  xpProgress: "from-blue-500 to-purple-500",
  streakProgress: "from-orange-400 to-red-400",
  achievementProgress: "from-purple-400 to-pink-400",
  todoProgress: "from-green-400 to-blue-400",
  
  // Buttons
  primaryButton: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
  successButton: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
  dangerButton: "from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700",
} as const;

/**
 * Animation durations and delays
 */
export const ANIMATIONS = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    verySlow: 1.2,
  },
  delay: {
    none: 0,
    short: 0.1,
    medium: 0.2,
    long: 0.3,
  },
} as const;

/**
 * Quick action items for dashboard
 */
export const QUICK_ACTIONS = [
  {
    title: "Todo hinzufügen",
    icon: "Plus",
    href: "/todos",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Challenges",
    icon: "Target",
    href: "/challenges",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Shop besuchen",
    icon: "ShoppingBag",
    href: "/shop",
    color: "from-green-500 to-green-600",
  },
  {
    title: "Statistiken",
    icon: "BarChart3",
    href: "/stats",
    color: "from-orange-500 to-orange-600",
  },
] as const;
