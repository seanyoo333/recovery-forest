/**
 * Health Habits Evaluation Utils
 *
 * 건강습관 평가 및 점수 계산 유틸리티 함수
 */
import type { Category, DailyGridLog, GridOption } from "./types";

import { format, subDays } from "date-fns";

import {
  AXIS_LABEL,
  CATEGORY_MAX,
  CATEGORY_SCORES,
  CATEGORY_WEIGHTS,
  GRACE_PER_WEEK,
  HABIT_TO_AXIS_WEIGHT,
  META_AXES,
  type MetaAxis,
  RECORD_SUCCESS_THRESHOLD,
  STUDY_TYPE_STRENGTH,
  SUPPLEMENT_CALCULATION_CONSTANTS,
  TRAFFIC_LIGHT_THRESHOLDS,
} from "./constants";

/**
 * 카테고리별 일일 점수 계산
 */
export function calculateCategoryScore(
  logs: DailyGridLog[],
  category: Category,
  options: GridOption[],
): number {
  const categoryLogs = logs.filter((log) => log.category === category);

  if (categoryLogs.length === 0) return 0;

  // 각 시간대별 최고 점수만 사용 (하루에 여러 번 기록해도 최고값만)
  const scoresByTimeBlock = new Map<string, number>();

  categoryLogs.forEach((log) => {
    if (!log.option_id) return;

    const option = options.find((opt) => opt.id === log.option_id);
    if (!option) return;

    const timeBlock = log.time_block;
    const isTemplate = option.kind === "template";
    const scoreKey = isTemplate ? "__template__" : option.label;
    const score = CATEGORY_SCORES[category][scoreKey] ?? 0;

    const currentScore = scoresByTimeBlock.get(timeBlock) ?? -Infinity;
    if (score > currentScore) {
      scoresByTimeBlock.set(timeBlock, score);
    }
  });

  // 최고 점수 반환 (하루에 여러 시간대 기록 시 최고값)
  return Math.max(...Array.from(scoresByTimeBlock.values()), 0);
}

/**
 * 일일 총점 계산
 */
export function calculateDailyTotal(
  logs: DailyGridLog[],
  options: GridOption[],
): number {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  return categories.reduce((total, category) => {
    return total + calculateCategoryScore(logs, category, options);
  }, 0);
}

/**
 * 기록된 카테고리 수 계산
 */
export function countFilledCategories(logs: DailyGridLog[]): number {
  const filledCategories = new Set<Category>();
  logs.forEach((log) => {
    if (log.option_id) {
      filledCategories.add(log.category);
    }
  });
  return filledCategories.size;
}

/**
 * 기간별 평균 점수 계산
 */
export interface PeriodScores {
  yesterday: number | null;
  week7Avg: number | null;
  month30Avg: number | null;
}

export function calculatePeriodScores(
  dailyScores: Array<{ date: string; total: number }>,
  today: string,
): PeriodScores {
  const yesterday = format(subDays(new Date(today), 1), "yyyy-MM-dd");
  const week7Start = format(subDays(new Date(today), 7), "yyyy-MM-dd");
  const month30Start = format(subDays(new Date(today), 30), "yyyy-MM-dd");

  // 어제 점수
  const yesterdayScore =
    dailyScores.find((d) => d.date === yesterday)?.total ?? null;

  // 지난 7일 평균 (오늘 제외)
  const week7Scores = dailyScores.filter(
    (d) => d.date >= week7Start && d.date < today,
  );
  const week7Avg =
    week7Scores.length > 0
      ? week7Scores.reduce((sum, d) => sum + d.total, 0) / week7Scores.length
      : null;

  // 지난 30일 평균 (오늘 제외)
  const month30Scores = dailyScores.filter(
    (d) => d.date >= month30Start && d.date < today,
  );
  const month30Avg =
    month30Scores.length > 0
      ? month30Scores.reduce((sum, d) => sum + d.total, 0) /
        month30Scores.length
      : null;

  return {
    yesterday: yesterdayScore,
    week7Avg,
    month30Avg,
  };
}

/**
 * 신호등 상태 계산
 */
export type TrafficLightStatus = "gray" | "green" | "yellow" | "red";

export interface TrafficLightResult {
  status: TrafficLightStatus;
  message: string;
  filledCount: number;
  todayTotal: number;
  baseline: number | null;
  delta: number | null;
}

