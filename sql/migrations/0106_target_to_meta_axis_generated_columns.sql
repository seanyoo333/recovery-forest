-- target_to_meta_axis: meta_axis별 축 라벨·상세설명 GENERATED COLUMN 추가
-- INSERT 시 meta_axis 값에 따라 자동 계산되어 저장됨

ALTER TABLE "target_to_meta_axis"
ADD COLUMN "axis_label" text GENERATED ALWAYS AS (
  CASE "meta_axis"
    WHEN 'metabolic_pressure' THEN '대사 안정화'
    WHEN 'immune_balance' THEN '면역 균형'
    WHEN 'abnormal_signals' THEN '비정상 신호조절'
    WHEN 'neuro_stress' THEN '신경·스트레스 개입'
    WHEN 'recovery' THEN '회복증진'
    ELSE NULL
  END
) STORED;

ALTER TABLE "target_to_meta_axis"
ADD COLUMN "axis_description" text GENERATED ALWAYS AS (
  CASE "meta_axis"
    WHEN 'metabolic_pressure' THEN '암세포의 포도당, 단백질, 지방 대사 억제'
    WHEN 'immune_balance' THEN '면역비율(th1/th2), 면역관문, 순환종양세포(CTC), 마이크로 바이옴'
    WHEN 'abnormal_signals' THEN '성장인자, 침윤 및 전이 인자, 호르몬'
    WHEN 'neuro_stress' THEN '자율신경+면역대사, 세포자멸사+치료민감도'
    WHEN 'recovery' THEN '후성유전, 미토콘드리아 회복, 인체회복, 디톡스'
    ELSE NULL
  END
) STORED;
