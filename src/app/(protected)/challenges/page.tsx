"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Trophy,
  Zap,
  CheckCircle2,
  Gem,
  Gift,
} from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { useState } from "react";
import { toast } from "sonner";
import type { Challenge, ChallengesResponse } from "@/types";
import { useReward } from "@/components/RewardProvider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ChallengesPage() {
  const {
    data: challenges,
    error,
    isLoading,
    mutate,
  } = useSWR<ChallengesResponse>("/api/challenges", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds to update timers
    revalidateOnFocus: true, // Revalidate when user returns to tab
  });

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
        ...(challenges?.weekly || [])
      ].find(c => c.id === challengeId);

      // Show reward notification
      showChallengeReward(
        data.xp_earned, 
        data.gems_earned, 
        challenge?.title
      );

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

  const ChallengeCard = ({
    challenge,
    type,
  }: {
    challenge: Challenge;
    type: "daily" | "weekly";
  }) => {
    const progressPercentage = (challenge.progress / challenge.target) * 100;
    const canClaim = challenge.completed && !challenge.claimed;

    return (
      <div
        className={`relative overflow-hidden h-full flex flex-col justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm ${
          challenge.completed ? "border-green-500/50" : ""
        }`}
      >
        <div className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  type === "daily"
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "bg-purple-500/20 border border-purple-500/30"
                }`}
              >
                {type === "daily" ? (
                  <Clock className="w-5 h-5 text-blue-400" />
                ) : (
                  <Calendar className="w-5 h-5 text-purple-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {challenge.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {challenge.description}
                </p>
              </div>
            </div>
            {challenge.completed && (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Fortschritt</span>
              <span className="font-medium text-white">
                {challenge.progress}/{challenge.target}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.xp_reward} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.gem_reward} Gems
                </span>
              </div>
            </div>

            {canClaim ? (
              <Button
                size="sm"
                onClick={() => handleClaim(challenge.id)}
                disabled={claimingId === challenge.id}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg"
              >
                <Gift className="w-4 h-4 mr-1.5" />
                {claimingId === challenge.id ? "..." : "Einfordern"}
              </Button>
            ) : (
              <Badge
                variant={challenge.claimed ? "default" : "secondary"}
                className={`text-xs ${
                  challenge.claimed
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : challenge.completed
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                }`}
              >
                {challenge.claimed
                  ? "Eingefordert"
                  : challenge.completed
                  ? "Abgeschlossen"
                  : challenge.time_left}
              </Badge>
            )}
          </div>
        </div>

        {challenge.completed && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/30 transform rotate-45 translate-x-8 -translate-y-8 border-l border-b border-green-400/50">
            <Trophy className="w-4 h-4 text-green-400 absolute bottom-2 left-2 transform -rotate-45" />
          </div>
        )}
      </div>
    );
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
            Fehler beim Laden der Herausforderungen
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
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Herausforderungen</h1>
          <p className="text-slate-300 text-lg">
            Stelle dich täglichen und wöchentlichen Herausforderungen und
            verdiene zusätzliche Belohnungen!
          </p>
        </div>

        {/* Daily Challenges */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">
              Tägliche Herausforderungen
            </h2>
            <Badge
              variant="outline"
              className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
              Erneuert in {getResetTime(dailyChallenges)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {dailyChallenges.length > 0 ? (
                dailyChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex-none w-80 h-52">
                    <ChallengeCard challenge={challenge} type="daily" />
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center w-full py-8">
                  Keine täglichen Herausforderungen verfügbar
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Weekly Challenges */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">
              Wöchentliche Herausforderungen
            </h2>
            <Badge
              variant="outline"
              className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30"
            >
              Erneuert in {getResetTime(weeklyChallenges)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4 min-w-max">
              {weeklyChallenges.length > 0 ? (
                weeklyChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex-none w-80 h-52">
                    <ChallengeCard challenge={challenge} type="weekly" />
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center w-full py-8">
                  Keine wöchentlichen Herausforderungen verfügbar
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
