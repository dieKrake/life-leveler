-- Debug: Check if prestige columns exist and what the current values are
-- Run this in Supabase Console

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'player_stats' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current player data
SELECT 
  user_id,
  level,
  xp,
  gems,
  prestige,
  max_level_reached,
  current_streak
FROM player_stats 
WHERE user_id = auth.uid();

-- 3. Test the function directly
SELECT * FROM get_player_stats_with_level_info();
