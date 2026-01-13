-- =========================
-- 기존 데이터 삭제 (새로운 5축 구조로 재구성)
-- =========================
DELETE FROM target_to_meta_axis;

-- =========================
-- 대사 안정화 (metabolic_pressure)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'metabolic_pressure', 1.0 FROM natural_targets
WHERE slug IN (
  'insulin','igf1',
  'glut1','aerobic_glycolysis','ppp','hexokinase2',
  'oxphos','complex1','pdh','pdk',
  'ampk','mtor',
  'glutaminolysis','glutamine_transport','glutaminase','gdh_kgdh',
  'srebp1','srebp2','acly','fas','mevalonate','fao','ldlr'
);

-- =========================
-- 면역 균형 (immune_balance)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'immune_balance', 1.0 FROM natural_targets
WHERE slug IN (
  'nfkb',
  'il1','il6','cox','pge2',
  'tlr4','tlr9'
);

-- =========================
-- 비정상 신호조절 (abnormal_signals)
-- =========================
INSERT INTO target_to_meta_axis (target_id, meta_axis, axis_weight)
SELECT id, 'abnormal_signals', 1.0 FROM natural_targets
WHERE slug IN (
  'estrogen_receptor',
  'egfr','her2',
  'hedgehog','wnt_beta_catenin','notch','stat3',
  'ras','akt','cmyc','cyclin_d1','mir_34a'
);

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
  'integrins',
  'macropinocytosis','autophagy_nucleoside_salvage',
  'mmp2','mmp3','mmp9',
  'vegf','pdgf','tgfb','hif',
  'ros','glutathione','caspases','bcl2_bax','fas_receptor','caspase3'
);