-- =========================
-- 기존 데이터 삭제 (새로운 구조로 재구성)
-- =========================
-- 외래키 제약으로 인해 먼저 관련 테이블 삭제
DELETE FROM ingredient_target_evidence_sources;
DELETE FROM ingredient_target_evidence;
DELETE FROM natural_ingredients;

-- =========================
-- Natural Ingredients 데이터 삽입
-- =========================
-- Polyphenols / Flavonoids
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('curcumin', '커큐민', ARRAY['turmeric', '강황추출물', '강황']),
('resveratrol', '레스베라트롤', ARRAY['trans-resveratrol', '트랜스레스베라트롤', '라스베라트롤', '포도껍질폴리페놀']),
('quercetin', '퀘르세틴', ARRAY['quercetin_dihydrate', '케르세틴']),
('luteolin', '루테올린', ARRAY['luteolin_flavonoid']),
('baicalein', '바이칼레인', ARRAY['scutellaria_baicalensis']),
('fisetin', '피세틴', ARRAY['fisetin_flavonoid']),
('genistein', '제니스테인', ARRAY['soy_isoflavone']),
('egcg', '에피갈로카테킨갈레이트', ARRAY['green_tea_extract', '녹차카테킨', '녹차']),
('grape_seed_extract', '포도씨추출물', ARRAY['proanthocyanidin']),
('bergamot_polyphenols', '베르가못폴리페놀', ARRAY['citrus_bergamot', '시트러스베르가못']);

-- Metabolic / Lipid related
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('berberine', '베르베린', ARRAY['berberine_hcl', '버버린']),
('hca', '하이드록시시트르산', ARRAY['garcinia_cambogia', '가르시니아캄보지아', '하이드록시구연산']),
('flaxseed_lignans', '아마씨리그난', ARRAY['secoisolariciresinol']),
('betulinic_acid', '베툴린산', ARRAY['birch_bark_extract']);

-- Fatty acids & Oils
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('omega_3', '오메가3지방산', ARRAY['dha', 'epa', 'fish_oil', '오메가3']),
('cod_liver_oil', '대구간유', ARRAY['vitamin_a_d']),
('coconut_oil', '코코넛오일', ARRAY['mct_oil']);

-- Vitamins & Minerals
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('vitamin_c', '비타민C', ARRAY['ascorbic_acid']),
('vitamin_d3', '비타민D3', ARRAY['cholecalciferol']),
('vitamin_k2', '비타민K2', ARRAY['menaquinone']),
('magnesium', '마그네슘', ARRAY['magnesium_gluconate']),
('b_complex', '비타민B군', ARRAY['b_vitamins']);

-- Mushrooms / Polysaccharides
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('ahcc', 'AHCC', ARRAY['active_hexose_correlated_compound']),
('reishi', '영지버섯', ARRAY['ganoderma_lucidum']),
('coriolus_versicolor', '운지버섯', ARRAY['turkey_tail']),
('hericium_erinaceus', '노루궁뎅이버섯', ARRAY['lion_mane']),
('mushroom_complex', '버섯복합체', ARRAY['medicinal_mushrooms', 'mushroom']);

-- Other bioactives
INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
('milk_thistle', '밀크시슬', ARRAY['silymarin', '실리마린']),
('modified_citrus_pectin', '변형감귤펙틴', ARRAY['citrus_pectin']),
('boswellic_acids', '보스웰릭산', ARRAY['boswellia_serrata', 'akba', '보스웰리아']),
('artemisinin', '아르테미시닌', ARRAY['sweet_wormwood']),
('danshen', '단삼', ARRAY['salvia_miltiorrhiza']),
('sulforaphane', '설포라판', ARRAY['broccoli_sprout']),
('thymoquinone', '티모퀴논', ARRAY['black_seed']),
('probiotics', '프로바이오틱스', ARRAY['lactobacillus', 'bifidobacterium', '유익균', '유산균']),
('green_tea_extract', '녹차추출물', ARRAY['camellia_sinensis', '녹차']);