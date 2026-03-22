/**
 * 천연물 표적·대시보드 레이더 공통 메타축 (5축)
 * DB `target_to_meta_axis.meta_axis`, Drizzle `axis_label` / `axis_description` 과 정합
 */
export const META_AXES = [
  "metabolic_stability",
  "immune_balance",
  "abnormal_signals",
  "neuro_stress",
  "recovery",
] as const;

export type MetaAxis = (typeof META_AXES)[number];

export function isMetaAxis(value: string): value is MetaAxis {
  return (META_AXES as readonly string[]).includes(value);
}

/** UI·목록용 짧은 축 이름 (대시보드 레이더·표적별 모음 공통) */
export const AXIS_LABEL: Record<MetaAxis, string> = {
  metabolic_stability: "대사 안정화",
  immune_balance: "면역 균형",
  abnormal_signals: "비정상 신호조절",
  neuro_stress: "신경·스트레스",
  recovery: "회복증진",
};

/**
 * 축별 설명 (DB generated `axis_description` CASE 문과 동일한 문구)
 */
export const AXIS_DESCRIPTION: Record<MetaAxis, string> = {
  metabolic_stability: "암세포의 포도당, 단백질, 지방 대사 억제",
  immune_balance:
    "면역비율(th1/th2), 면역관문, 순환종양세포(CTC), 종양미세환경, 염증신호, 마이크로 바이옴",
  abnormal_signals: "성장인자, 침윤 및 전이 인자, 호르몬",
  neuro_stress: "자율신경+면역대사, 세포자멸사+치료민감도",
  recovery: "후성유전, 미토콘드리아 회복, 인체회복, 디톡스",
};
