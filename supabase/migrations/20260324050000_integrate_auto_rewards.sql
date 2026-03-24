-- Migration: Integrate auto-claim and auto-unlock into complete_todo
-- Date: 2026-03-24 05:00:00
-- Description: Extend complete_todo to automatically claim challenges and unlock achievements

DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  level_up BOOLEAN,
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  can_prestige BOOLEAN,
  claimed_challenges JSONB,
  unlocked_achievements JSONB
) AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC := 1.0;
    final_xp_to_add INT;
    user_streak INT := 0;
    level_up_result RECORD;
    v_user_id UUID;
    v_claimed_challenges JSONB := '[]'::jsonb;
    v_unlocked_achievements JSONB := '[]'::jsonb;
    v_difficulty TEXT;
    v_challenge RECORD;
    v_achievement RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Update todo as completed and get XP value
    UPDATE public.todos
    SET 
        is_completed = TRUE, 
        completed_at = NOW()
    WHERE id = todo_id AND user_id = v_user_id AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Todo not found or already completed';
    END IF;

    IF xp_from_todo > 0 THEN
        -- Determine difficulty and gems based on XP value
        CASE xp_from_todo
            WHEN 10 THEN 
                gems_from_todo := 1;
                v_difficulty := 'easy';
            WHEN 20 THEN 
                gems_from_todo := 2;
                v_difficulty := 'medium';
            WHEN 30 THEN 
                gems_from_todo := 4;
                v_difficulty := 'hard';
            ELSE 
                gems_from_todo := 0;
                v_difficulty := 'medium';
        END CASE;

        -- Get current streak and calculate multiplier
        SELECT COALESCE(ps.current_streak, 0) INTO user_streak 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;
        
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := ROUND(xp_from_todo * streak_multiplier)::INTEGER;

        -- Update player stats
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Store completion data for potential uncomplete
        UPDATE public.todos
        SET 
            completed_xp = final_xp_to_add,
            completed_gems = gems_from_todo,
            completed_difficulty = v_difficulty
        WHERE id = todo_id AND user_id = v_user_id;
        
        -- Update challenge progress
        PERFORM check_and_update_challenges_on_todo_complete(
            v_user_id,
            todo_id,
            final_xp_to_add,
            v_difficulty,
            NOW()
        );
        
        -- AUTO-CLAIM COMPLETED CHALLENGES
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'title', c.challenge_title,
                'xp_earned', c.xp_earned,
                'gems_earned', c.gems_earned
            )), '[]'::jsonb) INTO v_claimed_challenges
            FROM auto_claim_completed_challenges(v_user_id) c;
        EXCEPTION WHEN OTHERS THEN
            v_claimed_challenges := '[]'::jsonb;
        END;
        
        -- AUTO-UNLOCK ACHIEVEMENTS
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'name', a.achievement_name,
                'reward_gems', a.reward_gems
            )), '[]'::jsonb) INTO v_unlocked_achievements
            FROM check_and_update_achievements(v_user_id) a;
        EXCEPTION WHEN OTHERS THEN
            v_unlocked_achievements := '[]'::jsonb;
        END;

        -- Return results
        RETURN QUERY SELECT 
            COALESCE(level_up_result.level_up, false),
            COALESCE(level_up_result.new_level, 1),
            final_xp_to_add,
            gems_from_todo,
            (COALESCE(level_up_result.new_level, 1) >= 10)::BOOLEAN as can_prestige,
            v_claimed_challenges,
            v_unlocked_achievements;
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION complete_todo(BIGINT) IS 
'Completes a todo and automatically claims any completed challenges and unlocks any earned achievements.
Returns level-up info, claimed challenges, and unlocked achievements for immediate UI feedback.';
