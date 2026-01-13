-- Seed data for Health Habits - 30 days of daily grid logs
-- Profile ID to use: 'd54d4893-d74f-429c-9b4a-f84ce0607552'
-- This seed file creates 30 days of health habit data for area chart visualization
--
-- IMPORTANT: This seed file should be run with service_role permissions to bypass RLS policies
-- Usage: Execute this file using a database client with service_role credentials
-- or temporarily disable RLS: ALTER TABLE routine_daily_grid_logs DISABLE ROW LEVEL SECURITY;

-- First, ensure default grid options exist for the user
-- If they don't exist, create them
DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
  v_option_ids RECORD;
BEGIN
  -- Check if user has any grid options, if not, create defaults
  IF NOT EXISTS (
    SELECT 1 FROM routine_grid_options WHERE user_id = v_user_id LIMIT 1
  ) THEN
    -- Create default grid options for each category
    -- Exercise
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'exercise', '없음', 'preset', 0),
      (v_user_id, 'exercise', '저강도', 'preset', 1),
      (v_user_id, 'exercise', '중강도', 'preset', 2),
      (v_user_id, 'exercise', '고강도', 'preset', 3)
    ON CONFLICT DO NOTHING;
    
    -- Sleep
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'sleep', '없음', 'preset', 0),
      (v_user_id, 'sleep', '불면', 'preset', 1),
      (v_user_id, 'sleep', '보통', 'preset', 2),
      (v_user_id, 'sleep', '숙면', 'preset', 3)
    ON CONFLICT DO NOTHING;
    
    -- Supplement
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'supplement', '없음', 'preset', 0),
      (v_user_id, 'supplement', '섭취', 'preset', 1)
    ON CONFLICT DO NOTHING;
    
    -- Diet
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'diet', '없음', 'preset', 0),
      (v_user_id, 'diet', '보통', 'preset', 1),
      (v_user_id, 'diet', '과식', 'preset', 2)
    ON CONFLICT DO NOTHING;
    
    -- Therapy
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'therapy', '없음', 'preset', 0),
      (v_user_id, 'therapy', '실행', 'preset', 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Generate 30 days of health habit logs
-- Pattern: Create varied scores to show realistic trends
-- Days 1-10: Lower scores (recovery period)
-- Days 11-20: Improving scores
-- Days 21-30: Good scores with some variation

DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
  v_date DATE;
  v_day_offset INTEGER;
  v_option_exercise_none UUID;
  v_option_exercise_low UUID;
  v_option_exercise_medium UUID;
  v_option_exercise_high UUID;
  v_option_sleep_none UUID;
  v_option_sleep_insomnia UUID;
  v_option_sleep_normal UUID;
  v_option_sleep_good UUID;
  v_option_supplement_none UUID;
  v_option_supplement_taken UUID;
  v_option_diet_none UUID;
  v_option_diet_normal UUID;
  v_option_diet_overeat UUID;
  v_option_therapy_none UUID;
  v_option_therapy_done UUID;
  v_score_variation INTEGER;
BEGIN
  -- Get option IDs
  SELECT id INTO v_option_exercise_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_exercise_low FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '저강도' LIMIT 1;
  SELECT id INTO v_option_exercise_medium FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '중강도' LIMIT 1;
  SELECT id INTO v_option_exercise_high FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '고강도' LIMIT 1;
  
  SELECT id INTO v_option_sleep_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'sleep' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_sleep_insomnia FROM routine_grid_options WHERE user_id = v_user_id AND category = 'sleep' AND label = '불면' LIMIT 1;
  SELECT id INTO v_option_sleep_normal FROM routine_grid_options WHERE user_id = v_user_id AND category = 'sleep' AND label = '보통' LIMIT 1;
  SELECT id INTO v_option_sleep_good FROM routine_grid_options WHERE user_id = v_user_id AND category = 'sleep' AND label = '숙면' LIMIT 1;
  
  SELECT id INTO v_option_supplement_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'supplement' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_supplement_taken FROM routine_grid_options WHERE user_id = v_user_id AND category = 'supplement' AND label = '섭취' LIMIT 1;
  
  SELECT id INTO v_option_diet_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'diet' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_diet_normal FROM routine_grid_options WHERE user_id = v_user_id AND category = 'diet' AND label = '보통' LIMIT 1;
  SELECT id INTO v_option_diet_overeat FROM routine_grid_options WHERE user_id = v_user_id AND category = 'diet' AND label = '과식' LIMIT 1;
  
  SELECT id INTO v_option_therapy_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'therapy' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_therapy_done FROM routine_grid_options WHERE user_id = v_user_id AND category = 'therapy' AND label = '실행' LIMIT 1;
  
  -- Generate logs for the last 30 days (excluding today)
  FOR v_day_offset IN 1..30 LOOP
    v_date := CURRENT_DATE - v_day_offset;
    
    -- Calculate score variation based on day (creating a trend)
    -- Days 1-10: Lower scores (40-60)
    -- Days 11-20: Improving scores (55-75)
    -- Days 21-30: Good scores (65-85)
    IF v_day_offset <= 10 THEN
      v_score_variation := (v_day_offset % 3); -- 0, 1, 2
    ELSIF v_day_offset <= 20 THEN
      v_score_variation := 2 + ((v_day_offset - 10) % 3); -- 2, 3, 4
    ELSE
      v_score_variation := 3 + ((v_day_offset - 20) % 3); -- 3, 4, 5
    END IF;
    
    -- Exercise: am, noon, pm
    -- Pattern varies by day
    IF v_score_variation >= 3 THEN
      -- Good day: medium or high intensity
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'exercise', v_option_exercise_medium),
        (v_user_id, v_date, 'pm', 'exercise', v_option_exercise_low)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation >= 1 THEN
      -- Average day: low intensity
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'exercise', v_option_exercise_low)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      -- Low day: none or low
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'exercise', v_option_exercise_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;
    
    -- Sleep: bed
    IF v_score_variation >= 4 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'bed', 'sleep', v_option_sleep_good)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation >= 2 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'bed', 'sleep', v_option_sleep_normal)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation = 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'bed', 'sleep', v_option_sleep_insomnia)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'bed', 'sleep', v_option_sleep_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;
    
    -- Supplement: am, noon, pm, bed
    IF v_score_variation >= 2 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'supplement', v_option_supplement_taken),
        (v_user_id, v_date, 'pm', 'supplement', v_option_supplement_taken)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation = 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'supplement', v_option_supplement_taken)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'supplement', v_option_supplement_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;
    
    -- Diet: am, noon, pm
    IF v_score_variation >= 3 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'diet', v_option_diet_normal),
        (v_user_id, v_date, 'noon', 'diet', v_option_diet_normal),
        (v_user_id, v_date, 'pm', 'diet', v_option_diet_normal)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation >= 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'diet', v_option_diet_normal),
        (v_user_id, v_date, 'noon', 'diet', v_option_diet_normal)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'pm', 'diet', v_option_diet_overeat)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;
    
    -- Therapy: am, noon, pm, bed
    IF v_score_variation >= 3 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'therapy', v_option_therapy_done),
        (v_user_id, v_date, 'pm', 'therapy', v_option_therapy_done)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation >= 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'therapy', v_option_therapy_done)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'therapy', v_option_therapy_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;
    
  END LOOP;
END $$;

-- Summary
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT log_date) as days_with_data,
  MIN(log_date) as earliest_date,
  MAX(log_date) as latest_date
FROM routine_daily_grid_logs
WHERE user_id = 'd54d4893-d74f-429c-9b4a-f84ce0607552';

