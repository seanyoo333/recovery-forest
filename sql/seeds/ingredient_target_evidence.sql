-- =========================
-- Ingredient Target Evidence 데이터 삽입
-- 
-- 성분 → 표적 매핑 근거 데이터
-- 레이더 차트 계산을 위한 핵심 데이터
-- 
-- 실행 순서:
-- 1. natural_targets.sql
-- 2. natural_ingredients.sql (이미 ingredient_target_evidence 삭제 포함)
-- 3. target_to_meta_axis.sql
-- 4. ingredient_target_evidence.sql (현재 파일)
-- =========================

-- 커큐민 (Curcumin) - 면역 균형, 비정상 신호조절
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '커큐민의 NF-κB 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'curcumin' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '커큐민의 COX 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'curcumin' AND nt.slug = 'cox'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '커큐민의 STAT3 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'curcumin' AND nt.slug = 'stat3'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.70,
  'animal',
  '커큐민의 EGFR 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'curcumin' AND nt.slug = 'egfr'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 베르베린 (Berberine) - 대사 안정화
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '베르베린의 AMPK 활성화 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'berberine' AND nt.slug = 'ampk'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '베르베린의 mTOR 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'berberine' AND nt.slug = 'mtor'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '베르베린의 인슐린 감수성 개선'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'berberine' AND nt.slug = 'insulin'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '베르베린의 GLUT1 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'berberine' AND nt.slug = 'glut1'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 레스베라트롤 (Resveratrol) - 대사 안정화, 면역 균형
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '레스베라트롤의 AMPK 활성화 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'resveratrol' AND nt.slug = 'ampk'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '레스베라트롤의 NF-κB 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'resveratrol' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.7,
  'animal',
  '레스베라트롤의 SIRT1 활성화 (대사 조절)'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'resveratrol' AND nt.slug = 'mtor'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 퀘르세틴 (Quercetin) - 면역 균형, 비정상 신호조절
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '퀘르세틴의 NF-κB 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'quercetin' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '퀘르세틴의 IL-6 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'quercetin' AND nt.slug = 'il6'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.70,
  'animal',
  '퀘르세틴의 STAT3 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'quercetin' AND nt.slug = 'stat3'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- EGCG (녹차 카테킨) - 대사 안정화, 면역 균형, 비정상 신호조절
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  'EGCG의 AMPK 활성화 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'egcg' AND nt.slug = 'ampk'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  'EGCG의 NF-κB 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'egcg' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.70,
  'animal',
  'EGCG의 EGFR 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'egcg' AND nt.slug = 'egfr'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.45,
  'cell',
  'EGCG의 AKT 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'egcg' AND nt.slug = 'akt'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 밀크시슬 (Milk Thistle) - 회복증진
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '실리마린의 항산화 효과 (Glutathione 증가)'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'milk_thistle' AND nt.slug = 'glutathione'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '실리마린의 ROS 감소 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'milk_thistle' AND nt.slug = 'ros'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 오메가3 - 면역 균형, 회복증진
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  1.0,
  'systematic_review',
  '오메가3의 염증 억제 효과 (COX/PGE2 축)'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'omega_3' AND nt.slug = 'cox'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '오메가3의 PGE2 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'omega_3' AND nt.slug = 'pge2'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '오메가3의 IL-6 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'omega_3' AND nt.slug = 'il6'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 비타민D3 - 면역 균형
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  1.0,
  'systematic_review',
  '비타민D3의 면역 조절 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'vitamin_d3' AND nt.slug = 'immune_balance'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 비타민D3는 직접적인 타겟이 없으므로 NF-κB를 통해 간접적으로 연결
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '비타민D3의 NF-κB 조절 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'vitamin_d3' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 설포라판 (Sulforaphane) - 대사 안정화, 회복증진
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '설포라판의 Nrf2 활성화 (항산화 경로)'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'sulforaphane' AND nt.slug = 'glutathione'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '설포라판의 ROS 감소 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'sulforaphane' AND nt.slug = 'ros'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

-- 보스웰릭산 (Boswellic Acids) - 면역 균형
INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.95,
  'rct',
  '보스웰릭산의 5-LOX 억제 (염증 경로)'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'boswellic_acids' AND nt.slug = 'nfkb'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

INSERT INTO ingredient_target_evidence (ingredient_id, target_id, strength, study_type, notes)
SELECT 
  ni.id,
  nt.id,
  0.85,
  'human_observational',
  '보스웰릭산의 COX 억제 효과'
FROM natural_ingredients ni, natural_targets nt
WHERE ni.slug = 'boswellic_acids' AND nt.slug = 'cox'
ON CONFLICT (ingredient_id, target_id, study_type) DO NOTHING;

