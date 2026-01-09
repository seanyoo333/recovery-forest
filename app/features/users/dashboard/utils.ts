/**
 * Health Habits Evaluation Utils
 *
 * 건강습관 평가 및 점수 계산 유틸리티 함수
 */
import type { Category, DailyGridLog, GridOption } from "./types";

import { format, subDays } from "date-fns";

import {
  AXIS_LABEL,
  AXIS_MAX,
  BONUS_CAP_TOTAL,
  CATEGORY_SCORES,
  CATEGORY_WEIGHTS,
  EVIDENCE_MULT,
  GRACE_PER_WEEK,
  HABIT_TO_AXIS_WEIGHT,
  META_AXES,
  type MetaAxis,
  RECORD_SUCCESS_THRESHOLD,
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
 * 생활습관 점수를 6축 기본점수로 변환
 */
export function computeLifestyleBaseAxisScores(
  habitScores: Record<Category, number>,
): Record<MetaAxis, number> {
  // 축별 누적
  const axisRaw: Record<MetaAxis, number> = {
    metabolic: 0,
    inflammation: 0,
    immune: 0,
    hormone: 0,
    neuro: 0,
    recovery: 0,
  };

  (Object.keys(habitScores) as Category[]).forEach((cat) => {
    const s = habitScores[cat];
    const weights = HABIT_TO_AXIS_WEIGHT[cat];
    for (const axis of META_AXES) {
      const w = weights[axis] ?? 0;
      axisRaw[axis] += s * w;
    }
  });

  // 정규화 (0~100)
  const axisBase100: Record<MetaAxis, number> = {} as any;
  for (const axis of META_AXES) {
    axisBase100[axis] = clamp((axisRaw[axis] / AXIS_MAX[axis]) * 100, 0, 100);
  }

  return axisBase100;
}

/**
 * 천연물 보너스 점수 계산
 */
export type JoinedEvidenceRow = {
  ingredient_id: string;
  ingredient_name: string;
  target_slug: string;
  strength: number;
  evidence_level: "cell" | "animal" | "human" | "mixed" | "preclinical";
  meta_axis: MetaAxis;
  axis_weight: number;
};

export function computeSupplementBonusAxisScores(
  rows: JoinedEvidenceRow[],
): Record<MetaAxis, number> {
  const bonus: Record<MetaAxis, number> = {
    metabolic: 0,
    inflammation: 0,
    immune: 0,
    hormone: 0,
    neuro: 0,
    recovery: 0,
  };

  for (const r of rows) {
    const mult = EVIDENCE_MULT[r.evidence_level] ?? 0.7;
    const contrib = r.strength * r.axis_weight * mult;
    bonus[r.meta_axis] += contrib;
  }

  // 스케일 조정: contrib 합을 0~10 수준으로 맞추기
  const SCALE = 5;
  for (const axis of META_AXES) {
    bonus[axis] = clamp(bonus[axis] * SCALE, 0, 10);
  }

  // 전체 캡: 총합이 20 넘으면 비율로 줄이기
  const total = META_AXES.reduce((s, a) => s + bonus[a], 0);
  if (total > BONUS_CAP_TOTAL) {
    const ratio = BONUS_CAP_TOTAL / total;
    for (const axis of META_AXES) {
      bonus[axis] = Math.round(bonus[axis] * ratio * 10) / 10;
    }
  }

  return bonus;
}

/**
 * 최종 레이더 점수 계산 (기본점수 + 보너스)
 */
export function combineAxisScores(
  base100: Record<MetaAxis, number>,
  bonus0to10: Record<MetaAxis, number>,
): Record<MetaAxis, number> {
  const out: Record<MetaAxis, number> = {} as any;
  const BONUS_SCALE_TO_20 = 2;

  for (const axis of META_AXES) {
    const bonus = clamp(bonus0to10[axis] * BONUS_SCALE_TO_20, 0, 20);
    out[axis] = clamp(base100[axis] + bonus, 0, 100);
  }

  return out;
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
 * 상위 기여 성분 추출
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
  const map = new Map<
    string,
    { name: string; score: number; axes: Set<MetaAxis> }
  >();

  for (const r of rows) {
    const mult = EVIDENCE_MULT[r.evidence_level] ?? 0.7;
    const contrib = r.strength * r.axis_weight * mult;
    const key = r.ingredient_id;
    const cur = map.get(key) ?? {
      name: r.ingredient_name,
      score: 0,
      axes: new Set<MetaAxis>(),
    };
    cur.score += contrib;
    cur.axes.add(r.meta_axis);
    map.set(key, cur);
  }

  const arr = [...map.entries()].map(([id, v]) => ({
    ingredient_id: id,
    name: v.name,
    score: v.score,
    axes: [...v.axes],
  }));

  arr.sort((a, b) => b.score - a.score);
  return arr.slice(0, topN);
}
