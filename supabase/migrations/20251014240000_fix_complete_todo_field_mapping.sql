-- Migration: Fix complete_todo field mapping for new update_player_xp_and_gems return structure
-- Date: 2025-10-14 24:00:00
-- Description: Update complete_todo to use correct field names from update_player_xp_and_gems

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
    v_current_gems INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Store completed XP and gems at completion time
    UPDATE public.todos
    SET 
        is_completed = TRUE, 
        completed_at = NOW()
    WHERE id = todo_id AND user_id = v_user_id AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        -- Calculate gems based on difficulty
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        -- Get current streak and calculate multiplier
        SELECT ps.current_streak INTO user_streak 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;
        
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Store the current gems before XP update
        SELECT ps.gems INTO v_current_gems 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;

        -- Call update_player_xp_and_gems and capture the result
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Store completed XP and gems for potential uncomplete
        UPDATE public.todos
        SET 
            completed_xp = final_xp_to_add,
            completed_gems = gems_from_todo
        WHERE id = todo_id AND user_id = v_user_id;
        
        -- Update challenge progress
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
        -- Map the new field names to the expected return structure
        RETURN QUERY SELECT 
            level_up_result.level_up,
            level_up_result.new_level,
            final_xp_to_add, -- Return the actual XP gained (not new_xp which is current level XP)
            gems_from_todo, -- Return the gems gained (not new_gems which is total gems)
            (level_up_result.new_level >= 10)::BOOLEAN as can_prestige,
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
