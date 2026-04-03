-- Migration: Fix streak calculation in check_and_update_achievements
-- Date: 2026-03-30 19:00:00
-- Description: The CTE streak calculation was mathematically broken - 
--   completion_date = completion_date + (row_num - 1) days is only true when row_num = 1,
--   so current_streak was always 1. Fix: use player_stats.current_streak instead,
--   consistent with get_user_achievements_with_progress.

DROP FUNCTION IF EXISTS check_and_update_achievements(UUID);

CREATE OR REPLACE FUNCTION check_and_update_achievements(user_id_param UUID)
RETURNS TABLE(
  achievement_name TEXT,
  achievement_reward_gems INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_completed INTEGER;
    current_streak INTEGER;
    current_level INTEGER;
    user_total_xp INTEGER;
    current_gems INTEGER;
    user_prestige_base_xp INTEGER;
    effective_xp INTEGER;
    achievement RECORD;
    v_newly_unlocked BOOLEAN;
BEGIN
    -- Get current player stats including current_streak from login tracking
    SELECT 
        COALESCE(ps.level, 1), 
        COALESCE(ps.total_xp, ps.xp, 0), 
        COALESCE(ps.gems, 0), 
        COALESCE(ps.prestige_base_xp, 0),
        COALESCE(ps.current_streak, 0)
    INTO current_level, user_total_xp, current_gems, user_prestige_base_xp, current_streak
    FROM player_stats ps
    WHERE ps.user_id = user_id_param;
    
    -- If no player stats exist, create them
    IF NOT FOUND THEN
        INSERT INTO player_stats (user_id, xp, level, gems, current_streak, highest_streak)
        VALUES (user_id_param, 0, 1, 0, 0, 0);
        current_level := 1;
        user_total_xp := 0;
        current_gems := 0;
        user_prestige_base_xp := 0;
        current_streak := 0;
    END IF;

    -- Calculate effective XP since prestige
    effective_xp := user_total_xp - user_prestige_base_xp;

    -- Calculate total completed todos (including archived ones)
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE todos.user_id = user_id_param 
    AND completed_at IS NOT NULL;
    
    -- Update or insert user achievements based on conditions
    FOR achievement IN 
        SELECT a.id, a.name, a.condition_type, a.condition_value, a.reward_gems, a.category
        FROM achievements a
        WHERE a.is_active = true
    LOOP
        -- Check if achievement is already unlocked
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_achievements.user_id = user_id_param AND user_achievements.achievement_id = achievement.id
        ) THEN
            v_newly_unlocked := false;
            
            -- Check conditions based on type and category
            CASE achievement.condition_type
                WHEN 'complete_count' THEN
                    IF total_completed >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        v_newly_unlocked := true;
                    END IF;
                    
                WHEN 'streak_days' THEN
                    IF current_streak >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        v_newly_unlocked := true;
                    END IF;
                    
                WHEN 'reach_value' THEN
                    -- Use category to determine what value to check
                    CASE achievement.category
                        WHEN 'level' THEN
                            IF current_level >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                            
                        WHEN 'xp' THEN
                            IF effective_xp >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                            
                        WHEN 'gems' THEN
                            IF current_gems >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                    END CASE;
            END CASE;
            
            -- Return newly unlocked achievement
            IF v_newly_unlocked THEN
                RETURN QUERY SELECT achievement.name::TEXT, achievement.reward_gems::INTEGER;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;