export function calculateTrafficLight(
  filledCount: number,
  todayTotal: number,
  periodScores: PeriodScores,
): TrafficLightResult {
  // 데이터 품질 체크
  if (filledCount <= 1) {
    return {
      status: "gray",
      message: "오늘 1개만 더 체크하면 상태가 계산돼요",
      filledCount,
      todayTotal,
      baseline: null,
      delta: null,
    };
  }

  // 기준선 계산
  if (periodScores.week7Avg === null || periodScores.month30Avg === null) {
    return {
      status: "yellow",
      message: "데이터가 부족해요. 계속 기록해주세요",
      filledCount,
      todayTotal,
      baseline: null,
      delta: null,
    };
  }

  const baseline = 0.7 * periodScores.week7Avg + 0.3 * periodScores.month30Avg;
  const delta = todayTotal - baseline;

  if (delta >= TRAFFIC_LIGHT_THRESHOLDS.GREEN) {
    return {
      status: "green",
      message: "최근 평균보다 좋아요. 오늘은 유지가 목표",
      filledCount,
      todayTotal,
      baseline,
      delta,
    };
  } else if (delta <= TRAFFIC_LIGHT_THRESHOLDS.RED) {
    return {
      status: "red",
      message: "오늘은 낮은 날. 회복 루틴 1개만 선택하세요",
      filledCount,
      todayTotal,
      baseline,
      delta,
    };
  } else {
    return {
      status: "yellow",
      message: "평균 근처. 작은 한 가지로 '좋은 날' 만들기",
      filledCount,
      todayTotal,
      baseline,
      delta,
    };
  }
}

/**
 * 카테고리별 상태 판정
 */
export type CategoryStatus = "good" | "ok" | "needs_care";

export interface CategoryEvaluation {
  category: Category;
  status: CategoryStatus;
  todayScore: number;
  baseline: number;
  delta: number;
}

function groupLogsByDate(logs: DailyGridLog[]): Map<string, DailyGridLog[]> {
  const grouped = new Map<string, DailyGridLog[]>();
  logs.forEach((log) => {
    if (!grouped.has(log.log_date)) {
      grouped.set(log.log_date, []);
    }
    grouped.get(log.log_date)!.push(log);
  });
  return grouped;
}

export function calculatePeriodCategoryScores(
  logs: DailyGridLog[],
  options: GridOption[],
  week7Start: string,
  month30Start: string,
  today: string,
): Record<Category, { week7Avg: number | null; month30Avg: number | null }> {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  const groupedLogs = groupLogsByDate(logs);

  const result: Record<
    Category,
    { week7Avg: number | null; month30Avg: number | null }
  > = {} as any;

  categories.forEach((category) => {
    const week7Scores: number[] = [];
    const month30Scores: number[] = [];

    groupedLogs.forEach((dateLogs, date) => {
      if (date >= week7Start && date < today) {
        const score = calculateCategoryScore(dateLogs, category, options);
        week7Scores.push(score);
      }
      if (date >= month30Start && date < today) {
        const score = calculateCategoryScore(dateLogs, category, options);
        month30Scores.push(score);
      }
    });

    result[category] = {
      week7Avg:
        week7Scores.length > 0
          ? week7Scores.reduce((a, b) => a + b, 0) / week7Scores.length
          : null,
      month30Avg:
        month30Scores.length > 0
          ? month30Scores.reduce((a, b) => a + b, 0) / month30Scores.length
          : null,
    };
  });

  return result;
}

export function evaluateCategories(
  todayLogs: DailyGridLog[],
  periodCategoryScores: Record<
    Category,
    { week7Avg: number | null; month30Avg: number | null }
  >,
  options: GridOption[],
): CategoryEvaluation[] {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  return categories.map((category) => {
    const todayScore = calculateCategoryScore(todayLogs, category, options);
    const period = periodCategoryScores[category];

    if (period.week7Avg === null || period.month30Avg === null) {
      return {
        category,
        status: "ok" as CategoryStatus,
        todayScore,
        baseline: 0,
        delta: 0,
      };
    }

    const baseline = 0.7 * period.week7Avg + 0.3 * period.month30Avg;
    const delta = todayScore - baseline;

    let status: CategoryStatus;
    if (delta >= 1) {
      status = "good";
    } else if (delta <= -1) {
      status = "needs_care";
    } else {
      status = "ok";
    }

    return {
      category,
      status,
      todayScore,
      baseline,
      delta,
    };
  });
}

