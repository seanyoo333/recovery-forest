import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export interface WeeklyEventStats {
  week: string; // "YYYY-MM-DD" 형식 (주 시작일)
  weekLabel: string; // "MM/DD ~ MM/DD" 형식
  product_view: number;
  product_visit: number;
}

/**
 * 일주일별로 product_view와 product_visit 이벤트를 집계합니다.
 *
 * 로직 설명:
 * 1. 최근 12주(84일) 전부터 현재까지의 이벤트를 조회
 * 2. 각 이벤트의 created_at 날짜를 기준으로 해당 주의 시작일(월요일)을 계산
 * 3. 주별로 product_view와 product_visit 이벤트를 카운팅
 * 4. 주 시작일과 종료일을 포함한 라벨을 생성하여 반환
 *
 * @param client - Supabase client instance
 * @returns 주별 이벤트 통계 배열 (주 시작일 기준으로 정렬됨)
 */
export async function getWeeklyEventStats(
  client: SupabaseClient<Database>,
): Promise<WeeklyEventStats[]> {
  // 1단계: 최근 12주 데이터 조회 (84일 전부터)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const { data: events, error } = await client
    .from("events")
    .select("created_at, event_type")
    .in("event_type", ["product_view", "product_visit"])
    .gte("created_at", twelveWeeksAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!events || events.length === 0) {
    return [];
  }

  // 2단계: 주별로 데이터 집계
  // weeklyData 구조: { "YYYY-MM-DD": { product_view: 0, product_visit: 0 } }
  const weeklyData: Record<
    string,
    { product_view: number; product_visit: number }
  > = {};

  events.forEach((event) => {
    // 이벤트 날짜를 가져옴
    const date = new Date(event.created_at);

    // 해당 날짜가 속한 주의 시작일(월요일)을 계산
    const weekStart = getWeekStart(date);

    // 주 시작일을 "YYYY-MM-DD" 형식의 키로 사용
    const weekKey = weekStart.toISOString().split("T")[0];

    // 해당 주의 데이터가 없으면 초기화
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { product_view: 0, product_visit: 0 };
    }

    // 이벤트 타입에 따라 카운트 증가
    if (event.event_type === "product_view") {
      weeklyData[weekKey].product_view += 1;
    } else if (event.event_type === "product_visit") {
      weeklyData[weekKey].product_visit += 1;
    }
  });

  // 3단계: 객체를 배열로 변환하고 주 라벨 생성
  const result = Object.entries(weeklyData)
    .map(([week, counts]) => {
      const weekStart = new Date(week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 주 시작일 + 6일 = 주 종료일

      // "MM/DD ~ MM/DD" 형식의 라벨 생성
      const weekLabel = `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`;

      return {
        week, // "YYYY-MM-DD" 형식의 주 시작일
        weekLabel, // "MM/DD ~ MM/DD" 형식의 표시용 라벨
        product_view: counts.product_view,
        product_visit: counts.product_visit,
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week)); // 주 시작일 기준 오름차순 정렬

  return result;
}

/**
 * 주어진 날짜가 속한 주의 시작일(월요일)을 반환합니다.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 날짜를 "MM/DD" 형식으로 포맷합니다.
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}
