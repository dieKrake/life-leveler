"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Gem, Shield } from "lucide-react";

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
    <div className="relative flex flex-col items-center">
      {/* Main Avatar Container */}
      <div className="relative">
        {/* Outer Glow Ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full opacity-75 blur-lg animate-pulse"></div>

        {/* Level Ring */}
        <div className="relative">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br ${getLevelBadgeColor(
              level
            )} p-1 shadow-2xl`}
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
          </div>

          {/* Online Status */}
          {isOnline && (
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse shadow-lg"></div>
          )}

          {/* Level Badge */}
          <div
            className={`absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br ${getLevelBadgeColor(
              level
            )} rounded-full flex items-center justify-center shadow-xl border-4 border-slate-900`}
          >
            <LevelIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-6 text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          {user.name || user.email?.split("@")[0] || "Player"}
        </h2>

        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="outline"
            className={`bg-gradient-to-r ${getLevelBadgeColor(
              level
            )} border-none text-white font-bold px-3 py-1`}
          >
            Level {level}
          </Badge>
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-orange-500 to-red-500 border-none text-white"
          >
            🔥 {streak} Streak
          </Badge>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mt-4 w-full max-w-xs space-y-2">
        <div className="flex justify-between text-sm text-slate-300">
          <span>XP Progress</span>
          <span>
            {xp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel}
          </span>
        </div>
        <div className="relative w-full h-3 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-100">
            {xp.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
          <Gem className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-100">{gems}</span>
        </div>
      </div>
    </div>
  );
}
