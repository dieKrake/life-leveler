"use client";

import type { Challenge } from "@/types";
import { useChallenges } from "@/components/UnifiedDataProvider";
import { motion } from "framer-motion";
import ChallengeSection from "@/components/ChallengeSection";
import { Trophy } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function ChallengesPage() {
  const { data: challenges, error, isLoading } = useChallenges();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">
            {t("challenges.loadingChallenges")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-red-400">
            {t("common.errorMessage", { message: error.message })}
          </div>
        </div>
      </div>
    );
  }

  const dailyChallenges = challenges?.daily || [];
  const weeklyChallenges = challenges?.weekly || [];

  // Get reset time from the first challenge's expires_at
  const getResetTime = (challengeList: Challenge[]) => {
    if (challengeList.length === 0) return "--";

    const firstChallenge = challengeList[0];
    const expiresAt = new Date(firstChallenge.expires_at);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return t("challenges.expired");

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              {t("challenges.challenges")}
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            {t("challenges.challengesDescription")}
          </p>
        </motion.div>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ChallengeSection
            title={t("challenges.dailyChallenges")}
            type="daily"
            challenges={dailyChallenges}
            resetTime={getResetTime(dailyChallenges)}
          />

          <ChallengeSection
            title={t("challenges.weeklyChallenges")}
            type="weekly"
            challenges={weeklyChallenges}
            resetTime={getResetTime(weeklyChallenges)}
          />
        </motion.div>
      </div>
    </div>
  );
}
