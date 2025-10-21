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

// Mock data für die erste Version
const mockStats = {
  level: 2,
  xp: 142,
  total_xp: 242,
  xp_for_next_level: 150,
  gems: 28,
  current_streak: 5,
  streak_multiplier: 1.2,
  prestige: 0,
};

const mockTodos = [
  { id: 1, title: "Morgenroutine abschließen", xp_value: 20, completed: false, difficulty: "medium" },
  { id: 2, title: "30 Min Sport", xp_value: 30, completed: true, difficulty: "hard" },
  { id: 3, title: "Buch lesen", xp_value: 10, completed: false, difficulty: "easy" },
  { id: 4, title: "Projekt weiterarbeiten", xp_value: 30, completed: false, difficulty: "hard" },
];

const mockChallenges = [
  { id: 1, title: "5 Todos heute", progress: 2, target: 5, type: "daily", reward: "50 XP + 5 Gems" },
  { id: 2, title: "Schwere Aufgaben meistern", progress: 1, target: 3, type: "daily", reward: "75 XP + 8 Gems" },
  { id: 3, title: "Wöchentliche Ziele", progress: 12, target: 25, type: "weekly", reward: "200 XP + 25 Gems" },
];

const mockAchievements = [
  { id: 1, name: "Erste Schritte", description: "Erste Todo abgeschlossen", unlocked: true, icon: "🎯" },
  { id: 2, name: "Streak Master", description: "5 Tage Streak erreicht", unlocked: true, icon: "🔥" },
  { id: 3, name: "Level Up", description: "Level 2 erreicht", unlocked: true, icon: "⭐" },
  { id: 4, name: "Gem Sammler", description: "50 Gems sammeln", unlocked: false, progress: 28, target: 50, icon: "💎" },
];

const quickActions = [
  { title: "Todo hinzufügen", icon: Plus, href: "/todos", color: "from-blue-500 to-blue-600" },
  { title: "Challenges", icon: Target, href: "/challenges", color: "from-purple-500 to-purple-600" },
  { title: "Shop besuchen", icon: ShoppingBag, href: "/shop", color: "from-green-500 to-green-600" },
  { title: "Statistiken", icon: BarChart3, href: "/stats", color: "from-orange-500 to-orange-600" },
];

export default function DashboardView() {
  const completedTodos = mockTodos.filter(todo => todo.completed).length;
  const totalTodos = mockTodos.length;
  const todayXP = mockTodos.filter(todo => todo.completed).reduce((sum, todo) => sum + todo.xp_value, 0);

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
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-blue-400" />
              <span className="text-blue-100 font-medium">Level</span>
            </div>
            <div className="text-2xl font-bold text-white">{mockStats.level}</div>
            <div className="text-xs text-blue-200">
              {mockStats.xp}/{mockStats.xp_for_next_level} XP
            </div>
            <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(mockStats.xp / mockStats.xp_for_next_level) * 100}%` }}
              />
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-100 font-medium">Total XP</span>
            </div>
            <div className="text-2xl font-bold text-white">{mockStats.total_xp}</div>
            <div className="text-xs text-yellow-200">
              +{todayXP} heute
            </div>
          </div>

          {/* Gems Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Gem className="w-6 h-6 text-emerald-400" />
              <span className="text-emerald-100 font-medium">Gems</span>
            </div>
            <div className="text-2xl font-bold text-white">{mockStats.gems}</div>
            <div className="text-xs text-emerald-200">
              Sammle mehr im Shop!
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-6 h-6 text-red-400" />
              <span className="text-red-100 font-medium">Streak</span>
            </div>
            <div className="text-2xl font-bold text-white">{mockStats.current_streak}</div>
            <div className="text-xs text-red-200">
              {mockStats.streak_multiplier}x Multiplier
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
                <span>{completedTodos}/{totalTodos} abgeschlossen</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedTodos / totalTodos) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {mockTodos.slice(0, 4).map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    todo.completed 
                      ? 'bg-green-500/10 border-green-500/30 text-green-100' 
                      : 'bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-slate-400'
                  }`}>
                    {todo.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${todo.completed ? 'line-through' : ''}`}>
                      {todo.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {todo.xp_value} XP • {todo.difficulty}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    todo.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                    todo.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {todo.difficulty}
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

            <div className="space-y-4">
              {mockChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">{challenge.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      challenge.type === 'daily' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {challenge.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Fortschritt</span>
                    <span>{challenge.progress}/{challenge.target}</span>
                  </div>
                  
                  <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        challenge.type === 'daily' 
                          ? 'bg-gradient-to-r from-blue-400 to-cyan-400' 
                          : 'bg-gradient-to-r from-purple-400 to-pink-400'
                      }`}
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    Belohnung: {challenge.reward}
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
            {mockAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  achievement.unlocked
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}
              >
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h3 className="font-medium mb-1">{achievement.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{achievement.description}</p>
                
                {!achievement.unlocked && achievement.progress && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Fortschritt</span>
                      <span>{achievement.progress}/{achievement.target}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${(achievement.progress! / achievement.target!) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {achievement.unlocked && (
                  <div className="flex items-center gap-1 text-xs text-yellow-300">
                    <Award className="w-3 h-3" />
                    Freigeschaltet
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          <Link href="/todos">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
            >
              <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-bold text-white mb-1">Todos verwalten</h3>
              <p className="text-sm text-slate-400">Aufgaben erstellen und abschließen</p>
            </motion.div>
          </Link>

          <Link href="/shop">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
            >
              <ShoppingBag className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-bold text-white mb-1">Shop besuchen</h3>
              <p className="text-sm text-slate-400">Gems für Upgrades ausgeben</p>
            </motion.div>
          </Link>

          <Link href="/stats">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h3 className="font-bold text-white mb-1">Statistiken</h3>
              <p className="text-sm text-slate-400">Fortschritt und Trends anzeigen</p>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