/**
 * 다음 행동 추천
 */
export interface NextAction {
  category: Category;
  message: string;
  priority: number;
}

export function recommendNextAction(
  evaluations: CategoryEvaluation[],
): NextAction | null {
  const needsCare = evaluations.filter((e) => e.status === "needs_care");

  if (needsCare.length === 0) {
    return null; // 모두 괜찮으면 추천 없음
  }

  // priority_score = weight * (-delta)
  const actions = needsCare.map((evaluation) => ({
    category: evaluation.category,
    priority: CATEGORY_WEIGHTS[evaluation.category] * -evaluation.delta,
    delta: evaluation.delta,
  }));

  // 가장 큰 priority를 가진 카테고리 선택
  const topAction = actions.reduce((max, curr) =>
    curr.priority > max.priority ? curr : max,
  );

  // 카테고리별 추천 메시지
  const messages: Record<Category, string> = {
    sleep: "오늘은 자기 전 보조요법(호흡/명상)만 체크 목표",
    diet: "야식/과식 방지 1개만 지키기",
    exercise: "10분 저강도만",
    therapy: "5분 루틴",
    supplement: "아침 루틴만",
  };

  return {
    category: topAction.category,
    message: messages[topAction.category],
    priority: topAction.priority,
  };
}

/**
 * 히트맵 데이터 포인트
 */
export interface HeatmapDataPoint {
  date: string;
  category: Category;
  score: number;
  filled: boolean;
}

/**
 * 히트맵 데이터 생성
 */
export function generateHeatmapData(
  dailyLogsByDate: Map<string, DailyGridLog[]>,
  options: GridOption[],
  startDate: string,
  endDate: string,
): HeatmapDataPoint[] {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  const data: HeatmapDataPoint[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, "yyyy-MM-dd");
    const logs = dailyLogsByDate.get(dateStr) ?? [];

    categories.forEach((category) => {
      const score = calculateCategoryScore(logs, category, options);
      const filled = logs.some(
        (log) => log.category === category && log.option_id,
      );

      data.push({
        date: dateStr,
        category,
        score,
        filled,
      });
    });
  }

  return data;
}

/**
 * 최근 7일 카테고리별 평균 delta 계산
 */
export function calculateCategoryDeltas(
  dailyLogsByDate: Map<string, DailyGridLog[]>,
  options: GridOption[],
  periodCategoryScores: Record<
    Category,
    { week7Avg: number | null; month30Avg: number | null }
  >,
  week7Start: string,
  today: string,
): Record<Category, number> {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  const result: Record<Category, number> = {} as any;

  categories.forEach((category) => {
    const period = periodCategoryScores[category];
    if (period.week7Avg === null || period.month30Avg === null) {
      result[category] = 0;
      return;
    }

    const baseline = 0.7 * period.week7Avg + 0.3 * period.month30Avg;

    // 최근 7일 delta 평균 계산
    const deltas: number[] = [];
    const start = new Date(week7Start);
    const end = new Date(today);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, "yyyy-MM-dd");
      const logs = dailyLogsByDate.get(dateStr) ?? [];
      const score = calculateCategoryScore(logs, category, options);
      const delta = score - baseline;
      deltas.push(delta);
    }

    result[category] =
      deltas.length > 0
        ? deltas.reduce((sum, d) => sum + d, 0) / deltas.length
        : 0;
  });

  return result;
}

/**
 * 가장 흔들린 카테고리 찾기
 */
export function findWorstCategory(
  categoryDeltas: Record<Category, number>,
): Category | null {
  const categories: Category[] = [
    "exercise",
    "sleep",
    "supplement",
    "diet",
    "therapy",
  ];

  const worst = categories.reduce((min, cat) => {
    return categoryDeltas[cat] < categoryDeltas[min] ? cat : min;
  }, categories[0]);

  return categoryDeltas[worst] < 0 ? worst : null; // 음수 delta만 "흔들림"으로 간주
}

/**
 * 히트맵 판단 문장 생성
 */
export interface HeatmapInsight {
  message: string;
  filledCount: number;
}

