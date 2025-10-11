"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRewardNotification } from "@/hooks/useRewardNotification";
import RewardNotification, { RewardData } from "./RewardNotification";

interface RewardContextType {
  showReward: (reward: RewardData) => void;
  showTodoReward: (xp: number, gems: number, todoTitle?: string) => void;
  showChallengeReward: (xp: number, gems: number, challengeTitle?: string) => void;
  showAchievementReward: (gems: number, achievementTitle?: string) => void;
  showLevelUpReward: (newLevel: number, bonusGems?: number) => void;
  showXpLoss: (xp: number, gems: number, reason?: string) => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useReward must be used within a RewardProvider");
  }
  return context;
}

interface RewardProviderProps {
  children: ReactNode;
}

export default function RewardProvider({ children }: RewardProviderProps) {
  const {
    currentReward,
    hideReward,
    showReward,
    showTodoReward,
    showChallengeReward,
    showAchievementReward,
    showLevelUpReward,
    showXpLoss,
  } = useRewardNotification();

  return (
    <RewardContext.Provider
      value={{
        showReward,
        showTodoReward,
        showChallengeReward,
        showAchievementReward,
        showLevelUpReward,
        showXpLoss,
      }}
    >
      {children}
      <RewardNotification reward={currentReward} onComplete={hideReward} />
    </RewardContext.Provider>
  );
}
