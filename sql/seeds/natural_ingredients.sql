-- =========================
-- Natural Ingredients Seed (UPSERT)
-- =========================
-- NOTE:
-- - 운영/공유 DB에서 안전하게 반복 실행할 수 있도록 DELETE 없이 UPSERT로만 동작합니다.
-- - slug는 시스템 내 식별자이므로 변경하지 않는 것을 권장합니다.

INSERT INTO natural_ingredients (slug, display_name, synonyms) VALUES
-- Polyphenols / Flavonoids
('curcumin', '커큐민', ARRAY['turmeric', '강황추출물', '강황']),
('resveratrol', '레스베라트롤', ARRAY['trans-resveratrol', '트랜스레스베라트롤', '라스베라트롤', '포도껍질폴리페놀']),
('quercetin', '퀘르세틴', ARRAY['quercetin_dihydrate', '케르세틴']),
('luteolin', '루테올린', ARRAY['luteolin_flavonoid']),
('baicalein', '바이칼레인', ARRAY['scutellaria_baicalensis']),
('fisetin', '피세틴', ARRAY['fisetin_flavonoid']),
('genistein', '제니스테인', ARRAY['soy_isoflavone']),
('egcg', '에피갈로카테킨갈레이트', ARRAY['green_tea_extract', '녹차카테킨', '녹차']),
('grape_seed_extract', '포도씨추출물', ARRAY['proanthocyanidin']),
('bergamot_polyphenols', '베르가못폴리페놀', ARRAY['citrus_bergamot', '시트러스베르가못']),

-- Metabolic / Lipid related
('berberine', '베르베린', ARRAY['berberine_hcl', '버버린']),
('hca', '하이드록시시트르산', ARRAY['garcinia_cambogia', '가르시니아캄보지아', '하이드록시구연산']),
('flaxseed_lignans', '아마씨리그난', ARRAY['secoisolariciresinol']),
('betulinic_acid', '베툴린산', ARRAY['birch_bark_extract']),

-- Fatty acids & Oils
('omega_3', '오메가3지방산', ARRAY['dha', 'epa', 'fish_oil', '오메가3']),
('cod_liver_oil', '대구간유', ARRAY['vitamin_a_d']),
('coconut_oil', '코코넛오일', ARRAY['mct_oil']),

-- Vitamins & Minerals
('vitamin_c', '비타민C', ARRAY['ascorbic_acid']),
('vitamin_d3', '비타민D3', ARRAY['cholecalciferol']),
('vitamin_k2', '비타민K2', ARRAY['menaquinone']),
('magnesium', '마그네슘', ARRAY['magnesium_gluconate']),
('b_complex', '비타민B군', ARRAY['b_vitamins']),

-- Mushrooms / Polysaccharides
('ahcc', 'AHCC', ARRAY['active_hexose_correlated_compound']),
('reishi', '영지버섯', ARRAY['ganoderma_lucidum']),
('coriolus_versicolor', '운지버섯', ARRAY['turkey_tail']),
('hericium_erinaceus', '노루궁뎅이버섯', ARRAY['lion_mane']),
('mushroom_complex', '버섯복합체', ARRAY['medicinal_mushrooms', 'mushroom']),

-- Other bioactives
('milk_thistle', '밀크시슬', ARRAY['silymarin', '실리마린']),
('modified_citrus_pectin', '변형감귤펙틴', ARRAY['citrus_pectin']),
('boswellic_acids', '보스웰릭산', ARRAY['boswellia_serrata', 'akba', '보스웰리아']),
('artemisinin', '아르테미시닌', ARRAY['sweet_wormwood']),
('danshen', '단삼', ARRAY['salvia_miltiorrhiza']),
('sulforaphane', '설포라판', ARRAY['broccoli_sprout']),
('thymoquinone', '티모퀴논', ARRAY['black_seed']),
('probiotics', '프로바이오틱스', ARRAY['lactobacillus', 'bifidobacterium', '유익균', '유산균']),
('green_tea_extract', '녹차추출물', ARRAY['camellia_sinensis', '녹차']),

-- Off-label / Repurposed (의약품/실험 약물)
('metformin', '메트포르민', ARRAY['metformin_hcl', '글루코파지', 'glucophage', '메트포민', '다이아벡스', '글루파정', '메트포민정']),
('niclosamide', '니클로사마이드', ARRAY['niclosamide_ethanolamine', '니클로사미드']),
('doxycycline', '독시사이클린', ARRAY['doxycycline_hyclate', '독시', 'doxy']),
('chloroquine', '클로로퀸', ARRAY['chloroquine_phosphate']),
('hydroxychloroquine', '하이드록시클로로퀸', ARRAY['hydroxychloroquine_sulfate', '하이드록시 클로로퀸', 'hcq']),
('imipramine', '이미프라민', ARRAY['tofranil', '토프라닐']),
('dipyridamole', '디피리다몰', ARRAY['persantine', '퍼산틴']),
('l_asparaginase', 'L-ASP', ARRAY['l-asp', 'l_asparaginase', 'l-asparaginase', 'asparaginase']),
('bptes', 'BPTES', ARRAY['gls1_inhibitor', 'glutaminase_inhibitor', '비스(2-(5-페닐아세트아미도-1,2,4-티아디아졸-2-일)에틸)설파이드']),
('statin', '스타틴', ARRAY['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin']),
('2dg', '2-DG', ARRAY['2-deoxy-d-glucose', '2-deoxyglucose', '2-deoxy glucose', '2dg']),
('3bp', '3-BP', ARRAY['3-bromopyruvate', '3-bromopyruvic_acid', '3bp']),
('dca', 'DCA', ARRAY['dichloroacetate', 'dichloroacetic_acid', '디클로로아세트산', 'dca']),
('aspirin', '아스피린', ARRAY['acetylsalicylic_acid', 'asa', '아세틸살리실산'])
ON CONFLICT (slug) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  synonyms = EXCLUDED.synonyms;