export function generateHeatmapInsight(
  filledCount: number,
  worstCategory: Category | null,
): HeatmapInsight {
  const categoryLabels: Record<Category, string> = {
    exercise: "운동",
    sleep: "수면",
    supplement: "보조제",
    diet: "식단",
    therapy: "보조요법",
  };

  if (filledCount < 2) {
    return {
      message: "기록이 적어서 패턴이 흐려요. 1개만 더 체크해요.",
      filledCount,
    };
  }

  if (worstCategory) {
    return {
      message: `최근 30일 중 가장 흔들린 건: ${categoryLabels[worstCategory]}`,
      filledCount,
    };
  }

  return {
    message: "모든 카테고리가 안정적으로 유지되고 있어요.",
    filledCount,
  };
}

/**
 * 기록 스트릭 계산
 */
export interface StreakData {
  currentStreak: number;
  graceUsed: number; // 이번 주 사용한 grace 횟수
  lastRecordDate: string | null;
}

export function calculateStreak(
  dailyRecords: Array<{ date: string; filledCount: number }>,
  today: string,
): StreakData {
  // 날짜순 정렬 (오래된 것부터)
  const sorted = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  let graceUsed = 0;
  let lastRecordDate: string | null = null;

  // 오늘부터 역순으로 계산
  const todayDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(todayDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = format(checkDate, "yyyy-MM-dd");

    const record = sorted.find((r) => r.date === dateStr);
    const filledCount = record?.filledCount ?? 0;

    if (filledCount >= RECORD_SUCCESS_THRESHOLD) {
      currentStreak++;
      if (!lastRecordDate) {
        lastRecordDate = dateStr;
      }
    } else if (filledCount === 1) {
      // Grace 사용 가능 여부 확인 (주 1회)
      const checkDateObj = new Date(dateStr);
      const weekStart = new Date(checkDateObj);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = format(weekStart, "yyyy-MM-dd");

      // 이번 주에 이미 grace를 사용했는지 확인
      const weekRecords = sorted.filter(
        (r) => r.date >= weekStartStr && r.date < dateStr,
      );
      const weekGraceUsed = weekRecords.filter(
        (r) => r.filledCount === 1,
      ).length;

      if (weekGraceUsed < GRACE_PER_WEEK) {
        currentStreak++;
        graceUsed++;
        if (!lastRecordDate) {
          lastRecordDate = dateStr;
        }
      } else {
        break; // 스트릭 깨짐
      }
    } else {
      // filledCount === 0
      break; // 스트릭 깨짐
    }
  }

  return {
    currentStreak,
    graceUsed,
    lastRecordDate,
  };
}

/**
 * 레이더 차트 계산 유틸리티
 */

/**
 * 숫자를 범위 내로 제한
 */
function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

/**
 * 생활습관 점수를 5축 점수로 변환
 * 각 카테고리를 0~1로 정규화한 후 가중치를 적용
 */
export function computeLifestyleAxisScores(
  habitScores: Record<Category, number>,
): Record<MetaAxis, number> {
  // 1. 각 카테고리를 0~1로 정규화
  const normalizedScores: Record<Category, number> = {} as any;
  (Object.keys(habitScores) as Category[]).forEach((cat) => {
    const raw = habitScores[cat];
    const max = CATEGORY_MAX[cat];
    normalizedScores[cat] = Math.min(raw / max, 1.0);
  });

  // 2. 축별 생활습관 점수 계산
  const axisScores: Record<MetaAxis, number> = {
    metabolic_pressure: 0,
    immune_balance: 0,
    abnormal_signals: 0,
    neuro_stress: 0,
    recovery: 0,
  };

  const axisWeights: Record<MetaAxis, number> = {
    metabolic_pressure: 0,
    immune_balance: 0,
    abnormal_signals: 0,
    neuro_stress: 0,
    recovery: 0,
  };

  // 각 카테고리별로 축에 가중치 적용
  (Object.keys(normalizedScores) as Category[]).forEach((cat) => {
    const normValue = normalizedScores[cat];
    const weights = HABIT_TO_AXIS_WEIGHT[cat];
    
    for (const axis of META_AXES) {
      const w = weights[axis] ?? 0;
      axisScores[axis] += normValue * w;
      axisWeights[axis] += w;
    }
  });

  // 3. 가중 평균 계산 (분모로 나눠서 0~100 유지)
  const result: Record<MetaAxis, number> = {} as any;
  for (const axis of META_AXES) {
    const totalWeight = axisWeights[axis];
    if (totalWeight > 0) {
      result[axis] = clamp((axisScores[axis] / totalWeight) * 100, 0, 100);
    } else {
      result[axis] = 0;
    }
  }

  return result;
}

