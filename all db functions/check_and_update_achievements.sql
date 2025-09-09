
DECLARE
    total_completed INTEGER;
    completed_today INTEGER;
    current_streak INTEGER;
    current_level INTEGER;
    current_xp INTEGER;
    current_gems INTEGER;
    achievement RECORD;
BEGIN
    -- Get current player stats
    SELECT level, xp, gems INTO current_level, current_xp, current_gems
    FROM player_stats 
    WHERE user_id = user_id_param;
    
    -- If no player stats exist, create them
    IF NOT FOUND THEN
        INSERT INTO player_stats (user_id, xp, level, gems, current_streak, streak_multiplier)
        VALUES (user_id_param, 0, 1, 0, 0, 1.0);
        current_level := 1;
        current_xp := 0;
        current_gems := 0;
    END IF;

    -- Calculate total completed todos (including archived ones)
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND completed_at IS NOT NULL;
    
    -- Calculate todos completed today (including archived ones)
    SELECT COUNT(*) INTO completed_today
    FROM todos 
    WHERE user_id = user_id_param 
    AND completed_at IS NOT NULL
    AND DATE(completed_at) = CURRENT_DATE;
    
    -- Calculate current streak (including archived todos)
    WITH daily_completions AS (
        SELECT DATE(completed_at) as completion_date
        FROM todos 
        WHERE user_id = user_id_param 
        AND completed_at IS NOT NULL
        GROUP BY DATE(completed_at)
        ORDER BY DATE(completed_at) DESC
    ),
    streak_calculation AS (
        SELECT 
            completion_date,
            ROW_NUMBER() OVER (ORDER BY completion_date DESC) as row_num,
            completion_date + INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1) as expected_date
        FROM daily_completions
    )
    SELECT COUNT(*) INTO current_streak
    FROM streak_calculation
    WHERE completion_date = expected_date
    AND completion_date <= CURRENT_DATE;
    
    -- Update or insert user achievements based on conditions
    FOR achievement IN 
        SELECT id, condition_type, condition_value, reward_gems, category
        FROM achievements
        WHERE is_active = true
    LOOP
        -- Check if achievement is already unlocked
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_id_param AND achievement_id = achievement.id
        ) THEN
            -- Check conditions based on type and category
            CASE achievement.condition_type
                WHEN 'complete_count' THEN
                    IF total_completed >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        
                        -- Award gems
                        UPDATE player_stats 
                        SET gems = gems + achievement.reward_gems
                        WHERE user_id = user_id_param;
                    END IF;
                    
                WHEN 'streak_days' THEN
                    IF current_streak >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        
                        -- Award gems
                        UPDATE player_stats 
                        SET gems = gems + achievement.reward_gems
                        WHERE user_id = user_id_param;
                    END IF;
                    
                WHEN 'reach_value' THEN
                    -- Use category to determine what value to check
                    CASE achievement.category
                        WHEN 'level' THEN
                            IF current_level >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                
                                UPDATE player_stats 
                                SET gems = gems + achievement.reward_gems
                                WHERE user_id = user_id_param;
                            END IF;
                            
                        WHEN 'xp' THEN
                            IF current_xp >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                
                                UPDATE player_stats 
                                SET gems = gems + achievement.reward_gems
                                WHERE user_id = user_id_param;
                            END IF;
                            
                        WHEN 'gems' THEN
                            IF current_gems >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                
                                UPDATE player_stats 
                                SET gems = gems + achievement.reward_gems
                                WHERE user_id = user_id_param;
                            END IF;
                    END CASE;
            END CASE;
        END IF;
    END LOOP;
END;
