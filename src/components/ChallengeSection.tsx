import { ReactNode } from "react";
import { KeyedMutator } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import ChallengeCard from "@/components/ChallengeCard";
import type { Challenge } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

interface ChallengeSectionProps {
  title: string;
  type: "daily" | "weekly";
  challenges: Challenge[];
  onClaim: (challengeId: string) => Promise<void>;
  claimingId: string | null;
  resetTime: string;
}

export default function ChallengeSection({
  title,
  type,
  challenges,
  onClaim,
  claimingId,
  resetTime,
}: ChallengeSectionProps) {
  const IconComponent = type === "daily" ? Clock : Calendar;
  const iconColor = type === "daily" ? "text-blue-400" : "text-purple-400";
  const badgeColor = type === "daily" 
    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : "bg-purple-500/20 text-purple-300 border-purple-500/30";

  return (
    <motion.section 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: type === "daily" ? 0.2 : 0.4 }}
    >
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: type === "daily" ? 0.3 : 0.5 }}
      >
        <IconComponent className={`w-6 h-6 ${iconColor}`} />
        <h2 className="text-2xl font-semibold text-white">
          {title}
        </h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: type === "daily" ? 0.4 : 0.6 }}
        >
          <Badge
            variant="outline"
            className={`ml-2 ${badgeColor}`}
          >
            Erneuert in {resetTime}
          </Badge>
        </motion.div>
      </motion.div>

      <motion.div 
        className="overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: type === "daily" ? 0.5 : 0.7 }}
      >
        <div className="flex gap-4 pb-4 min-w-max">
          {challenges.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {challenges.map((challenge, index) => (
                <motion.div 
                  key={challenge.id} 
                  className="flex-none w-80 h-52"
                  layout
                  layoutId={`challenge-${challenge.id}`}
                >
                  <ChallengeCard 
                    challenge={challenge} 
                    type={type} 
                    index={index}
                    onClaim={onClaim}
                    isClaimingThis={claimingId === challenge.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div 
              className="text-slate-400 text-center w-full py-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: type === "daily" ? 0.6 : 0.8 }}
            >
              Keine {type === "daily" ? "täglichen" : "wöchentlichen"} Herausforderungen verfügbar
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
