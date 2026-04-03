"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Star, Gem, RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useReward } from "@/components/RewardProvider";
import { useUnifiedData } from "@/components/UnifiedDataProvider";
import { useTranslation } from "@/hooks/useTranslation";

interface PrestigeButtonProps {
  canPrestige: boolean;
  currentLevel: number;
  currentPrestige: number;
}

export default function PrestigeButton({
  canPrestige,
  currentLevel,
  currentPrestige,
}: PrestigeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showPrestigeReward } = useReward();
  const { mutateAll } = useUnifiedData();
  const { t } = useTranslation();

  const handlePrestige = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prestige", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("prestige.prestigeFailed"));
      }

      // Show reward notification
      showPrestigeReward(data.new_prestige, data.gems_earned);

      // Refresh all relevant data
      mutateAll();

      toast.success(
        t("prestige.prestigeReached", {
          level: data.new_prestige,
          gems: data.gems_earned,
        }),
        {
          description: t("prestige.achievementsReset", {
            count: data.achievements_reset,
          }),
        },
      );

      setIsOpen(false);
    } catch (error) {
      console.error("Prestige error:", error);
      toast.error(
        error instanceof Error ? error.message : t("prestige.prestigeFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!canPrestige) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-100 hover:from-yellow-500/30 hover:to-orange-500/30 font-bold flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          {t("prestige.prestige")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-yellow-100">
            <Star className="w-5 h-5 text-yellow-400" />
            {t("prestige.reachPrestige", { level: currentPrestige + 1 })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            {t("prestige.reachedMaxLevel")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-slate-200">
              {t("prestige.currentStatus")}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-100">
                Level {currentLevel}
              </Badge>
              {currentPrestige > 0 && (
                <Badge variant="outline" className="text-yellow-100">
                  <Star className="w-3 h-3 mr-1" />
                  Prestige {currentPrestige}
                </Badge>
              )}
            </div>
          </div>

          {/* What happens */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-200">
              {t("prestige.whatHappens")}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <Gem className="w-4 h-4" />
                <span>{t("prestige.gemsReceived")}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-4 h-4" />
                <span>
                  {t("prestige.reachPrestige", { level: currentPrestige + 1 })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <RotateCcw className="w-4 h-4" />
                <span>{t("prestige.resetLevel")}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <RotateCcw className="w-4 h-4" />
                <span>{t("prestige.resetXp")}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{t("prestige.resetAchievements")}</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
            <h4 className="font-semibold text-yellow-100 flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4" />
              {t("prestige.benefits")}
            </h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• {t("prestige.benefit1")}</li>
              <li>• {t("prestige.benefit2")}</li>
              <li>• {t("prestige.benefit3")}</li>
              <li>• {t("prestige.benefit4")}</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePrestige}
            disabled={isLoading}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
          >
            {isLoading
              ? t("prestige.performing")
              : t("prestige.performPrestige")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
