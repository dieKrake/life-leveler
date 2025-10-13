-- Migration: Fix complete_todo to actually update challenge progress
-- Date: 2025-10-13 27:00:00
-- Description: Add missing call to check_and_update_challenges_on_todo_complete

DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  level_up BOOLEAN,
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  can_prestige BOOLEAN,
  unlockable_achievements JSONB,
  completed_challenges JSONB
) AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
    level_up_result RECORD;
    v_user_id UUID;
    v_unlockable_achievements JSONB;
    v_completed_challenges JSONB;
BEGIN
    v_user_id := auth.uid();
    
    UPDATE public.todos
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = todo_id AND user_id = v_user_id AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = v_user_id;
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Call update_player_xp_and_gems and capture the result
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- CRITICAL FIX: Update challenge progress
        PERFORM check_and_update_challenges_on_todo_complete(
            v_user_id,
            todo_id,
            final_xp_to_add,
            CASE xp_from_todo
                WHEN 10 THEN 'easy'
                WHEN 20 THEN 'medium'
                WHEN 30 THEN 'hard'
                ELSE 'medium'
            END,
            NOW()
        );
        
        -- Check for newly unlockable achievements (not yet unlocked but conditions met)
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', a.achievement_id,
            'name', a.name,
            'reward_gems', a.reward_gems,
            'icon', a.icon
        )), '[]'::jsonb) INTO v_unlockable_achievements
        FROM get_user_achievements_with_progress(v_user_id) a
        WHERE a.is_unlocked = false 
          AND a.current_progress >= a.condition_value;
        
        -- Check for completed challenges (completed but not claimed)
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'xp_reward', c.xp_reward,
            'gem_reward', c.gem_reward
        )), '[]'::jsonb) INTO v_completed_challenges
        FROM (
            SELECT * FROM get_user_challenges(v_user_id)
        ) c
        WHERE c.completed = true AND c.claimed = false;

        -- Return the level-up information plus achievements/challenges
        RETURN QUERY SELECT 
            level_up_result.level_up,
            level_up_result.new_level,
            level_up_result.xp_gained,
            level_up_result.gems_gained,
            level_up_result.can_prestige,
            v_unlockable_achievements,
            v_completed_challenges;
    ELSE
        -- No XP gained, return default values
        RETURN QUERY SELECT 
            false::BOOLEAN,
            1::INTEGER,
            0::INTEGER,
            0::INTEGER,
            false::BOOLEAN,
            '[]'::JSONB,
            '[]'::JSONB;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;