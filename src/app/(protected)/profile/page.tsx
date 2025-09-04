"use client";

import useSWR from "swr";
import { PlayerStats } from "@/types";
import ProfileHeader from "@/components/ProfileHeader";
import StatsCards from "@/components/StatsCards";
import StreakSection from "@/components/StreakSection";
import AchievementsSection from "@/components/AchievementsSection";

export default function ProfilePage() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Lade Profil...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ProfileHeader />
      <StatsCards stats={stats} />
      <StreakSection stats={stats} />
      <AchievementsSection />
    </div>
  );
}
