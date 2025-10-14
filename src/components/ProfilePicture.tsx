"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Gem, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface ProfilePictureProps {
  user: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  level: number;
  xp: number;
  xpForNextLevel: number;
  xpForCurrentLevel: number;
  gems: number;
  streak: number;
  prestige?: number;
  isOnline?: boolean;
}

export default function ProfilePicture({
  user,
  level,
  xp,
  xpForNextLevel,
  xpForCurrentLevel,
  gems,
  streak,
  prestige = 0,
  isOnline = true,
}: ProfilePictureProps) {
  const xpProgress =
    ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  const getLevelBadgeColor = (level: number) => {
    if (level >= 50) return "from-yellow-400 to-orange-500";
    if (level >= 25) return "from-purple-400 to-pink-500";
    if (level >= 10) return "from-blue-400 to-cyan-500";
    return "from-green-400 to-emerald-500";
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return Crown;
    if (level >= 25) return Star;
    if (level >= 10) return Shield;
    return Zap;
  };

  const LevelIcon = getLevelIcon(level);

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      {/* Main Avatar Container */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          type: "spring",
          stiffness: 120,
        }}
      >
        {/* Outer Glow Ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full opacity-75 blur-lg animate-pulse"></div>

        {/* Level Ring */}
        <div className="relative">
          <motion.div
            className={`w-32 h-32 rounded-full bg-gradient-to-br ${getLevelBadgeColor(
              level
            )} p-1 shadow-2xl`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-full h-full bg-slate-900 rounded-full p-1">
              <Avatar className="w-full h-full border-4 border-slate-800">
                <AvatarImage
                  src={user.avatar_url}
                  alt={user.name || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-bold">
                  {(user.name || user.email || "P")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </motion.div>

          {/* Online Status */}
          {isOnline && (
            <motion.div
              className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.6,
                type: "spring",
                stiffness: 200,
              }}
            />
          )}

          {/* Level Badge */}
          <motion.div
            className={`absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br ${getLevelBadgeColor(
              level
            )} rounded-full flex items-center justify-center shadow-xl border-4 border-slate-900`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              type: "spring",
              stiffness: 150,
            }}
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            <LevelIcon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* User Info */}
      <motion.div
        className="mt-6 text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white">
          {user.name || user.email?.split("@")[0] || "Player"}
        </h2>

        <motion.div
          className="flex items-center justify-center gap-2 flex-wrap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <Badge
              variant="outline"
              className={`bg-gradient-to-r ${getLevelBadgeColor(
                level
              )} border-none text-white font-bold px-3 py-1`}
            >
              Level {level}
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 border-none text-white font-bold px-3 py-1 flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              Prestige {prestige}
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <Badge
              variant="outline"
              className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 border-none text-white"
            >
              🔥 {streak} Streak
            </Badge>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* XP Progress */}
      <motion.div
        className="mt-4 w-full max-w-xs space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex justify-between text-sm text-slate-300">
          <span>XP Progress</span>
          <span>
            {xp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel}
          </span>
        </div>
        <div className="relative w-full h-3 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{
              duration: 1.5,
              delay: 1.0,
              ease: "easeOut",
            }}
          />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="mt-4 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <motion.div
          className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-100">
            {xp.toLocaleString()}
          </span>
        </motion.div>
        <motion.div
          className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <Gem className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-100">{gems}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
