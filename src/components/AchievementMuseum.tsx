"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { AchievementMuseumData, AchievementHistoryEntry } from "@/types";
import { GRADIENTS } from "@/lib/constants";

const getPrestigeColor = (prestige: number) => {
  switch (prestige) {
    case 0:
      return "from-slate-400 to-slate-500 border-slate-400/50";
    case 1:
      return "from-gray-300 to-gray-400 border-gray-300/50";
    case 2:
      return "from-yellow-400 to-amber-500 border-yellow-400/50";
    case 3:
      return "from-cyan-400 to-blue-500 border-cyan-400/50";
    case 4:
      return "from-purple-400 to-pink-500 border-purple-400/50";
    default:
      return "from-rose-400 to-red-500 border-rose-400/50";
  }
};

const getPrestigeLabel = (prestige: number) => {
  switch (prestige) {
    case 0:
      return "Bronze";
    case 1:
      return "Silber";
    case 2:
      return "Gold";
    case 3:
      return "Diamant";
    case 4:
      return "Meister";
    default:
      return `Legende ${prestige - 4}`;
  }
};

interface MuseumTileProps {
  entry: AchievementHistoryEntry;
  index: number;
}

function MuseumTile({ entry, index }: MuseumTileProps) {
  const prestigeColor = getPrestigeColor(entry.prestige_level);
  const prestigeLabel = getPrestigeLabel(entry.prestige_level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative group"
    >
      <div
        className={`
          relative p-3 rounded-lg border backdrop-blur-sm
          bg-gradient-to-br ${prestigeColor}
          transition-all duration-300
          hover:shadow-lg hover:shadow-purple-500/20
        `}
      >
        {/* Achievement Icon */}
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Achievement Name */}
        <p className="text-xs font-medium text-white text-center truncate">
          {entry.achievement_name}
        </p>

        {/* Prestige Badge */}
        <div className="mt-2 flex items-center justify-center gap-1">
          <Star className="w-3 h-3 text-yellow-300" />
          <span className="text-[10px] text-white/80 font-medium">
            {prestigeLabel}
          </span>
        </div>

        {/* Hover Tooltip */}
        <div
          className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
            bg-slate-900 rounded-lg border border-slate-700
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            pointer-events-none z-10 min-w-[150px] max-w-[200px]
          `}
        >
          <p className="text-xs font-semibold text-white mb-1">
            {entry.achievement_name}
          </p>
          <p className="text-[10px] text-slate-400">
            {entry.achievement_description}
          </p>
          <p className="text-[10px] text-purple-400 mt-1">
            Prestige {entry.prestige_level} • {prestigeLabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementMuseum() {
  const { data, isLoading } = useSWR<AchievementMuseumData>(
    "/api/achievement-history",
  );

  if (isLoading) {
    return (
      <Card
        className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm h-full flex flex-col`}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Landmark className="h-5 w-5 text-purple-400" />
            Achievement Museum
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">Lade Museum...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <Card
        className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm h-full flex flex-col`}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Landmark className="h-5 w-5 text-purple-400" />
            Achievement Museum
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Noch keine Achievements erreicht
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Erreiche Achievements um sie hier zu sammeln!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm h-full flex flex-col`}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-purple-400" />
            Achievement Museum
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              <span className="text-purple-400 font-bold">
                {data.totalAchievements}
              </span>{" "}
              Gesamt
            </span>
            <span className="text-slate-400">
              <span className="text-blue-400 font-bold">
                {data.uniqueAchievements}
              </span>{" "}
              Unique
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Museum Grid - scrollable area */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
          <div className="grid grid-cols-3 gap-2">
            {data.entries.map((entry, index) => (
              <MuseumTile
                key={`${entry.achievement_id}-${entry.prestige_level}`}
                entry={entry}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Legend - fixed at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex-shrink-0">
          <p className="text-[10px] text-slate-500 mb-2">Prestige-Stufen:</p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((p) => (
              <div
                key={p}
                className={`
                  px-2 py-0.5 rounded text-[10px] font-medium
                  bg-gradient-to-r ${getPrestigeColor(p)} text-white
                `}
              >
                {getPrestigeLabel(p)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
