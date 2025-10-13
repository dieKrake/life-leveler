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
import { mutate } from "swr";

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
        throw new Error(data.error || "Prestige fehlgeschlagen");
      }

      // Show reward notification
      showPrestigeReward(data.new_prestige, data.gems_earned);

      // Refresh all relevant data
      mutate("/api/player-stats");
      mutate("/api/achievements");

      toast.success(
        `Prestige ${data.new_prestige} erreicht! +${data.gems_earned} Gems erhalten!`,
        {
          description: `${data.achievements_reset} Erfolge wurden zurückgesetzt.`,
        }
      );

      setIsOpen(false);
    } catch (error) {
      console.error("Prestige error:", error);
      toast.error(
        error instanceof Error ? error.message : "Prestige fehlgeschlagen"
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
          Prestige
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-yellow-100">
            <Star className="w-5 h-5 text-yellow-400" />
            Prestige {currentPrestige + 1} erreichen
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            Du hast Level 10 erreicht! Du kannst jetzt ein Prestige durchführen.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-slate-200">Aktueller Status:</h4>
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
            <h4 className="font-semibold text-slate-200">Was passiert:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <Gem className="w-4 h-4" />
                <span>+50 Gems erhalten</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-4 h-4" />
                <span>Prestige {currentPrestige + 1} erreichen</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <RotateCcw className="w-4 h-4" />
                <span>Level auf 1 zurücksetzen</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <RotateCcw className="w-4 h-4" />
                <span>XP auf 0 zurücksetzen</span>
              </div>
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Alle Erfolge werden zurückgesetzt</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
            <h4 className="font-semibold text-yellow-100 flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4" />
              Vorteile:
            </h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Alle Erfolge können erneut freigeschaltet werden</li>
              <li>• Prestige-Status als Zeichen deiner Hingabe</li>
              <li>• Gems behalten + Bonus-Gems erhalten</li>
              <li>• Vorbereitung für zukünftige Prestige-Inhalte</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePrestige}
            disabled={isLoading}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
          >
            {isLoading ? "Wird durchgeführt..." : "Prestige durchführen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
