-- Migration: Add prestige baseline tracking for achievements
-- Date: 2025-10-13 20:00:00
-- Description: Track baseline values at prestige for relative achievement progress

-- Add baseline columns to player_stats
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS gems_at_last_prestige INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tasks_at_last_prestige INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_at_last_prestige INTEGER DEFAULT 0;

-- Initialize existing users' baseline values
UPDATE player_stats
SET 
  gems_at_last_prestige = CASE 
    WHEN prestige > 0 THEN gems  -- If already prestiged, set current gems as baseline
    ELSE 0  -- If never prestiged, start at 0
  END,
  total_tasks_completed = (
    SELECT COUNT(*) 
    FROM todos 
    WHERE todos.user_id = player_stats.user_id 
      AND todos.is_completed = true
  ),
  tasks_at_last_prestige = CASE
    WHEN prestige > 0 THEN (
      SELECT COUNT(*) 
      FROM todos 
      WHERE todos.user_id = player_stats.user_id 
        AND todos.is_completed = true
    )
    ELSE 0
  END,
  xp_at_last_prestige = CASE
    WHEN prestige > 0 THEN xp
    ELSE 0
  END
WHERE gems_at_last_prestige IS NULL;