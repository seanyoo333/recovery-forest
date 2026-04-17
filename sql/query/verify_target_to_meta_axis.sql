-- verify_target_to_meta_axis.sql
--
-- 목적:
-- - seed(`sql/seeds/natural_targets.sql`, `sql/seeds/target_to_meta_axis.sql`) 기준으로
--   누락/중복/오분류(잘못된 축 매핑) 여부를 빠르게 검증합니다.
--
-- 사용:
-- - Supabase SQL Editor 또는 psql에서 그대로 실행
--
-- 기준:
-- - 각 표적(slug)은 meta_axis 1개에만 연결되어야 합니다.

WITH expected AS (
  SELECT * FROM (VALUES
    -- abnormal_signals
    ('hedgehog', 'abnormal_signals'),
    ('wnt_beta_catenin', 'abnormal_signals'),
    ('notch', 'abnormal_signals'),
    ('stat3', 'abnormal_signals'),
    ('nfkb', 'abnormal_signals'),
    ('ras', 'abnormal_signals'),
    ('akt', 'abnormal_signals'),
    ('cmyc', 'abnormal_signals'),
    ('cyclin_d1', 'abnormal_signals'),
    ('mir_34a', 'abnormal_signals'),
    ('integrins', 'abnormal_signals'),
    ('estrogen_receptor', 'abnormal_signals'),
    ('egfr', 'abnormal_signals'),
    ('her2', 'abnormal_signals'),
    ('mmp2', 'abnormal_signals'),
    ('mmp3', 'abnormal_signals'),
    ('mmp9', 'abnormal_signals'),
    ('vegf', 'abnormal_signals'),
    ('pdgf', 'abnormal_signals'),
    ('hif', 'abnormal_signals'),
    ('jak2', 'abnormal_signals'),
    ('pi3k', 'abnormal_signals'),
    ('beta_catenin', 'abnormal_signals'),
    ('sonic_hedgehog', 'abnormal_signals'),
    ('bfgf', 'abnormal_signals'),
    ('fgf', 'abnormal_signals'),
    ('fgfr', 'abnormal_signals'),
    ('emt', 'abnormal_signals'),
    ('angiogenesis', 'abnormal_signals'),
    ('progesterone_receptor', 'abnormal_signals'),
    ('androgen_receptor', 'abnormal_signals'),

    -- immune_balance
    ('tlr4', 'immune_balance'),
    ('tlr9', 'immune_balance'),
    ('il1', 'immune_balance'),
    ('il6', 'immune_balance'),
    ('cox', 'immune_balance'),
    ('pge2', 'immune_balance'),
    ('tgfb', 'immune_balance'),
    ('il10', 'immune_balance'),
    ('ido', 'immune_balance'),
    ('ido1', 'immune_balance'),
    ('ifng', 'immune_balance'),
    ('il2', 'immune_balance'),
    ('ccr5', 'immune_balance'),
    ('pd1', 'immune_balance'),
    ('pdl1', 'immune_balance'),
    ('ctla4', 'immune_balance'),
    ('ox40', 'immune_balance'),
    ('treg', 'immune_balance'),
    ('mdsc', 'immune_balance'),
    ('tams', 'immune_balance'),
    ('m2_macrophage', 'immune_balance'),
    ('sting', 'immune_balance'),
    ('nk_cells', 'immune_balance'),
    ('th1', 'immune_balance'),
    ('th2', 'immune_balance'),
    ('microbiome', 'immune_balance'),
    ('gut_microbiome', 'immune_balance'),
    ('acidic_tumor_microenvironment', 'immune_balance'),
    ('cox2', 'immune_balance'),
    ('arginase', 'immune_balance'),
    ('complement_c4_function', 'immune_balance'),
    ('neutrophil_function', 'immune_balance'),

    -- metabolic_stability
    ('insulin', 'metabolic_stability'),
    ('igf1', 'metabolic_stability'),
    ('glut1', 'metabolic_stability'),
    ('aerobic_glycolysis', 'metabolic_stability'),
    ('pppathway', 'metabolic_stability'),
    ('hexokinase2', 'metabolic_stability'),
    ('oxphos', 'metabolic_stability'),
    ('complex1', 'metabolic_stability'),
    ('pdh', 'metabolic_stability'),
    ('pdk', 'metabolic_stability'),
    ('ampk', 'metabolic_stability'),
    ('ldha', 'metabolic_stability'),
    ('lactate', 'metabolic_stability'),
    ('acetyl_coa', 'metabolic_stability'),
    ('mct1', 'metabolic_stability'),
    ('mct4', 'metabolic_stability'),
    ('g6pd', 'metabolic_stability'),
    ('mtor', 'metabolic_stability'),
    ('glutaminolysis', 'metabolic_stability'),
    ('glutamine_transport', 'metabolic_stability'),
    ('glutaminase', 'metabolic_stability'),
    ('gls', 'metabolic_stability'),
    ('asct2', 'metabolic_stability'),
    ('gdh_kgdh', 'metabolic_stability'),
    ('autophagy_nucleoside_salvage', 'metabolic_stability'),
    ('macropinocytosis', 'metabolic_stability'),
    ('nucleoside_salvage', 'metabolic_stability'),
    ('gln_oxphos', 'metabolic_stability'),
    ('srebp1', 'metabolic_stability'),
    ('srebp2', 'metabolic_stability'),
    ('acly', 'metabolic_stability'),
    ('fas', 'metabolic_stability'),
    ('fasn', 'metabolic_stability'),
    ('mevalonate', 'metabolic_stability'),
    ('hmgcr', 'metabolic_stability'),
    ('fao', 'metabolic_stability'),
    ('cpt1', 'metabolic_stability'),
    ('ldlr', 'metabolic_stability'),
    ('acss2', 'metabolic_stability'),
    ('acetate-srebp-1', 'metabolic_stability'),
    ('mevalonate-srebp-2', 'metabolic_stability'),

    -- neuro_stress
    ('beta_adrenergic_receptor', 'neuro_stress'),
    ('beta2_adrenergic_receptor', 'neuro_stress'),
    ('epinephrine', 'neuro_stress'),
    ('norepinephrine', 'neuro_stress'),
    ('cortisol', 'neuro_stress'),
    ('glucocorticoid_receptor', 'neuro_stress'),
    ('hpa_axis', 'neuro_stress'),
    ('autonomic_nervous_system', 'neuro_stress'),
    ('sympathetic_tone', 'neuro_stress'),
    ('parasympathetic_tone', 'neuro_stress'),
    ('hrv', 'neuro_stress'),
    ('circadian_rhythm', 'neuro_stress'),
    ('melatonin', 'neuro_stress'),

    -- recovery
    ('ros', 'recovery'),
    ('glutathione', 'recovery'),
    ('caspases', 'recovery'),
    ('bcl2_bax', 'recovery'),
    ('fas_receptor', 'recovery'),
    ('caspase3', 'recovery'),
    ('dnmt', 'recovery'),
    ('dnmt1', 'recovery'),
    ('dnmt3a', 'recovery'),
    ('dnmt3b', 'recovery'),
    ('tet', 'recovery'),
    ('hdac', 'recovery'),
    ('hats', 'recovery'),
    ('histone_acetylation', 'recovery'),
    ('dna_methylation', 'recovery'),
    ('mitochondria', 'recovery'),
    ('mitochondrial_function', 'recovery'),
    ('redox', 'recovery'),
    ('nrf2', 'recovery'),
    ('thioredoxin', 'recovery'),
    ('gpx', 'recovery'),
    ('catalase', 'recovery'),
    ('sod', 'recovery'),
    ('nadph', 'recovery'),
    ('oxidative_stress', 'recovery'),
    ('cytochrome_c', 'recovery'),
    ('bax', 'recovery'),
    ('bad', 'recovery'),
    ('bak', 'recovery'),
    ('bclxl', 'recovery'),
    ('apoptosis', 'recovery'),
    ('caspase8', 'recovery'),
    ('caspase9', 'recovery'),
    ('p53', 'recovery'),
    ('ascorbate_recycling', 'recovery')
  ) AS v(slug, expected_axis)
),
targets AS (
  SELECT nt.id, nt.slug
  FROM natural_targets nt
),
all_mappings AS (
  SELECT
    nt.slug,
    COUNT(tma.meta_axis) AS mapping_rows,
    COUNT(DISTINCT tma.meta_axis) AS distinct_axes,
    STRING_AGG(DISTINCT tma.meta_axis, ', ' ORDER BY tma.meta_axis) AS axes
  FROM natural_targets nt
  LEFT JOIN target_to_meta_axis tma ON tma.target_id = nt.id
  GROUP BY nt.slug
),
expected_targets AS (
  SELECT e.slug, e.expected_axis, t.id AS target_id
  FROM expected e
  LEFT JOIN targets t ON t.slug = e.slug
),
axis_rows AS (
  SELECT
    et.slug,
    et.expected_axis,
    et.target_id,
    tma.meta_axis
  FROM expected_targets et
  LEFT JOIN target_to_meta_axis tma ON tma.target_id = et.target_id
)

