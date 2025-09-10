"use client";

import useSWR from "swr";
import { PlayerStats } from "@/types";
import ProfilePicture from "@/components/ProfilePicture";
import StreakSection from "@/components/StreakSection";
import AchievementsSection from "@/components/AchievementsSection";

export default function ProfilePage() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">Lade Profil...</div>
        </div>
      </div>
    );
  }

  const mockUser = {
    name: "Max Mustermann",
    email: "max@example.com",
    avatar_url: "/placeholder-avatar.jpg",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Profile Header with ProfilePicture */}
        <div className="text-center space-y-6">
          <ProfilePicture
            user={mockUser}
            level={stats.level}
            xp={stats.xp}
            xpForCurrentLevel={stats.xp_for_current_level}
            xpForNextLevel={
              stats.xp_for_next_level || stats.xp_for_current_level
            }
            gems={stats.gems}
            streak={stats.current_streak}
          />
        </div>
        <StreakSection stats={stats} />
        <AchievementsSection />
      </div>
    </div>
  );
}
