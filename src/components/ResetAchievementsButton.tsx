"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResetAchievementsButton() {
  const [isResetting, setIsResetting] = useState(false);
  const { t } = useTranslation();

  const handleReset = async () => {
    if (!confirm(t("reset.confirmWarning"))) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/reset-all", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("reset.resetFailed"));
      }

      toast.success(
        t("reset.resetSuccess", {
          achievements: data.achievements_deleted,
          challenges: data.challenges_deleted,
          todos: data.todos_reset,
        }),
        { duration: 5000 },
      );

      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Reset error:", error);
      toast.error(t("reset.resetError", { error: String(error) }));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Button
      onClick={handleReset}
      disabled={isResetting}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {isResetting ? t("reset.resetting") : t("reset.resetAll")}
    </Button>
  );
}
