-- =========================
-- Dashboard 시각화용 시드
-- =========================
-- 기존 natural_targets, natural_ingredients, target_to_meta_axis, ingredient_target_evidence는 건드리지 않음.
-- 기존 patient_health_profiles, blood_test_results는 그대로 사용.
-- 30일치 보조제·생활습관(routine_daily_grid_logs) + 오늘 데이터 추가.
--
-- 사용자 ID: 로그인한 사용자의 auth.users.id
-- 기본값: 'd54d4893-d74f-429c-9b4a-f84ce0607552'
-- ※ 본인 ID로 쓰려면 v_user_id 수정
--
-- 실행: psql 또는 Supabase SQL Editor에서 실행 (service_role 또는 RLS 우회 권장)

-- =========================
-- 1. routine_grid_options (preset) - 없을 때만
-- =========================
DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM routine_grid_options WHERE user_id = v_user_id LIMIT 1) THEN
    INSERT INTO routine_grid_options (user_id, category, label, kind, sort_order)
    VALUES
      (v_user_id, 'exercise', '없음', 'preset', 0),
      (v_user_id, 'exercise', '저강도', 'preset', 1),
      (v_user_id, 'exercise', '중강도', 'preset', 2),
      (v_user_id, 'exercise', '고강도', 'preset', 3),
      (v_user_id, 'sleep', '없음', 'preset', 0),
      (v_user_id, 'sleep', '불면', 'preset', 1),
      (v_user_id, 'sleep', '보통', 'preset', 2),
      (v_user_id, 'sleep', '숙면', 'preset', 3),
      (v_user_id, 'supplement', '없음', 'preset', 0),
      (v_user_id, 'supplement', '섭취', 'preset', 1),
      (v_user_id, 'diet', '없음', 'preset', 0),
      (v_user_id, 'diet', '보통', 'preset', 1),
      (v_user_id, 'diet', '과식', 'preset', 2),
      (v_user_id, 'therapy', '없음', 'preset', 0),
      (v_user_id, 'therapy', '실행', 'preset', 1);
  END IF;
END $$;

-- =========================
-- 2. routine_templates + routine_items (기존 natural_ingredients 참조)
--    없을 때만 생성. natural_* 테이블은 수정하지 않음.
-- =========================
DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
  v_template_id UUID;
  v_curcumin_id UUID;
  v_berberine_id UUID;
  v_egcg_id UUID;
  v_omega_id UUID;
BEGIN
  -- 이미 템플릿이 있으면 스킵
  IF EXISTS (SELECT 1 FROM routine_templates WHERE user_id = v_user_id AND section_type = 'supplement' LIMIT 1) THEN
    RAISE NOTICE 'routine_templates already exist. Skipping.';
    RETURN;
  END IF;

  SELECT id INTO v_curcumin_id FROM natural_ingredients WHERE slug = 'curcumin' LIMIT 1;
  SELECT id INTO v_berberine_id FROM natural_ingredients WHERE slug = 'berberine' LIMIT 1;
  SELECT id INTO v_egcg_id FROM natural_ingredients WHERE slug = 'egcg' LIMIT 1;
  SELECT id INTO v_omega_id FROM natural_ingredients WHERE slug = 'omega_3' LIMIT 1;

  IF v_curcumin_id IS NULL OR v_berberine_id IS NULL THEN
    RAISE NOTICE 'natural_ingredients (curcumin/berberine) not found. Run natural_ingredients.sql first.';
    RETURN;
  END IF;

  INSERT INTO routine_templates (user_id, section_type, name, notes, sort_order)
  VALUES (v_user_id, 'supplement', '아침 루틴', '커큐민·베르베린 복합', 0)
  RETURNING id INTO v_template_id;

  INSERT INTO routine_items (template_id, sort_order, label, ingredient_id, amount_num, amount_unit)
  VALUES
    (v_template_id, 0, '커큐민 500mg', v_curcumin_id, 500, 'mg'),
    (v_template_id, 1, '베르베린 300mg', v_berberine_id, 300, 'mg');
  IF v_egcg_id IS NOT NULL THEN
    INSERT INTO routine_items (template_id, sort_order, label, ingredient_id, amount_num, amount_unit)
    VALUES (v_template_id, 2, 'EGCG 200mg', v_egcg_id, 200, 'mg');
  END IF;
  IF v_omega_id IS NOT NULL THEN
    INSERT INTO routine_items (template_id, sort_order, label, ingredient_id, amount_num, amount_unit)
    VALUES (v_template_id, 3, '오메가3 1000mg', v_omega_id, 1000, 'mg');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM routine_grid_options WHERE user_id = v_user_id AND category = 'supplement' AND template_id = v_template_id) THEN
    INSERT INTO routine_grid_options (user_id, category, label, kind, template_id, sort_order)
    VALUES (v_user_id, 'supplement', '아침 루틴', 'template', v_template_id, 2);
  END IF;
END $$;

-- =========================
-- 3. 30일치 routine_daily_grid_logs (보조제 + 생활습관)
--    어제 ~ 30일 전. 생활습관 영역 차트·레이더 기준선용.
-- =========================
DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
  v_date DATE;
  v_day_offset INT;
  v_option_exercise_none UUID;
  v_option_exercise_low UUID;
  v_option_exercise_medium UUID;
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
  v_template_id UUID;
  v_score_variation INT;
