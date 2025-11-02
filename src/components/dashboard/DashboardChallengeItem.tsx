import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@/types";

interface DashboardChallengeItemProps {
  challenge: Challenge;
  index: number;
}

export default function DashboardChallengeItem({
  challenge,
  index,
}: DashboardChallengeItemProps) {
  return (
    <motion.div
      key={challenge.challenge_id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
      className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-white">{challenge.title}</h3>
        <Badge
          variant="outline"
          className={`text-xs ${
            challenge.type === "daily"
              ? "bg-blue-500/20 text-blue-300"
              : "bg-purple-500/20 text-purple-300"
          }`}
        >
          {challenge.type}
        </Badge>
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
            width: `${(challenge.progress / challenge.target) * 100}%`,
          }}
        />
      </div>

      <div className="text-xs text-slate-400">
        Belohnung: {challenge.xp_reward} XP, {challenge.gem_reward} Gems
      </div>
    </motion.div>
  );
}
