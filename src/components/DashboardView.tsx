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
  ShoppingBag,
  User,
  BarChart3,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  Award,
  Plus,
  ArrowRight,
  Crown,
  Gift,
} from "lucide-react";
import {
  useAchievements,
  useChallenges,
  usePlayerStats,
  useTodos,
} from "./UnifiedDataProvider";

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

const iconMap = {
  Trophy,
  Flame,
  Gem,
  TrendingUp,
  Target,
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
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
          {/* Level Card */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-purple-400" />
              <span className="text-purple-100 font-medium">Level</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {playerStats?.level}
            </div>
            <div className="text-xs text-blue-200">
              {playerStats?.xp}/{playerStats?.xp_for_next_level} XP
            </div>
            <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
              {playerStats && playerStats?.xp_for_next_level && (
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (playerStats?.xp / playerStats?.xp_for_next_level) * 100
                    }%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-100 font-medium">Total XP</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {playerStats?.total_xp}
            </div>
            {playerStats?.xp_for_next_level && playerStats?.xp && (
              <div className="text-xs text-yellow-200">
                {playerStats?.xp_for_next_level - playerStats?.xp} XP bis zum
                nächsten Level
              </div>
            )}
          </div>

          {/* Gems Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Gem className="w-6 h-6 text-blue-400" />
              <span className="text-blue-100 font-medium">Gems</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {playerStats?.gems}
            </div>
            <div className="text-xs text-emerald-200">Sammle mehr im Shop!</div>
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-6 h-6 text-red-400" />
              <span className="text-red-100 font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {playerStats?.current_streak}
            </div>
            <div className="text-xs text-red-200">
              {playerStats?.streak_multiplier}x Multiplier
            </div>
          </div>
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
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    todo.is_completed
                      ? "bg-green-500/10 border-green-500/30 text-green-100"
                      : "bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      todo.is_completed
                        ? "bg-green-500 border-green-500"
                        : "border-slate-400"
                    }`}
                  >
                    {todo.is_completed && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        todo.is_completed ? "line-through" : ""
                      }`}
                    >
                      {todo.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {todo.xp_value} XP
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      todo.xp_value === 10
                        ? "bg-green-500/20 text-green-300"
                        : todo.xp_value === 20
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {todo.xp_value === 10
                      ? "Einfach"
                      : todo.xp_value === 20
                      ? "Mittel"
                      : "Schwer"}
                  </div>
                </motion.div>
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
                <motion.div
                  key={challenge.challenge_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">
                      {challenge.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        challenge.type === "daily"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}
                    >
                      {challenge.type}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Fortschritt</span>
                    <span>
                      {challenge.progress}/{challenge.target}
                    </span>
                  </div>

                  <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        challenge.type === "daily"
                          ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                          : "bg-gradient-to-r from-purple-400 to-pink-400"
                      }`}
                      style={{
                        width: `${
                          (challenge.progress / challenge.target) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="text-xs text-slate-400">
                    Belohnung: {challenge.xp_reward} XP, {challenge.gem_reward}{" "}
                    Gems
                  </div>
                </motion.div>
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
            {achievements?.map((achievement, index) => {
              const IconComponent =
                iconMap[achievement.icon as keyof typeof iconMap] || Target;

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
                  <IconComponent className="text-2xl mb-2" />
                  <h3 className="font-medium mb-1">{achievement.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">
                    {achievement.description}
                  </p>

                  {!achievement.is_unlocked && achievement.current_progress && (
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
                              (achievement.current_progress! /
                                achievement.condition_value!) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.is_unlocked && (
                    <div className="flex items-center gap-1 text-xs text-yellow-300">
                      <Award className="w-3 h-3" />
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
