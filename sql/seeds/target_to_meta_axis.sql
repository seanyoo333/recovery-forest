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
-- 관리 대상 target 동의어(synonyms) 업데이트
-- =========================
WITH synonym_map(slug, synonyms) AS (
  VALUES
    ('hedgehog', ARRAY['Hedgehog pathway','Hedgehog signaling','HH pathway','헤지호그 신호']),
    ('wnt_beta_catenin', ARRAY['Wnt signaling','Wnt pathway','Wnt/β-catenin pathway','Wnt beta catenin']),
    ('notch', ARRAY['Notch pathway','Notch signaling','노치 신호']),
    ('stat3', ARRAY['STAT-3','Signal transducer and activator of transcription 3','STAT3 pathway']),
    ('nfkb', ARRAY['NF-kappaB','NFKB','nuclear factor kappa B','NF-kB']),
    ('ras', ARRAY['RAS pathway','KRAS','NRAS','HRAS']),
    ('akt', ARRAY['Protein kinase B','PKB','AKT pathway']),
    ('cmyc', ARRAY['c-Myc','MYC','MYC oncogene']),
    ('cyclin_d1', ARRAY['Cyclin D1','CCND1','G1 cyclin']),
    ('mir_34a', ARRAY['miR34a','microRNA-34a','miRNA-34a']),
    ('integrins', ARRAY['Integrin','cell adhesion receptor','인테그린']),
    ('estrogen_receptor', ARRAY['ER','ESR1','estrogen receptor alpha','에스트로겐 수용체']),
    ('egfr', ARRAY['ERBB1','epidermal growth factor receptor','상피성장인자수용체']),
    ('her2', ARRAY['ERBB2','HER-2','human epidermal growth factor receptor 2']),
    ('mmp2', ARRAY['matrix metalloproteinase 2','gelatinase A','MMP-2']),
    ('mmp3', ARRAY['matrix metalloproteinase 3','stromelysin-1','MMP-3']),
    ('mmp9', ARRAY['matrix metalloproteinase 9','gelatinase B','MMP-9']),
    ('vegf', ARRAY['vascular endothelial growth factor','VEGF-A','혈관내피성장인자']),
    ('pdgf', ARRAY['platelet-derived growth factor','혈소판유래성장인자']),
    ('hif', ARRAY['HIF-1','HIF1A','hypoxia inducible factor']),
    ('jak2', ARRAY['Janus kinase 2','JAK-2','JAK2 kinase']),
    ('pi3k', ARRAY['phosphoinositide 3-kinase','PI3 kinase','PI3K pathway']),
    ('beta_catenin', ARRAY['β-catenin','beta catenin','CTNNB1']),
    ('sonic_hedgehog', ARRAY['SHH','Sonic Hedgehog','sonic hedgehog pathway']),
    ('bfgf', ARRAY['basic fibroblast growth factor','FGF2','bFGF']),
    ('fgf', ARRAY['fibroblast growth factor','FGF family']),
    ('fgfr', ARRAY['fibroblast growth factor receptor','FGF receptor','FGFR family']),
    ('emt', ARRAY['epithelial mesenchymal transition','EMT program','상피간엽전이']),
    ('angiogenesis', ARRAY['tumor angiogenesis','vascular sprouting','혈관신생']),
    ('progesterone_receptor', ARRAY['PR','PGR','progesterone receptor']),
    ('androgen_receptor', ARRAY['AR','androgen receptor','NR3C4']),
    ('tlr4', ARRAY['Toll-like receptor 4','Toll like receptor 4','TLR-4']),
    ('tlr9', ARRAY['Toll-like receptor 9','Toll like receptor 9','TLR-9']),
    ('il1', ARRAY['IL-1','interleukin 1','interleukin-1']),
    ('il6', ARRAY['IL-6','interleukin 6','interleukin-6']),
    ('cox', ARRAY['cyclooxygenase','cyclo-oxygenase','COX enzyme']),
    ('pge2', ARRAY['prostaglandin E2','Prostaglandin E2','PGE-2']),
    ('tgfb', ARRAY['TGF-β','transforming growth factor beta','TGFB1']),
    ('il10', ARRAY['IL-10','interleukin 10','interleukin-10']),
    ('ido', ARRAY['indoleamine 2,3-dioxygenase','IDO enzyme','tryptophan catabolism']),
    ('ido1', ARRAY['IDO-1','indoleamine 2,3-dioxygenase 1','IDO1 enzyme']),
    ('ifng', ARRAY['IFN-γ','interferon gamma','IFNG']),
    ('il2', ARRAY['IL-2','interleukin 2','interleukin-2']),
    ('ccr5', ARRAY['C-C chemokine receptor 5','chemokine receptor CCR5','CCR-5']),
    ('pd1', ARRAY['PD-1','programmed cell death protein 1','PDCD1']),
    ('pdl1', ARRAY['PD-L1','programmed death-ligand 1','CD274']),
    ('ctla4', ARRAY['CTLA-4','cytotoxic T lymphocyte associated protein 4']),
    ('ox40', ARRAY['CD134','TNFRSF4','OX-40']),
    ('treg', ARRAY['regulatory T cell','Treg cells','조절 T세포']),
    ('mdsc', ARRAY['myeloid-derived suppressor cell','MDSCs','골수유래 억제세포']),
    ('tams', ARRAY['tumor-associated macrophage','TAM','종양연관 대식세포']),
    ('m2_macrophage', ARRAY['M2 macrophages','alternatively activated macrophage','M2 phenotype']),
    ('sting', ARRAY['STING pathway','TMEM173','stimulator of interferon genes']),
    ('nk_cells', ARRAY['natural killer cell','NK cell','자연살해세포']),
    ('th1', ARRAY['T helper 1','type 1 helper T cell','Th1 cells']),
    ('th2', ARRAY['T helper 2','type 2 helper T cell','Th2 cells']),
    ('microbiome', ARRAY['microbiota','microbial ecosystem','마이크로바이옴']),
    ('gut_microbiome', ARRAY['gut microbiota','intestinal microbiome','장내 미생물군']),
    ('acidic_tumor_microenvironment', ARRAY['acidic TME','tumor acidity','산성 종양 미세환경']),
    ('cox2', ARRAY['COX-2','PTGS2','cyclooxygenase-2']),
    ('arginase', ARRAY['Arginase 1','ARG1','arginine metabolism']),
    ('complement_c4_function', ARRAY['complement C4','C4 function','보체 C4 기능']),
    ('neutrophil_function', ARRAY['neutrophil activity','neutrophil response','호중구 기능']),
    ('insulin', ARRAY['INS','insulin signaling','인슐린']),
    ('igf1', ARRAY['IGF-1','insulin-like growth factor 1','somatomedin C']),
    ('glut1', ARRAY['SLC2A1','glucose transporter 1','GLUT-1']),
    ('aerobic_glycolysis', ARRAY['Warburg effect','aerobic glycolysis pathway','와버그 효과']),
    ('pppathway', ARRAY['PPP','pentose phosphate pathway','오탄당 인산 경로']),
    ('hexokinase2', ARRAY['HK2','hexokinase II','hexokinase-2']),
    ('oxphos', ARRAY['oxidative phosphorylation','OXPHOS pathway','산화적 인산화']),
    ('complex1', ARRAY['Complex I','mitochondrial complex I','NADH dehydrogenase complex I']),
    ('pdh', ARRAY['pyruvate dehydrogenase','PDH complex']),
    ('pdk', ARRAY['pyruvate dehydrogenase kinase','PDK isoforms']),
    ('ldha', ARRAY['lactate dehydrogenase A','LDH-A','LDHA enzyme']),
    ('lactate', ARRAY['lactic acid','lactate metabolism','젖산']),
    ('acetyl_coa', ARRAY['acetyl CoA','Ac-CoA','acetyl-coenzyme A']),
    ('mct1', ARRAY['SLC16A1','monocarboxylate transporter 1','MCT-1']),
    ('mct4', ARRAY['SLC16A3','monocarboxylate transporter 4','MCT-4']),
    ('g6pd', ARRAY['glucose-6-phosphate dehydrogenase','G6PD enzyme']),
    ('ampk', ARRAY['AMP-activated protein kinase','AMPK pathway','PRKAA']),
    ('srebp1', ARRAY['sterol regulatory element-binding protein 1','SREBF1','SREBP-1']),
    ('srebp2', ARRAY['sterol regulatory element-binding protein 2','SREBF2','SREBP-2']),
    ('acly', ARRAY['ATP citrate lyase','ACLY enzyme']),
    ('fas', ARRAY['fatty acid synthesis','de novo lipogenesis','지방산 합성']),
    ('fasn', ARRAY['fatty acid synthase','FASN enzyme']),
    ('mevalonate', ARRAY['mevalonate pathway','cholesterol biosynthesis pathway','메발론산 경로']),
    ('hmgcr', ARRAY['HMG-CoA reductase','3-hydroxy-3-methylglutaryl-CoA reductase']),
    ('fao', ARRAY['fatty acid oxidation','beta oxidation','지방산 산화']),
    ('cpt1', ARRAY['carnitine palmitoyltransferase 1','CPT1A','CPT-1']),
    ('ldlr', ARRAY['LDL receptor','low-density lipoprotein receptor']),
    ('acss2', ARRAY['acetyl-CoA synthetase 2','ACSS2 enzyme']),
    ('acetate-srebp-1', ARRAY['acetate-SREBP-1 axis','acetate lipogenesis axis']),
    ('mevalonate-srebp-2', ARRAY['mevalonate-SREBP-2 axis','cholesterol SREBP2 axis']),
    ('mtor', ARRAY['mTOR','mechanistic target of rapamycin','mammalian target of rapamycin']),
    ('glutaminolysis', ARRAY['glutamine metabolism','glutamine catabolism','글루타민 분해대사']),
    ('glutamine_transport', ARRAY['glutamine uptake','glutamine transporter','글루타민 수송']),
    ('glutaminase', ARRAY['glutaminase enzyme','GLS enzyme','glutamine deamidation']),
    ('gls', ARRAY['GLS1','glutaminase','kidney-type glutaminase']),
    ('asct2', ARRAY['SLC1A5','alanine serine cysteine transporter 2','ASCT-2']),
    ('gdh_kgdh', ARRAY['GDH/KGDH axis','glutamate dehydrogenase','alpha-ketoglutarate dehydrogenase']),
    ('autophagy_nucleoside_salvage', ARRAY['autophagy salvage','nucleoside salvage via autophagy']),
    ('macropinocytosis', ARRAY['macro-pinocytosis','bulk nutrient scavenging','macropinosome uptake']),
    ('nucleoside_salvage', ARRAY['salvage pathway','nucleoside salvage pathway','핵산 재활용 경로']),
    ('gln_oxphos', ARRAY['glutamine-driven OXPHOS','glutamine OXPHOS']),
    ('beta_adrenergic_receptor', ARRAY['β-adrenergic receptor','beta adrenergic receptor','ADRB family']),
    ('beta2_adrenergic_receptor', ARRAY['β2-adrenergic receptor','ADRB2','beta 2 adrenergic receptor']),
    ('epinephrine', ARRAY['adrenaline','epinephrin','에피네프린']),
    ('norepinephrine', ARRAY['noradrenaline','노르에피네프린']),
    ('cortisol', ARRAY['hydrocortisone','코르티솔']),
    ('glucocorticoid_receptor', ARRAY['GR','NR3C1','glucocorticoid receptor']),
    ('hpa_axis', ARRAY['HPA axis','hypothalamic pituitary adrenal axis','시상하부-뇌하수체-부신 축']),
    ('autonomic_nervous_system', ARRAY['ANS','autonomic nervous system','자율신경계']),
    ('sympathetic_tone', ARRAY['sympathetic activity','교감신경 긴장도','sympathetic drive']),
    ('parasympathetic_tone', ARRAY['vagal tone','parasympathetic activity','부교감신경 긴장도']),
    ('hrv', ARRAY['heart rate variability','심박변이도']),
    ('circadian_rhythm', ARRAY['circadian clock','biological clock','일주기 리듬']),
    ('melatonin', ARRAY['N-acetyl-5-methoxytryptamine','멜라토닌']),
    ('ros', ARRAY['reactive oxygen species','oxidative radicals','활성산소종']),
    ('glutathione', ARRAY['GSH','reduced glutathione','글루타티온']),
    ('caspases', ARRAY['caspase family','caspase cascade','카스파제 군']),
    ('bcl2_bax', ARRAY['BCL2/BAX ratio','BCL-2 Bax axis','apoptosis rheostat']),
    ('fas_receptor', ARRAY['CD95','Fas receptor','death receptor']),
    ('caspase3', ARRAY['CASP3','caspase-3','executioner caspase']),
    ('dnmt', ARRAY['DNA methyltransferase','DNMT family']),
    ('dnmt1', ARRAY['DNA methyltransferase 1','maintenance methyltransferase']),
    ('dnmt3a', ARRAY['DNA methyltransferase 3A','DNMT3A enzyme']),
    ('dnmt3b', ARRAY['DNA methyltransferase 3B','DNMT3B enzyme']),
    ('tet', ARRAY['TET enzyme','ten-eleven translocation','DNA demethylation enzyme']),
    ('hdac', ARRAY['histone deacetylase','HDAC family']),
    ('hats', ARRAY['HAT','histone acetyltransferase','histone acetyltransferases']),
    ('histone_acetylation', ARRAY['histone acetylation mark','chromatin acetylation']),
    ('dna_methylation', ARRAY['DNA methylation mark','CpG methylation']),
    ('mitochondria', ARRAY['mitochondrion','mitochondrial network','미토콘드리아']),
    ('mitochondrial_function', ARRAY['mitochondrial activity','mitochondrial health','mitochondrial fitness']),
    ('redox', ARRAY['redox balance','oxidation reduction balance','산화환원 균형']),
    ('nrf2', ARRAY['NFE2L2','NRF-2','antioxidant response regulator']),
    ('thioredoxin', ARRAY['TXN','thioredoxin system']),
    ('gpx', ARRAY['glutathione peroxidase','GPx','GPX family']),
    ('catalase', ARRAY['CAT','catalase enzyme']),
    ('sod', ARRAY['superoxide dismutase','SOD enzyme']),
    ('nadph', ARRAY['nicotinamide adenine dinucleotide phosphate','reduced NADP']),
    ('oxidative_stress', ARRAY['oxidant stress','ROS stress','산화 스트레스']),
    ('cytochrome_c', ARRAY['cytochrome c release','CYCS','미토콘드리아 시토크롬 c']),
    ('bax', ARRAY['BAX protein','Bcl-2-associated X protein']),
    ('bad', ARRAY['BAD protein','BCL2 antagonist of cell death']),
    ('bak', ARRAY['BAK protein','BCL2 antagonist killer']),
    ('bclxl', ARRAY['BCL-XL','BCL2L1','anti-apoptotic BCL-XL']),
    ('apoptosis', ARRAY['programmed cell death','apoptotic cell death','세포자멸사']),
    ('caspase8', ARRAY['CASP8','caspase-8','extrinsic initiator caspase']),
    ('caspase9', ARRAY['CASP9','caspase-9','intrinsic initiator caspase']),
    ('p53', ARRAY['TP53','tumor protein p53','guardian of the genome']),
    ('ascorbate_recycling', ARRAY['vitamin C recycling','ascorbate regeneration','비타민 C 재생'])
)
UPDATE natural_targets nt
SET synonyms = synonym_map.synonyms
FROM synonym_map
WHERE nt.slug = synonym_map.slug;

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