-- Reset achievements for testing reward animations
-- This script will remove all unlocked achievements for your user
-- so you can test the reward notifications again

-- IMPORTANT: Replace 'your-user-id-here' with your actual user ID
-- You can find your user ID by running: SELECT auth.uid();

-- 1. First, let's see what achievements you currently have unlocked
SELECT 
    ua.id,
    ua.user_id,
    ua.achievement_id,
    ua.unlocked_at,
    a.title,
    a.description,
    a.reward_gems
FROM user_achievements ua
JOIN achievements a ON a.id = ua.achievement_id
WHERE ua.user_id = auth.uid()  -- This will show your achievements
ORDER BY ua.unlocked_at DESC;

-- 2. UNCOMMENT THE LINES BELOW TO RESET YOUR ACHIEVEMENTS
-- WARNING: This will delete all your achievement progress!

-- Delete all user achievements for your user
-- DELETE FROM user_achievements WHERE user_id = auth.uid();

-- 3. Optional: Also reset the gems you got from achievements
-- You'll need to calculate how many gems to subtract
-- SELECT SUM(a.reward_gems) as total_gems_to_subtract
-- FROM user_achievements ua
-- JOIN achievements a ON a.id = ua.achievement_id  
-- WHERE ua.user_id = auth.uid();

-- Then manually subtract that amount from player_stats:
-- UPDATE player_stats 
-- SET gems = gems - [CALCULATED_AMOUNT]
-- WHERE user_id = auth.uid();

-- 4. After reset, you can trigger achievements again by:
-- - Completing todos (for complete_count achievements)
-- - Reaching certain levels/XP (for reach_value achievements)
-- - Building streaks (for streak_days achievements)
