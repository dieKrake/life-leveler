"use client";

import useSWR from "swr";
import { PlayerStats } from "@/types";
import ProfilePicture from "@/components/ProfilePicture";
import StreakSection from "@/components/StreakSection";
import AchievementsSection from "@/components/AchievementsSection";
import ResetAchievementsButton from "@/components/ResetAchievementsButton";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (isLoading || !stats || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">Lade Profil...</div>
        </div>
      </div>
    );
  }

  const userData = {
    name:
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Player",
    email: user.email || "",
    avatar_url:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Profile Header with ProfilePicture */}
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProfilePicture
            user={userData}
            level={stats.level}
            xp={stats.xp}
            totalXp={stats.total_xp}
            xpForCurrentLevel={stats.xp_for_current_level}
            xpForNextLevel={
              stats.xp_for_next_level || stats.xp_for_current_level
            }
            gems={stats.gems}
            streak={stats.current_streak}
            prestige={stats.prestige || 0}
          />
        </motion.div>
        
        {/* TEMPORARY: Reset button for testing */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ResetAchievementsButton />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StreakSection stats={stats} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AchievementsSection />
        </motion.div>
      </div>
    </div>
  );
}
