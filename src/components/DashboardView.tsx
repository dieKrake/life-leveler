"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Target,
  Trophy,
  Zap,
  Gem,
  Flame,
  Crown,
  ArrowRight,
  Plus,
  ShoppingBag,
  BarChart3,
} from "lucide-react";
import {
  useAchievements,
  useChallenges,
  usePlayerStats,
  useTodos,
} from "./UnifiedDataProvider";
import { GRADIENTS, ICON_MAP } from "@/lib/constants";
import DashboardStatsCard from "./dashboard/DashboardStatsCard";
import DashboardTodoItem from "./dashboard/DashboardTodoItem";
import DashboardChallengeItem from "./dashboard/DashboardChallengeItem";
import AchievementCard from "./achievements/AchievementCard";

const quickActions = [
  {
    title: "Todo hinzufügen",
    icon: Plus,
    href: "/todos",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Challenges",
    icon: Target,
    href: "/challenges",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Shop besuchen",
    icon: ShoppingBag,
    href: "/shop",
    color: "from-green-500 to-green-600",
  },
  {
    title: "Statistiken",
    icon: BarChart3,
    href: "/stats",
    color: "from-orange-500 to-orange-600",
  },
];

export default function DashboardView() {
  const { data: todos } = useTodos();
  const { data: challenges } = useChallenges();
  const { data: achievements } = useAchievements();
  const { data: playerStats } = usePlayerStats();

  const completedTodos = todos?.filter((todo) => todo.is_completed).length;
  const totalTodos = todos?.length;

  const allChallenges = [
    ...(challenges?.daily || []),
    ...(challenges?.weekly || []),
  ];

  return (
    <div className={`min-h-screen ${GRADIENTS.pageBg} p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Willkommen zurück! Hier ist dein Fortschritt im Überblick.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <DashboardStatsCard
            title="Level"
            value={playerStats?.level || 0}
            subtitle={`${playerStats?.xp}/${playerStats?.xp_for_next_level} XP`}
            Icon={Crown}
            iconColor="text-purple-400"
            gradient={`${GRADIENTS.level} border`}
            progress={
              playerStats?.xp && playerStats?.xp_for_next_level
                ? { current: playerStats.xp, total: playerStats.xp_for_next_level }
                : undefined
            }
          />

          <DashboardStatsCard
            title="Total XP"
            value={playerStats?.total_xp || 0}
            subtitle={
              playerStats?.xp_for_next_level && playerStats?.xp
                ? `${playerStats.xp_for_next_level - playerStats.xp} XP bis zum nächsten Level`
                : undefined
            }
            Icon={Zap}
            iconColor="text-yellow-400"
            gradient={`${GRADIENTS.xp} border`}
          />

          <DashboardStatsCard
            title="Gems"
            value={playerStats?.gems || 0}
            subtitle="Sammle mehr im Shop!"
            Icon={Gem}
            iconColor="text-blue-400"
            gradient="from-emerald-500/20 to-teal-500/20 border-emerald-500/30 border"
          />

          <DashboardStatsCard
            title="Streak"
            value={playerStats?.current_streak || 0}
            subtitle={`${playerStats?.streak_multiplier}x Multiplier`}
            Icon={Flame}
            iconColor="text-red-400"
            gradient="from-red-500/20 to-pink-500/20 border-red-500/30 border"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            Schnellzugriff
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-r ${action.color} p-4 rounded-xl text-white cursor-pointer transition-all duration-200 hover:shadow-lg`}
                >
                  <action.icon className="w-8 h-8 mb-2" />
                  <div className="font-medium">{action.title}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Todos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                Heutige Todos
              </h2>
              <Link href="/todos">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                >
                  Alle anzeigen <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Fortschritt</span>
                <span>
                  {completedTodos}/{totalTodos} abgeschlossen
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                {typeof totalTodos === "number" &&
                  typeof completedTodos === "number" &&
                  totalTodos > 0 && (
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(completedTodos / totalTodos) * 100}%`,
                      }}
                    />
                  )}
              </div>
            </div>

            <div
              className="space-y-3 h-[500px] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#475569 #1e293b",
              }}
            >
              {todos?.map((todo, index) => (
                <DashboardTodoItem key={todo.id} todo={todo} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Active Challenges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Aktive Challenges
              </h2>
              <Link href="/challenges">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                >
                  Alle anzeigen <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <div
              className="space-y-4 h-[550px] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#475569 #1e293b",
              }}
            >
              {allChallenges.map((challenge, index) => (
                <DashboardChallengeItem
                  key={challenge.challenge_id}
                  challenge={challenge}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Errungenschaften
            </h2>
            <Link href="/profile">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1 text-sm"
              >
                Alle anzeigen <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements?.slice(0, 8).map((achievement, index) => {
              const IconComponent =
                ICON_MAP[achievement.icon as keyof typeof ICON_MAP] || Target;

              return (
                <motion.div
                  key={achievement.achievement_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    achievement.is_unlocked
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-100"
                      : "bg-slate-700/50 border-slate-600 text-slate-400"
                  }`}
                >
                  <IconComponent className="w-6 h-6 mb-2" />
                  <h3 className="font-medium mb-1 text-sm">{achievement.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">
                    {achievement.description}
                  </p>

                  {!achievement.is_unlocked && achievement.current_progress !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Fortschritt</span>
                        <span>
                          {achievement.current_progress}/
                          {achievement.condition_value}
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-1">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (achievement.current_progress /
                                achievement.condition_value) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.is_unlocked && (
                    <div className="flex items-center gap-1 text-xs text-yellow-300">
                      <Trophy className="w-3 h-3" />
                      Freigeschaltet
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
