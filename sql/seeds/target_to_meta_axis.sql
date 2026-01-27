-- =========================
-- Target → Meta Axis Seed (관리용)
-- =========================
-- NOTE:
-- - 이 파일은 "각 표적은 1개의 축에만 연결" 규칙을 유지하도록 설계되었습니다.
-- - 축(메타축) 분류는 `sql/seeds/natural_targets.sql`의 섹션 주석을 기준으로 합니다.
-- - 재실행 시, 아래에 나열된(관리 대상) 표적들에 대해서만 기존 매핑을 정리한 뒤 재삽입합니다.

WITH managed_targets AS (
  SELECT id
  FROM natural_targets
  WHERE slug IN (
    -- abnormal_signals
    'hedgehog','wnt_beta_catenin','notch','stat3','nfkb','ampk','ras','akt','cmyc','cyclin_d1','mir_34a',
    'integrins','estrogen_receptor','egfr','her2',

    -- immune_balance
    'tlr4','tlr9','il1','il6','cox','pge2',

    -- metabolic_pressure
    'insulin','igf1','glut1','aerobic_glycolysis','pppathway','hexokinase2',
    'oxphos','complex1','pdh','pdk',
    'srebp1','srebp2','acly','fas','mevalonate','fao','ldlr','acetate-srebp-1','mevalonate-srebp-2',
    'mtor','glutaminolysis','glutamine_transport','glutaminase','gdh_kgdh',
    'autophagy_nucleoside_salvage','macropinocytosis','nucleoside_salvage','gln_oxphos',

    -- recovery
    'mmp2','mmp3','mmp9','vegf','pdgf','tgfb','hif',
    'ros','glutathione','caspases','bcl2_bax','fas_receptor','caspase3'
  )
)
DELETE FROM target_to_meta_axis
WHERE target_id IN (SELECT id FROM managed_targets);

-- =========================
-- 대사 안정화 (metabolic_pressure)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'metabolic_pressure', 1.0 FROM natural_targets
WHERE slug IN (
  'insulin','igf1',
  'glut1','aerobic_glycolysis','pppathway','hexokinase2',
  'oxphos','complex1','pdh','pdk',
  'mtor',
  'glutaminolysis','glutamine_transport','glutaminase','gdh_kgdh',
  'autophagy_nucleoside_salvage','macropinocytosis','nucleoside_salvage','gln_oxphos',
  'srebp1','srebp2','acly','fas','mevalonate','fao','ldlr','acetate-srebp-1','mevalonate-srebp-2'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight;

-- =========================
-- 면역 균형 (immune_balance)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'immune_balance', 1.0 FROM natural_targets
WHERE slug IN (
  'il1','il6','cox','pge2',
  'tlr4','tlr9'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight;

-- =========================
-- 비정상 신호조절 (abnormal_signals)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'abnormal_signals', 1.0 FROM natural_targets
WHERE slug IN (
  'integrins',
  'estrogen_receptor',
  'egfr','her2',
  'hedgehog','wnt_beta_catenin','notch','stat3','nfkb','ampk',
  'ras','akt','cmyc','cyclin_d1','mir_34a'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight;

-- =========================
-- 신경·스트레스 (neuro_stress)
-- =========================
-- 현재 타겟 없음 (추후 추가 가능)
-- INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
-- SELECT id, 'neuro_stress', 1.0 FROM natural_targets
-- WHERE slug IN (
--   -- 추후 추가 예정
-- );

-- =========================
-- 회복증진 (recovery)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'recovery', 1.0 FROM natural_targets
WHERE slug IN (
  'mmp2','mmp3','mmp9',
  'vegf','pdgf','tgfb','hif',
  'ros','glutathione','caspases','bcl2_bax','fas_receptor','caspase3'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight;