import { useState, useCallback } from "react";
import { RewardData } from "@/components/RewardNotification";
import { useTranslation } from "@/hooks/useTranslation";

interface RewardWithId extends RewardData {
  id: string;
}

export function useRewardNotification() {
  const [rewards, setRewards] = useState<RewardWithId[]>([]);
  const { t } = useTranslation();

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
        title: todoTitle
          ? t("rewards.todoCompleted", { title: todoTitle })
          : t("rewards.todoCompletedGeneric"),
        description: t("rewards.todoCompletedDescription"),
      });
    },
    [showReward],
  );

  const showChallengeReward = useCallback(
    (xp: number, gems: number, challengeTitle?: string) => {
      showReward({
        type: "challenge",
        xp,
        gems,
        title: challengeTitle
          ? t("rewards.challengeCompleted", { title: challengeTitle })
          : t("rewards.challengeCompletedGeneric"),
        description: t("rewards.challengeCompletedDescription"),
        clickable: false, // This is a claim notification - don't make it clickable
      });
    },
    [showReward],
  );

  const showAchievementReward = useCallback(
    (gems: number, achievementTitle?: string) => {
      showReward({
        type: "achievement",
        gems,
        title: achievementTitle
          ? t("rewards.achievementUnlocked", { title: achievementTitle })
          : t("rewards.achievementUnlockedGeneric"),
        description: t("rewards.achievementUnlockedDescription"),
        clickable: false, // This is a claim notification - don't make it clickable
      });
    },
    [showReward],
  );

  const showLevelUpReward = useCallback(
    (newLevel: number, bonusGems?: number) => {
      showReward({
        type: "level_up",
        gems: bonusGems,
        title: t("rewards.levelReached", { level: newLevel }),
        description: t("rewards.levelReachedDescription"),
      });
    },
    [showReward],
  );

  const showXpLoss = useCallback(
    (xp: number, gems: number, reason?: string) => {
      showReward({
        type: "todo",
        xp: -Math.abs(xp), // Ensure negative
        gems: -Math.abs(gems), // Ensure negative
        title: reason || t("rewards.todoUndone"),
        description: t("rewards.todoUndoneDescription"),
      });
    },
    [showReward],
  );

  const showPrestigeReward = useCallback(
    (prestigeLevel: number, bonusGems: number) => {
      showReward({
        type: "level_up",
        gems: bonusGems,
        title: t("rewards.prestigeReached", { level: prestigeLevel }),
        description: t("rewards.prestigeReachedDescription"),
      });
    },
    [showReward],
  );

  const showAchievementUnlockable = useCallback(
    (gems: number, achievementTitle?: string) => {
      showReward({
        type: "achievement",
        // Don't show gems for "unlockable" notification - only show when actually claimed
        gems: undefined,
        title: achievementTitle
          ? t("rewards.achievementUnlockable", { title: achievementTitle })
          : t("rewards.achievementUnlockableGeneric"),
        description: t("rewards.achievementUnlockableDescription"),
        clickable: true, // This is an "unlockable" notification - make it clickable
      });
    },
    [showReward],
  );

  const showChallengeCompletable = useCallback(
    (xp: number, gems: number, challengeTitle?: string) => {
      showReward({
        type: "challenge",
        // Don't show rewards for "completable" notification - only show when actually claimed
        xp: undefined,
        gems: undefined,
        title: challengeTitle
          ? t("rewards.challengeCompletable", { title: challengeTitle })
          : t("rewards.challengeCompletableGeneric"),
        description: t("rewards.challengeCompletableDescription"),
        clickable: true, // This is a "completable" notification - make it clickable
      });
    },
    [showReward],
  );

  return {
    rewards,
    showReward,
    hideReward,
    showTodoReward,
    showChallengeReward,
    showChallengeCompletable,
    showAchievementReward,
    showAchievementUnlockable,
    showLevelUpReward,
    showXpLoss,
    showPrestigeReward,
  };
}