-- 출력은 단일 result set 입니다.
SELECT *
FROM (
  -- 1) 기대 슬러그가 natural_targets에 없는 경우
  SELECT
    'missing_target_row'::text AS issue_type,
    slug,
    expected_axis,
    NULL::text AS meta_axis
  FROM expected_targets
  WHERE target_id IS NULL

  UNION ALL

  -- 2) 기대 슬러그가 target_to_meta_axis에 매핑이 없는 경우
  SELECT
    'missing_axis_mapping'::text AS issue_type,
    slug,
    expected_axis,
    NULL::text AS meta_axis
  FROM axis_rows
  WHERE target_id IS NOT NULL
  GROUP BY slug, expected_axis, target_id
  HAVING COUNT(meta_axis) = 0

  UNION ALL

  -- 3) 기대 슬러그가 2개 이상 축에 매핑된 경우(규칙 위반)
  SELECT
    'multiple_axis_mappings'::text AS issue_type,
    slug,
    expected_axis,
    STRING_AGG(DISTINCT meta_axis, ', ' ORDER BY meta_axis) AS meta_axis
  FROM axis_rows
  WHERE meta_axis IS NOT NULL
  GROUP BY slug, expected_axis
  HAVING COUNT(DISTINCT meta_axis) > 1

  UNION ALL

  -- 4) 기대 축과 다른 축으로 매핑된 경우(오분류)
  SELECT
    'wrong_axis_mapping'::text AS issue_type,
    slug,
    expected_axis,
    meta_axis
  FROM axis_rows
  WHERE meta_axis IS NOT NULL
    AND meta_axis <> expected_axis

  UNION ALL

  -- 5) expected 목록에 없는 표적이 매핑에 들어가 있는 경우(관리 범위 밖)
  SELECT
    'unexpected_mapped_target'::text AS issue_type,
    nt.slug,
    NULL::text AS expected_axis,
    tma.meta_axis
  FROM target_to_meta_axis tma
  JOIN natural_targets nt ON nt.id = tma.target_id
  LEFT JOIN expected e ON e.slug = nt.slug
  WHERE e.slug IS NULL

  UNION ALL

  -- 6) (전체) 매핑이 0개인 표적(누락)
  SELECT
    'unmapped_target_any'::text AS issue_type,
    slug,
    NULL::text AS expected_axis,
    NULL::text AS meta_axis
  FROM all_mappings
  WHERE mapping_rows = 0

  UNION ALL

  -- 7) (전체) 2개 이상 축으로 매핑된 표적(중복)
  SELECT
    'multiple_axis_any'::text AS issue_type,
    slug,
    NULL::text AS expected_axis,
    axes AS meta_axis
  FROM all_mappings
  WHERE distinct_axes > 1
) issues
ORDER BY issue_type, slug, meta_axis;

