"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function ResetAchievementsButton() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm("WARNUNG: Dies wird alle deine Achievements löschen! Fortfahren?")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/reset-achievements", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset fehlgeschlagen");
      }

      toast.success(
        `Achievements zurückgesetzt! ${data.achievementsReset} Achievements entfernt, ${data.gemsSubtracted} Gems abgezogen`,
        { duration: 5000 }
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
      {isResetting ? "Resetting..." : "Reset Achievements (TEST)"}
    </Button>
  );
}
