import { useState, useCallback } from "react";
import { RewardData } from "@/components/RewardNotification";

interface RewardWithId extends RewardData {
  id: string;
}

export function useRewardNotification() {
  const [rewards, setRewards] = useState<RewardWithId[]>([]);

  const showReward = useCallback((reward: RewardData) => {
    const rewardWithId: RewardWithId = {
      ...reward,
      id: `${Date.now()}-${Math.random()}`,
    };
    setRewards((prev) => [...prev, rewardWithId]);
  }, []);

  const hideReward = useCallback((id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Convenience methods for different reward types
  const showTodoReward = useCallback(
    (xp: number, gems: number, todoTitle?: string) => {
      showReward({
        type: "todo",
        xp,
        gems,
        title: todoTitle ? `"${todoTitle}" erledigt!` : "Todo erledigt!",
        description: "Großartige Arbeit! Du kommst deinen Zielen näher.",
      });
    },
    [showReward]
  );

  const showChallengeReward = useCallback(
    (xp: number, gems: number, challengeTitle?: string) => {
      showReward({
        type: "challenge",
        xp,
        gems,
        title: challengeTitle
          ? `"${challengeTitle}" gemeistert!`
          : "Challenge gemeistert!",
        description:
          "Herausforderung erfolgreich abgeschlossen! Du bist unstoppbar!",
      });
    },
    [showReward]
  );

  const showAchievementReward = useCallback(
    (gems: number, achievementTitle?: string) => {
      showReward({
        type: "achievement",
        gems,
        title: achievementTitle
          ? `"${achievementTitle}" freigeschaltet!`
          : "Erfolg freigeschaltet!",
        description: "Du hast einen neuen Meilenstein erreicht! Fantastisch!",
      });
    },
    [showReward]
  );

  const showLevelUpReward = useCallback(
    (newLevel: number, bonusGems?: number) => {
      showReward({
        type: "level_up",
        gems: bonusGems,
        title: `Level ${newLevel} erreicht!`,
        description: "Herzlichen Glückwunsch! Du wirst immer stärker!",
      });
    },
    [showReward]
  );

  const showXpLoss = useCallback(
    (xp: number, gems: number, reason?: string) => {
      showReward({
        type: "todo",
        xp: -Math.abs(xp), // Ensure negative
        gems: -Math.abs(gems), // Ensure negative
        title: reason || "Todo rückgängig gemacht",
        description: "Kein Problem! Du schaffst das beim nächsten Mal!",
      });
    },
    [showReward]
  );

  const showPrestigeReward = useCallback(
    (prestigeLevel: number, bonusGems: number) => {
      showReward({
        type: "level_up",
        gems: bonusGems,
        title: `Prestige ${prestigeLevel} erreicht!`,
        description: "Unglaublich! Du hast einen neuen Prestige-Level erreicht!",
      });
    },
    [showReward]
  );

  return {
    rewards,
    showReward,
    hideReward,
    showTodoReward,
    showChallengeReward,
    showAchievementReward,
    showLevelUpReward,
    showXpLoss,
    showPrestigeReward,
  };
}
