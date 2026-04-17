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
    'hedgehog','wnt_beta_catenin','notch','stat3','nfkb','ras','akt','cmyc','cyclin_d1','mir_34a',
    'integrins','estrogen_receptor','egfr','her2',
    'mmp2','mmp3','mmp9','vegf','pdgf','hif',
    'jak2','pi3k','beta_catenin','sonic_hedgehog',
    'bfgf','fgf','fgfr','emt','angiogenesis',
    'progesterone_receptor','androgen_receptor',

    -- immune_balance
    'tlr4','tlr9','il1','il6','cox','pge2','tgfb',
    'il10','ido','ido1','ifng','il2','ccr5',
    'pd1','pdl1','ctla4','ox40',
    'treg','mdsc','tams','m2_macrophage',
    'sting','nk_cells','th1','th2',
    'microbiome','gut_microbiome','acidic_tumor_microenvironment',
    'cox2','arginase',
    'complement_c4_function','neutrophil_function',

    -- metabolic_stability
    'insulin','igf1','glut1','aerobic_glycolysis','pppathway','hexokinase2',
    'oxphos','complex1','pdh','pdk','ldha','lactate','acetyl_coa','mct1','mct4','g6pd',
    'ampk','srebp1','srebp2','acly','fas','fasn','mevalonate','hmgcr','fao','cpt1','ldlr','acss2','acetate-srebp-1','mevalonate-srebp-2',
    'mtor','glutaminolysis','glutamine_transport','glutaminase','gls','asct2','gdh_kgdh',
    'autophagy_nucleoside_salvage','macropinocytosis','nucleoside_salvage','gln_oxphos',

    -- neuro_stress
    'beta_adrenergic_receptor','beta2_adrenergic_receptor',
    'epinephrine','norepinephrine','cortisol','glucocorticoid_receptor',
    'hpa_axis','autonomic_nervous_system',
    'sympathetic_tone','parasympathetic_tone',
    'hrv','circadian_rhythm','melatonin',

    -- recovery
    'ros','glutathione','caspases','bcl2_bax','fas_receptor','caspase3',
    'dnmt','dnmt1','dnmt3a','dnmt3b','tet',
    'hdac','hats','histone_acetylation','dna_methylation',
    'mitochondria','mitochondrial_function','redox','nrf2','thioredoxin',
    'gpx','catalase','sod','nadph','oxidative_stress',
    'cytochrome_c','bax','bad','bak','bclxl',
    'apoptosis','caspase8','caspase9','p53',
    'ascorbate_recycling',

    -- legacy duplicate slugs cleanup (재시드 시 매핑 제거)
    'reactive_oxygen_species','ros_reduction','t_cell_function','th1_cytokines'
  )
)
DELETE FROM target_to_meta_axis
WHERE target_id IN (SELECT id FROM managed_targets);

-- =========================
-- 대사 안정화 (metabolic_stability)
-- =========================
INSERT INTO target_to_meta_axis (target_id, target_slug, meta_axis, axis_weight)
SELECT id, slug, 'metabolic_stability', 1.0 FROM natural_targets
WHERE slug IN (
  'insulin','igf1',
  'glut1','aerobic_glycolysis','pppathway','hexokinase2',
  'oxphos','complex1','pdh','pdk','ldha','lactate','acetyl_coa','mct1','mct4','g6pd',
  'ampk','mtor',
  'glutaminolysis','glutamine_transport','glutaminase','gls','asct2','gdh_kgdh',
  'autophagy_nucleoside_salvage','macropinocytosis','nucleoside_salvage','gln_oxphos',
  'srebp1','srebp2','acly','fas','fasn','mevalonate','hmgcr','fao','cpt1','ldlr','acss2','acetate-srebp-1','mevalonate-srebp-2'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight, target_slug = EXCLUDED.target_slug;

-- =========================
-- 면역 균형 (immune_balance)
-- =========================
INSERT INTO target_to_meta_axis (target_id, target_slug, meta_axis, axis_weight)
SELECT id, slug, 'immune_balance', 1.0 FROM natural_targets
WHERE slug IN (
  'il1','il6','cox','pge2','tgfb',
  'tlr4','tlr9',
  'il10','ido','ido1','ifng','il2','ccr5',
  'pd1','pdl1','ctla4','ox40',
  'treg','mdsc','tams','m2_macrophage',
  'sting','nk_cells','th1','th2',
  'microbiome','gut_microbiome','acidic_tumor_microenvironment',
  'cox2','arginase',
  'complement_c4_function','neutrophil_function'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight, target_slug = EXCLUDED.target_slug;

-- =========================
-- 비정상 신호조절 (abnormal_signals)
-- =========================
INSERT INTO target_to_meta_axis (target_id, target_slug, meta_axis, axis_weight)
SELECT id, slug, 'abnormal_signals', 1.0 FROM natural_targets
WHERE slug IN (
  'integrins',
  'estrogen_receptor',
  'egfr','her2',
  'hedgehog','wnt_beta_catenin','notch','stat3','nfkb',
  'ras','akt','cmyc','cyclin_d1','mir_34a',
  'mmp2','mmp3','mmp9',
  'vegf','pdgf','hif',
  'jak2','pi3k','beta_catenin','sonic_hedgehog',
  'bfgf','fgf','fgfr','emt','angiogenesis',
  'progesterone_receptor','androgen_receptor'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight, target_slug = EXCLUDED.target_slug;

-- =========================
-- 신경·스트레스 (neuro_stress)
-- =========================
INSERT INTO target_to_meta_axis (target_id, target_slug, meta_axis, axis_weight)
SELECT id, slug, 'neuro_stress', 1.0 FROM natural_targets
WHERE slug IN (
  'beta_adrenergic_receptor','beta2_adrenergic_receptor',
  'epinephrine','norepinephrine','cortisol','glucocorticoid_receptor',
  'hpa_axis','autonomic_nervous_system',
  'sympathetic_tone','parasympathetic_tone',
  'hrv','circadian_rhythm','melatonin'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight, target_slug = EXCLUDED.target_slug;

-- =========================
-- 회복증진 (recovery)
-- =========================
INSERT INTO target_to_meta_axis (target_id, target_slug, meta_axis, axis_weight)
SELECT id, slug, 'recovery', 1.0 FROM natural_targets
WHERE slug IN (
  'ros','glutathione','caspases','bcl2_bax','fas_receptor','caspase3',
  'dnmt','dnmt1','dnmt3a','dnmt3b','tet',
  'hdac','hats','histone_acetylation','dna_methylation',
  'mitochondria','mitochondrial_function','redox','nrf2','thioredoxin',
  'gpx','catalase','sod','nadph','oxidative_stress',
  'cytochrome_c','bax','bad','bak','bclxl',
  'apoptosis','caspase8','caspase9','p53',
  'ascorbate_recycling'
)
ON CONFLICT (target_id, meta_axis) DO UPDATE
SET axis_weight = EXCLUDED.axis_weight, target_slug = EXCLUDED.target_slug;