BEGIN
  SELECT id INTO v_option_exercise_none FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '없음' LIMIT 1;
  SELECT id INTO v_option_exercise_low FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '저강도' LIMIT 1;
  SELECT id INTO v_option_exercise_medium FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '중강도' LIMIT 1;
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
  SELECT id INTO v_template_id FROM routine_templates WHERE user_id = v_user_id AND section_type = 'supplement' LIMIT 1;

  FOR v_day_offset IN 1..30 LOOP
    v_date := CURRENT_DATE - v_day_offset;

    IF v_day_offset <= 10 THEN
      v_score_variation := (v_day_offset % 3);
    ELSIF v_day_offset <= 20 THEN
      v_score_variation := 2 + ((v_day_offset - 10) % 3);
    ELSE
      v_score_variation := 3 + ((v_day_offset - 20) % 3);
    END IF;

    -- Exercise
    IF v_score_variation >= 3 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'exercise', v_option_exercise_medium),
        (v_user_id, v_date, 'pm', 'exercise', v_option_exercise_low)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSIF v_score_variation >= 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'exercise', v_option_exercise_low)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'exercise', v_option_exercise_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;

    -- Sleep
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

    -- Supplement: 최근 7일은 template(레이더/대사), 나머지는 preset
    IF v_day_offset <= 7 AND v_template_id IS NOT NULL THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, template_id)
      VALUES
        (v_user_id, v_date, 'am', 'supplement', v_template_id),
        (v_user_id, v_date, 'pm', 'supplement', v_template_id)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET template_id = EXCLUDED.template_id, option_id = NULL;
    ELSIF v_score_variation >= 2 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES
        (v_user_id, v_date, 'am', 'supplement', v_option_supplement_taken),
        (v_user_id, v_date, 'pm', 'supplement', v_option_supplement_taken)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id, template_id = NULL;
    ELSIF v_score_variation = 1 THEN
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'supplement', v_option_supplement_taken)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id, template_id = NULL;
    ELSE
      INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
      VALUES (v_user_id, v_date, 'am', 'supplement', v_option_supplement_none)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id, template_id = NULL;
    END IF;

    -- Diet
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
      VALUES (v_user_id, v_date, 'pm', 'diet', v_option_diet_overeat)
      ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
    END IF;

    -- Therapy
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

  RAISE NOTICE '30 days routine_daily_grid_logs inserted';
END $$;

-- =========================
-- 4. 오늘 날짜 routine_daily_grid_logs
--    (천연물 표적 레이더, 대사 안정화, 생활습관 점수용)
-- =========================
DO $$
DECLARE
  v_user_id UUID := 'd54d4893-d74f-429c-9b4a-f84ce0607552';
  v_today DATE := CURRENT_DATE;
  v_template_id UUID;
  v_option_exercise_medium UUID;
  v_option_sleep_normal UUID;
  v_option_diet_normal UUID;
  v_option_therapy_done UUID;
BEGIN
  SELECT id INTO v_template_id FROM routine_templates WHERE user_id = v_user_id AND section_type = 'supplement' LIMIT 1;
  SELECT id INTO v_option_exercise_medium FROM routine_grid_options WHERE user_id = v_user_id AND category = 'exercise' AND label = '중강도' LIMIT 1;
  SELECT id INTO v_option_sleep_normal FROM routine_grid_options WHERE user_id = v_user_id AND category = 'sleep' AND label = '보통' LIMIT 1;
  SELECT id INTO v_option_diet_normal FROM routine_grid_options WHERE user_id = v_user_id AND category = 'diet' AND label = '보통' LIMIT 1;
  SELECT id INTO v_option_therapy_done FROM routine_grid_options WHERE user_id = v_user_id AND category = 'therapy' AND label = '실행' LIMIT 1;

  -- Supplement: template (레이더/대사 안정화 차트)
  IF v_template_id IS NOT NULL THEN
    INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, template_id)
    VALUES
      (v_user_id, v_today, 'am', 'supplement', v_template_id),
      (v_user_id, v_today, 'pm', 'supplement', v_template_id)
    ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET template_id = EXCLUDED.template_id, option_id = NULL;
  END IF;

  -- Exercise
  IF v_option_exercise_medium IS NOT NULL THEN
    INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
    VALUES
      (v_user_id, v_today, 'am', 'exercise', v_option_exercise_medium),
      (v_user_id, v_today, 'pm', 'exercise', v_option_exercise_medium)
    ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
  END IF;

  -- Sleep
  IF v_option_sleep_normal IS NOT NULL THEN
    INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
    VALUES (v_user_id, v_today, 'bed', 'sleep', v_option_sleep_normal)
    ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
  END IF;

  -- Diet
  IF v_option_diet_normal IS NOT NULL THEN
    INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
    VALUES
      (v_user_id, v_today, 'am', 'diet', v_option_diet_normal),
      (v_user_id, v_today, 'noon', 'diet', v_option_diet_normal),
      (v_user_id, v_today, 'pm', 'diet', v_option_diet_normal)
    ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
  END IF;

  -- Therapy
  IF v_option_therapy_done IS NOT NULL THEN
    INSERT INTO routine_daily_grid_logs (user_id, log_date, time_block, category, option_id)
    VALUES
      (v_user_id, v_today, 'am', 'therapy', v_option_therapy_done),
      (v_user_id, v_today, 'pm', 'therapy', v_option_therapy_done)
    ON CONFLICT (user_id, log_date, time_block, category) DO UPDATE SET option_id = EXCLUDED.option_id;
  END IF;

  RAISE NOTICE 'Today (%) routine_daily_grid_logs inserted/updated', v_today;
END $$;
