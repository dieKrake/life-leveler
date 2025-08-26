// src/components/PlayerStatsBar.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function PlayerStatsBar() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: stats } = await supabase
    .from("player_stats")
    .select("xp, level")
    .single();

  return (
    <div className="w-full bg-muted">
      <div className="container flex items-center h-10 text-sm">
        <div className="flex gap-6">
          <span>
            <strong>Level:</strong> {stats?.level ?? 1}
          </span>
          <span>
            <strong>XP:</strong> {stats?.xp ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
