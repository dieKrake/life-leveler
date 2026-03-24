"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function ResetAchievementsButton() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (
      !confirm(
        "WARNUNG: Dies setzt ALLE Spielerdaten zurück (Stats, Achievements, Challenges, Todos)! Fortfahren?",
      )
    ) {
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
        throw new Error(data.error || "Reset fehlgeschlagen");
      }

      toast.success(
        `Alles zurückgesetzt! ${data.achievements_deleted} Achievements, ${data.challenges_deleted} Challenges, ${data.todos_reset} Todos`,
        { duration: 5000 },
      );

      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Reset error:", error);
      toast.error(`Fehler beim Reset: ${error}`);
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
      {isResetting ? "Resetting..." : "Alles zurücksetzen (TEST)"}
    </Button>
  );
}
