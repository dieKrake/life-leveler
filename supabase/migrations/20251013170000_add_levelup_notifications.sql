-- Migration: Add level-up notifications to complete_todo function
-- Date: 2025-10-13 17:00:00
-- Description: Modify complete_todo to return level-up information for notifications

-- Drop and recreate complete_todo to return level-up information
DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  level_up BOOLEAN,
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  can_prestige BOOLEAN
) AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
    level_up_result RECORD;
BEGIN
    UPDATE public.todos
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Call update_player_xp_and_gems and capture the result
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);

        -- Return the level-up information
        RETURN QUERY SELECT 
            level_up_result.level_up,
            level_up_result.new_level,
            level_up_result.xp_gained,
            level_up_result.gems_gained,
            level_up_result.can_prestige;
    ELSE
        -- No XP gained, return default values
        RETURN QUERY SELECT 
            false::BOOLEAN,
            1::INTEGER,
            0::INTEGER,
            0::INTEGER,
            false::BOOLEAN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;