/**
 * 천연물 점수 계산 (5축 새로운 공식)
 */
export type JoinedEvidenceRow = {
  ingredient_id: string;
  ingredient_name: string;
  target_slug: string;
  strength: number;
  study_type:
    | "systematic_review"
    | "rct"
    | "human_observational"
    | "case_report"
    | "animal"
    | "cell"
    | "mechanistic";
  meta_axis: MetaAxis;
  axis_weight: number;
  dose_count: number;
};

/**
 * 포화 함수: 1 - e^(-k * x)
 */
function saturationFunction(x: number, k: number): number {
  return 1 - Math.exp(-k * x);
}

/**
 * 천연물 축 점수 계산 (새로운 5축 공식)
 */
export function computeSupplementAxisScores(
  rows: JoinedEvidenceRow[],
): Record<MetaAxis, number> {
  const { KC, KD, ALPHA, KS, TOP_K } = SUPPLEMENT_CALCULATION_CONSTANTS;

  // 1. 같은 성분-표적의 효과는 최고 근거 효과만 채택
  const ingredientTargetEffect = new Map<string, number>();
  const ingredientTargetConfidence = new Map<string, number>();
  const ingredientTargetCount = new Map<string, number>();
  const ingredientDoseCount = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.ingredient_id}:${row.target_slug}`;
    
    // strength는 이미 최고값으로 처리되어 있다고 가정
    // 만약 아니라면 여기서 max 처리
    const currentEffect = ingredientTargetEffect.get(key) ?? 0;
    ingredientTargetEffect.set(key, Math.max(currentEffect, row.strength));

    // confidence는 논문 수로 계산 (포화 함수)
    const currentCount = ingredientTargetCount.get(key) ?? 0;
    ingredientTargetCount.set(key, currentCount + 1);
    
    // dose_count 저장
    ingredientDoseCount.set(row.ingredient_id, row.dose_count);
  }

  // confidence 계산 (포화 함수)
  ingredientTargetCount.forEach((count, key) => {
    const confidence = saturationFunction(count, KC);
    ingredientTargetConfidence.set(key, confidence);
  });

  // 2. 단일 성분-표적 점수 계산
  const ingredientTargetScores = new Map<string, number>();
  ingredientTargetEffect.forEach((effect, key) => {
    const confidence = ingredientTargetConfidence.get(key) ?? 0;
    const [ingredientId] = key.split(":");
    const doseCount = ingredientDoseCount.get(ingredientId) ?? 0;
    const doseFactor = saturationFunction(doseCount, KD);
    
    const score = effect * confidence * doseFactor;
    ingredientTargetScores.set(key, score);
  });

  // 3. 같은 표적을 여러 성분이 때리면 포화 합성
  const targetScores = new Map<string, number>();
  const targetToIngredientTargets = new Map<string, string[]>();

  for (const row of rows) {
    const key = `${row.ingredient_id}:${row.target_slug}`;
    if (!targetToIngredientTargets.has(row.target_slug)) {
      targetToIngredientTargets.set(row.target_slug, []);
    }
    targetToIngredientTargets.get(row.target_slug)!.push(key);
  }

  targetToIngredientTargets.forEach((ingredientTargetKeys, targetSlug) => {
    // 포화 합성: 1 - ∏(1 - score)
    let product = 1;
    for (const key of ingredientTargetKeys) {
      const score = ingredientTargetScores.get(key) ?? 0;
      product *= 1 - score;
    }
    const targetTotal = 1 - product;
    targetScores.set(targetSlug, targetTotal);
  });

  // 4. 표적을 축별로 그룹화
  const axisToTargets = new Map<MetaAxis, Array<{ target: string; score: number }>>();
  for (const row of rows) {
    const targetScore = targetScores.get(row.target_slug) ?? 0;
    if (!axisToTargets.has(row.meta_axis)) {
      axisToTargets.set(row.meta_axis, []);
    }
    const targets = axisToTargets.get(row.meta_axis)!;
    // 중복 제거
    if (!targets.find((t) => t.target === row.target_slug)) {
      targets.push({ target: row.target_slug, score: targetScore });
    }
  }

  // 5. 축별 점수 계산 (상위 2개 핵심 + 나머지 롱테일)
  const rawAxisScores: Record<MetaAxis, number> = {
    metabolic_pressure: 0,
    immune_balance: 0,
    abnormal_signals: 0,
    neuro_stress: 0,
    recovery: 0,
  };

  axisToTargets.forEach((targets, axis) => {
    // 내림차순 정렬
    targets.sort((a, b) => b.score - a.score);
    
    // 상위 TOP_K개는 핵심
    const core = targets.slice(0, TOP_K).reduce((sum, t) => sum + t.score, 0);
    
    // 나머지는 롱테일
    const tail = targets.slice(TOP_K).reduce((sum, t) => sum + t.score, 0);
    
    // rawAxis = core + α * tail
    rawAxisScores[axis] = core + ALPHA * tail;
  });

  // 6. 축의 rawAxis를 0~100으로 포화 변환
  const suppAxisScores: Record<MetaAxis, number> = {} as any;
  for (const axis of META_AXES) {
    const rawAxis = rawAxisScores[axis];
    suppAxisScores[axis] = 100 * saturationFunction(rawAxis, KS);
  }

  return suppAxisScores;
}

/**
 * 최종 레이더 점수 계산 (80% 천연물 + 20% 생활습관)
 */
export function combineAxisScores(
  suppAxisScores: Record<MetaAxis, number>,
  lifeAxisScores: Record<MetaAxis, number>,
): Record<MetaAxis, number> {
  const finalScores: Record<MetaAxis, number> = {} as any;

  for (const axis of META_AXES) {
    // 가중 평균: 0.8 * 천연물 + 0.2 * 생활습관
    const final = 0.8 * suppAxisScores[axis] + 0.2 * lifeAxisScores[axis];
    finalScores[axis] = clamp(final, 0, 100);
  }

  return finalScores;
}

/**
 * 레이더 차트 데이터 형식으로 변환
 */
export function toRadarData(scores: Record<MetaAxis, number>) {
  return META_AXES.map((axis) => ({
    axis,
    label: AXIS_LABEL[axis],
    score: Math.round(scores[axis]),
  }));
}

/**
 * 상위 기여 성분 추출 (새로운 계산식 기반)
 */
export function topContributingIngredients(
  rows: JoinedEvidenceRow[],
  topN = 2,
): Array<{
  ingredient_id: string;
  name: string;
  score: number;
  axes: MetaAxis[];
}> {
  const { KC, KD } = SUPPLEMENT_CALCULATION_CONSTANTS;
  
  // 성분별로 점수 집계
  const ingredientScores = new Map<
    string,
    { name: string; score: number; axes: Set<MetaAxis> }
  >();

  // 같은 성분-표적의 최고 효과만 사용
  const ingredientTargetEffect = new Map<string, number>();
  const ingredientTargetConfidence = new Map<string, number>();
  const ingredientTargetCount = new Map<string, number>();
  const ingredientDoseCount = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.ingredient_id}:${row.target_slug}`;
    
    const currentEffect = ingredientTargetEffect.get(key) ?? 0;
    ingredientTargetEffect.set(key, Math.max(currentEffect, row.strength));

    const currentCount = ingredientTargetCount.get(key) ?? 0;
    ingredientTargetCount.set(key, currentCount + 1);
    
    ingredientDoseCount.set(row.ingredient_id, row.dose_count);
  }

  // confidence 계산
  ingredientTargetCount.forEach((count, key) => {
    const confidence = saturationFunction(count, KC);
    ingredientTargetConfidence.set(key, confidence);
  });

  // 성분별 점수 계산
  ingredientTargetEffect.forEach((effect, key) => {
    const [ingredientId] = key.split(":");
    const confidence = ingredientTargetConfidence.get(key) ?? 0;
    const doseCount = ingredientDoseCount.get(ingredientId) ?? 0;
    const doseFactor = saturationFunction(doseCount, KD);
    
    const score = effect * confidence * doseFactor;
    
    const ingredient = rows.find((r) => r.ingredient_id === ingredientId);
    if (!ingredient) return;

    const current = ingredientScores.get(ingredientId) ?? {
      name: ingredient.ingredient_name,
      score: 0,
      axes: new Set<MetaAxis>(),
    };
    
    current.score += score;
    current.axes.add(ingredient.meta_axis);
    ingredientScores.set(ingredientId, current);
  });

  const arr = [...ingredientScores.entries()].map(([id, v]) => ({
    ingredient_id: id,
    name: v.name,
    score: v.score,
    axes: [...v.axes],
  }));

  arr.sort((a, b) => b.score - a.score);
  return arr.slice(0, topN);
}
