"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState } from "react";
import { toast } from "sonner";
import type { Challenge, ChallengesResponse } from "@/types";
import { useReward } from "@/components/RewardProvider";
import { motion } from "framer-motion";
import ChallengeSection from "@/components/ChallengeSection";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ChallengesPage() {
  const {
    data: challenges,
    error,
    isLoading,
    mutate,
  } = useSWR<ChallengesResponse>("/api/challenges", fetcher);

  const { mutate: globalMutate } = useSWRConfig();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { showChallengeReward } = useReward();

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId);

    // Optimistic update: immediately mark as claimed in local state
    const optimisticUpdate = (currentData: ChallengesResponse | undefined) => {
      if (!currentData) return currentData;

      const updateChallenges = (challenges: Challenge[]) =>
        challenges.map((challenge) =>
          challenge.id === challengeId
            ? { ...challenge, claimed: true }
            : challenge
        );

      return {
        daily: updateChallenges(currentData.daily || []),
        weekly: updateChallenges(currentData.weekly || []),
      };
    };

    // Apply optimistic update
    mutate(optimisticUpdate(challenges), false);

    try {
      const response = await fetch("/api/claim-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChallengeId: challengeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update on error
        mutate();
        toast.error(data.error || "Fehler beim Einfordern der Belohnung");
        return;
      }

      // Find the challenge for the title
      const challenge = [
        ...(challenges?.daily || []),
        ...(challenges?.weekly || []),
      ].find((c) => c.id === challengeId);

      // Show reward notification
      showChallengeReward(data.xp_earned, data.gems_earned, challenge?.title);

      toast.success(
        `Belohnung eingefordert! +${data.xp_earned} XP, +${data.gems_earned} Gems`,
        {
          duration: 3000,
        }
      );

      // Success - refresh data (same pattern as TodoItem)
      mutate();
      globalMutate("/api/player-stats");
      globalMutate("/api/achievements");
    } catch (error) {
      console.error("Error claiming reward:", error);
      // Revert optimistic update on error
      mutate();
      toast.error("Fehler beim Einfordern der Belohnung");
    } finally {
      setClaimingId(null);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">
            Lade Herausforderungen...
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
            Fehler: {error.message}
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

    if (diff <= 0) return "Abgelaufen";

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
          <h1 className="text-4xl font-bold text-white">Herausforderungen</h1>
          <p className="text-slate-300 text-lg">
            Stelle dich täglichen und wöchentlichen Herausforderungen und
            verdiene zusätzliche Belohnungen!
          </p>
        </motion.div>

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ChallengeSection
            title="Tägliche Herausforderungen"
            type="daily"
            challenges={dailyChallenges}
            onClaim={handleClaim}
            claimingId={claimingId}
            resetTime={getResetTime(dailyChallenges)}
          />

          <ChallengeSection
            title="Wöchentliche Herausforderungen"
            type="weekly"
            challenges={weeklyChallenges}
            onClaim={handleClaim}
            claimingId={claimingId}
            resetTime={getResetTime(weeklyChallenges)}
          />
        </motion.div>
      </div>
    </div>
  );
}
