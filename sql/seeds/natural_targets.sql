-- =========================
-- Natural Targets Seed (UPSERT)
-- =========================
-- NOTE:
-- - 운영/공유 DB에서 안전하게 반복 실행할 수 있도록 DELETE 없이 UPSERT로만 동작합니다.
-- - slug는 시스템 내 식별자이므로 변경하지 않는 것을 권장합니다.

INSERT INTO natural_targets (slug, display_name, description)
VALUES
  -- 비정상 신호조절 (abnormal_signals) - 비정상 세포 신호/경로
  ('hedgehog', 'Hedgehog signaling', '여러 암에서 보고되는 비정상 신호 경로로 언급됨'),
  ('wnt_beta_catenin', 'Wnt/β-catenin', '암 관련 비정상 신호 경로로 언급됨'),
  ('notch', 'Notch signaling', '일부 암과 연관된 신호 경로로 언급됨'),
  ('stat3', 'STAT3', '염증성 사이토카인/ TLR 자극에 의해 활성화될 수 있는 전사인자로 언급됨'),
  ('nfkb', 'NF-κB', '니클로사마이드가 타겟한다고 언급된 신호/전사인자'),
  ('ampk', 'AMPK', 'mTOR를 낮추는 방향의 대사 조절 효소로 언급됨'),
  ('ras', 'RAS', '일부 암에서 의존성이 있으며 macropinocytosis와 연관된 유전자 계열로 언급됨'),
  ('akt', 'AKT', 'STAT3 신호 이후 과발현 예시로 언급됨'),
  ('cmyc', 'c-Myc', 'Wnt/Notch 관련 및 대사/공격성 연관 유전자로 언급됨'),
  ('cyclin_d1', 'Cyclin D1', 'Wnt/β-catenin 경로 영향 하에 과발현될 수 있는 단백질로 언급됨'),
  ('mir_34a', 'miR-34a', 'Wnt/β-catenin 신호를 컨트롤하는 후생적 마이크로RNA로 언급됨'),

  -- 비정상 신호조절 (abnormal_signals) - 수용체/표면 분자
  ('integrins', 'Integrins', '세포 부착 관련 표면 분자로 전이/혈류 이동과 연관 가능하다고 언급됨'),
  ('estrogen_receptor', 'Estrogen receptor (ER)', '유방암/난소암/자궁내막암 등에서 상향조절 가능 수용체로 언급됨'),
  ('egfr', 'EGFR', '상피성장인자수용체로 천연물(예: EGCG/커큐민/버버린)과 연관 언급됨'),
  ('her2', 'HER2', 'EGFR 계열로 chloroquine 관련 내성 맥락에서 언급됨'),


  -- 면역 균형 (immune_balance) - 선천면역/염증 축
  ('tlr4', 'TLR4', '암에서 활성화되어 있을 수 있는 Toll-like receptor로 언급됨'),
  ('tlr9', 'TLR9', '종양발생 바이러스/진행암과 연관 가능 표적으로 언급됨'),
  ('il1', 'Interleukin-1 (IL-1)', '염증성 사이토카인으로 COX/PGE2 축과 연관되어 언급됨'),
  ('il6', 'Interleukin-6 (IL-6)', '지속적 노출이 암 관련 신호를 촉발할 수 있는 염증성 사이토카인으로 언급됨'),
  ('cox', 'COX (Cyclo-oxygenase)', '염증성 사이토카인에 의해 관련되며 NSAID로 중화 가능하다고 언급됨'),
  ('pge2', 'PGE2', '염증성 프로스타글란딘으로 면역억제/염증 축에서 언급됨'),


  -- 대사 안정화 (metabolic_pressure) - 포도당/해당 및 관련 대사
  ('insulin', 'Insulin', '대사/성장 신호에서 중요한 호르몬으로 언급됨'),
  ('glut1', 'GLUT1', '암세포에서 포도당 흡수 증가와 관련된 수송체로 언급됨'),
  ('aerobic_glycolysis', 'Aerobic glycolysis', '와버그 효과 관련 포도당 대사 경로로 언급됨'),
  ('pppathway', 'Pentose phosphate pathway (PPP)', '오탄당 인산 경로로 언급됨'),
  ('hexokinase2', 'Hexokinase 2 (HK2)', '메트포민이 억제 가능하다고 언급된 해당계 효소'),
  ('oxphos', 'Oxidative phosphorylation (OXPHOS)', '산화적 인산화 경로로 언급됨'),
  ('complex1', 'Mitochondrial Complex I', '메트포민이 기능을 억제한다고 언급됨'),
  ('pdh', 'Pyruvate dehydrogenase (PDH)', 'DCA가 활성화한다고 언급된 미토콘드리아 포도당 산화 관련 효소'),
  ('pdk', 'Pyruvate dehydrogenase kinase (PDK)', 'DCA가 억제한다고 언급된 PDH 조절 효소'),

  -- 대사 안정화 (metabolic_pressure) - 지질/콜레스테롤/지방산 축
  ('srebp1', 'SREBP-1', '지방산 합성 조절 축으로 언급됨'),
  ('srebp2', 'SREBP-2', '콜레스테롤/메발론산 경로 조절 축으로 언급됨'),
  ('acly', 'ACLY', 'ATP 시트르산 분해효소로 지방 대사 축에서 언급됨'),
  ('fas', 'FAS (Fatty acid synthesis)', '지방산 합성 경로로 언급됨'),
  ('mevalonate', 'Mevalonate pathway', '콜레스테롤 합성/막 생성 관련 경로로 언급됨'),
  ('fao', 'Fatty acid oxidation (FAO)', '일부 내성/줄기세포 관련 암에서 항진될 수 있는 경로로 언급됨'),
  ('ldlr', 'LDL receptor (LDLR)', '암이 LDL 획득을 위해 수용체를 늘린다고 언급됨'),
  ('acetate-srebp-1', 'Acetate-SREBP-1', '지방산 합성 조절 축으로 언급됨'),
  ('mevalonate-srebp-2', 'Mevalonate-SREBP-2', '콜레스테롤/메발론산 경로 조절 축으로 언급됨'),


  -- 대사 안정화 (metabolic_pressure) - 아미노산/자가포식/핵산 재활용
  ('igf1', 'IGF-1', '인슐린 유사 성장인자로 차단이 중요하다고 언급됨'),
  ('mtor', 'mTOR', 'AMPK와 연관된 주요 대사 조절 축으로 언급됨'),
  ('glutaminolysis', 'Glutaminolysis', '공격적 암/전이암에서 활성화될 수 있는 글루타민 대사로 언급됨'),
  ('glutamine_transport', 'Glutamine transport', '글루타민 흡수(수송) 축이 표적이 될 수 있다고 언급됨'),
  ('glutaminase', 'Glutaminase', '글루타민 분해 관련 효소 억제 축(억제제)로 언급됨'),
  ('gdh_kgdh', 'GDH/KGDH', 'Glutamate dehydrogenase / Ketoglutarate dehydrogenase 축으로 언급됨'),
  ('autophagy_nucleoside_salvage', 'Nucleoside salvage (autophagy)', '핵산 분해물질 재사용/자가포식 맥락의 표적으로 언급됨'),
  ('macropinocytosis', 'Macropinocytosis', '영양부족 환경에서 세포외 단백질/지방 흡수 경로로 언급됨'),
  ('nucleoside_salvage', 'Nucleoside salvage', '핵산 분해물질 재사용/자가포식 맥락의 표적으로 언급됨'),
  ('gln_oxphos', 'Gln OXPHOS', '글루타민 대사 경로로 언급됨'),

  -- 회복증진 (recovery) - 전이/미세환경/혈관신생
  ('mmp2', 'MMP-2', '세포외기질 분해 관련 MMP로 언급됨'),
  ('mmp3', 'MMP-3', '세포외기질 분해 관련 MMP로 언급됨'),
  ('mmp9', 'MMP-9', '세포외기질 분해 관련 MMP로 언급됨'),
  ('vegf', 'VEGF', '혈관신생 관련 성장인자로 언급됨'),
  ('pdgf', 'PDGF', '성장인자(미세환경) 축으로 언급됨'),
  ('tgfb', 'TGF-β', '성장인자/미세환경 축으로 언급됨'),
  ('hif', 'HIF (Hypoxia-inducible factor)', '저산소에서 활성화되어 VEGF 증가에 관여한다고 언급됨'),

  -- 회복증진 (recovery) - 산화 스트레스/세포사멸 축
  ('ros', 'ROS', '활성산소종으로 세포사멸 민감도 조절 축에서 언급됨'),
  ('glutathione', 'Glutathione (GSH)', '항산화 상태/세포사멸 민감도에 관여하는 축으로 언급됨'),
  ('caspases', 'Caspases', '프로그램된 세포사멸(아포토시스)에서 핵심 효소군으로 언급됨'),
  ('bcl2_bax', 'Bcl-2/Bax', '세포사멸 조절 축으로 언급됨'),
  ('fas_receptor', 'Fas (death receptor)', '세포 표면 사멸 수용체로 카스파제 8 촉발과 연관되어 언급됨'),
  ('caspase3', 'Caspase-3', 'chloroquine 및 일부 물질과 연관되어 언급된 세포사멸 실행 카스파제')
ON CONFLICT (slug) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;
