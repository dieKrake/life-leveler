-- Migration: Expose achievement unlock errors instead of silently catching them
-- Date: 2026-03-24 10:00:00
-- Description: Remove EXCEPTION handler to see actual errors from check_and_update_achievements

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
    v_achievement RECORD;
    v_achievement_gems INT := 0;
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
        IF xp_from_todo = 10 THEN
            gems_from_todo := 1;
            v_difficulty := 'easy';
        ELSIF xp_from_todo = 20 THEN
            gems_from_todo := 2;
            v_difficulty := 'medium';
        ELSIF xp_from_todo = 30 THEN
            gems_from_todo := 4;
            v_difficulty := 'hard';
        ELSE
            gems_from_todo := 0;
            v_difficulty := 'medium';
        END IF;

        -- Get current streak and calculate multiplier
        SELECT COALESCE(ps.current_streak, 0) INTO user_streak 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;
        
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := ROUND(xp_from_todo * streak_multiplier)::INTEGER;

        -- Update player stats with todo rewards
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
            RAISE WARNING 'auto_claim_completed_challenges failed: %', SQLERRM;
            v_claimed_challenges := '[]'::jsonb;
        END;
        
        -- AUTO-UNLOCK ACHIEVEMENTS (NO EXCEPTION HANDLER - let errors bubble up)
        RAISE NOTICE 'About to check achievements for user %', v_user_id;
        
        FOR v_achievement IN 
            SELECT * FROM check_and_update_achievements(v_user_id)
        LOOP
            RAISE NOTICE 'Achievement unlocked: % (% gems)', v_achievement.achievement_name, v_achievement.reward_gems;
            
            v_unlocked_achievements := v_unlocked_achievements || 
                jsonb_build_array(jsonb_build_object(
                    'name', v_achievement.achievement_name,
                    'reward_gems', v_achievement.reward_gems
                ));
            v_achievement_gems := v_achievement_gems + v_achievement.reward_gems;
        END LOOP;
        
        RAISE NOTICE 'Achievement check complete. Total gems from achievements: %', v_achievement_gems;
        
        -- Add achievement gems via XP system
        IF v_achievement_gems > 0 THEN
            PERFORM public.update_player_xp_and_gems(0, v_achievement_gems);
        END IF;

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

GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;

COMMENT ON FUNCTION complete_todo(BIGINT) IS 
'Completes a todo and automatically claims challenges and unlocks achievements.
NO EXCEPTION HANDLER on achievements - errors will bubble up to API for debugging.';
