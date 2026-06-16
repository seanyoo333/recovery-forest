import type { PrescribeInput } from "../schemas/prescribe-input.schema";
import type { PrescribeOutput } from "../schemas/prescribe-output.schema";

/**
 * 데모용 처방 픽스처 — docs/output.json 의 두 예시를 타입으로 고정.
 *
 * UI 우선 단계: 백엔드(엔진+AI) 없이 화면을 완성하기 위한 표본.
 * 운영 전환 시 동일한 PrescribeOutput 인터페이스로 엔진+AI 응답을 끼우면 된다.
 */

export const COMFORT_INPUT_DEMO: PrescribeInput = {
  session_id: "anon_8f3a2c",
  submitted_at: "2026-06-15T09:10:00+09:00",
  user_type: "comfort",
  health_goal: "수면",
  location: { lat: 37.5012, lon: 127.0396, label: "서울 강남구" },
  visit_plan: { date: "2026-06-20", arrival_hour: 10 },
  transport: { mode: "transit", needs_route: true, max_travel_minutes: 90 },
  preferences: {
    wants_program: true,
    wants_food: true,
    wants_nearby: false,
    companions: "solo",
  },
  // 0~12 척도(18문항). 패턴: 긴장·피로 높고 활력 낮음(소진).
  kpomsb_pre: { 긴장: 10, 우울: 7, 분노: 4, 활력: 4, 피로: 11, 혼란: 7 },
  consent: { data_use_agreed: true, followup_optin: true },
};

export const EXPLORER_INPUT_DEMO: PrescribeInput = {
  session_id: "anon_2b7e91",
  submitted_at: "2026-06-15T20:30:00+09:00",
  user_type: "explorer",
  health_goal: "스트레스",
  location: { lat: 37.5547, lon: 126.9706, label: "서울 중구" },
  visit_plan: { date: "2026-06-21", arrival_hour: 10 },
  transport: { mode: "car", needs_route: true, max_travel_minutes: 240 },
  preferences: {
    wants_program: true,
    wants_food: true,
    wants_nearby: true,
    companions: "family",
  },
  // 0~12 척도(18문항). 패턴: 활력 높고 부정지표 낮음(양호·예방).
  kpomsb_pre: { 긴장: 5, 우울: 3, 분노: 2, 활력: 10, 피로: 4, 혼란: 4 },
  consent: { data_use_agreed: true, followup_optin: true },
};

export const COMFORT_DEMO: PrescribeOutput = {
  session_id: "anon_8f3a2c",
  generated_at: "2026-06-15T09:10:30+09:00",
  user_summary: {
    user_type: "comfort",
    health_goal: "수면",
    ai_state_reading:
      "긴장과 피로가 높고 활력이 낮은 편으로, 수면 문제와 함께 몸과 마음이 과하게 긴장·소진된 상태로 보입니다.",
  },
  ranking: [
    {
      rank: 1,
      engine_score: 67.0,
      forest_name: "잣향기 푸른숲",
      engine_breakdown: {
        distance_km: 48,
        phytoncide_index: 52,
        pm25: 18,
        air_label: "양호",
        species: "잣나무",
      },
      ai_reason:
        "소진된 상태에는 자극적인 일정보다 가깝고 조용한 회복이 맞습니다. 48km로 부담이 적어 이동 자체가 스트레스가 되지 않습니다.",
    },
    {
      rank: 2,
      engine_score: 62.9,
      forest_name: "산음 치유의 숲",
      engine_breakdown: {
        distance_km: 65,
        phytoncide_index: 46,
        pm25: 16,
        air_label: "양호",
        species: "침활혼효림",
      },
      ai_reason: "조금 더 멀지만 한적해, 사람 많은 곳이 부담스러울 때 대안이 됩니다.",
      detail: {
        ai_personal_plan: [
          "사람 적은 안쪽 숲길을 골라 20분 정도 천천히 걷기",
          "전망 벤치에서 멈춰 깊게 호흡하며 긴장 내려놓기",
        ],
        recommended_program: { title: "산음 숲 치유 산책", is_example: true },
        itinerary: {
          date: "2026-06-20",
          steps: [
            { time: "09:20", activity: "출발 (대중교통)", place: "청량리역" },
            { time: "11:10", activity: "한적한 숲길 산책", place: "산음 치유의 숲" },
            { time: "13:00", activity: "점심 (예시)", place: "양평 인근 식당" },
            { time: "15:00", activity: "귀가", place: "인근역" },
          ],
        },
        ai_note:
          "한적함이 가장 큰 강점입니다. 무리한 코스보다 머무는 시간을 늘려보세요.",
      },
    },
    {
      rank: 3,
      engine_score: 58.9,
      forest_name: "대관령 치유의 숲",
      engine_breakdown: {
        distance_km: 155,
        phytoncide_index: 80,
        pm25: 9,
        air_label: "쾌적",
        species: "소나무",
      },
      ai_reason:
        "피톤치드는 더 높지만 거리가 멀어, 시간 여유가 있는 날 고려할 선택입니다.",
      detail: {
        ai_personal_plan: [
          "고지대 솔숲에서 서두르지 말고 짧은 구간만 걷기",
          "해가 좋은 오전에 빛을 쬐며 충분히 휴식하기",
        ],
        recommended_program: { title: "대관령 솔숲 명상", is_example: true },
        itinerary: {
          date: "2026-06-20",
          steps: [
            { time: "08:30", activity: "출발 (대중교통)", place: "청량리역" },
            { time: "11:30", activity: "솔숲 산책·휴식", place: "대관령 치유의 숲" },
            { time: "13:30", activity: "점심 (예시)", place: "평창 인근 식당" },
            { time: "15:30", activity: "귀가", place: "인근역" },
          ],
        },
        ai_note:
          "공기·피톤치드는 최상위지만 거리가 멀어, 시간 여유가 있는 날 권합니다.",
      },
    },
  ],
  top_pick_detail: {
    forest_name: "잣향기 푸른숲",
    ai_personal_plan: [
      "도착 후 무리한 코스 대신 잣나무 그늘에서 20~30분 정좌 호흡으로 과각성 가라앉히기",
      "수면 개선이 목표이므로 한낮보다 오전 빛을 쬐며 천천히 걷기",
      "혼자 방문이니 일정에 쫓기지 말고 숲 소리에 집중하는 짧은 휴식을 중간에 넣기",
    ],
    recommended_program: {
      title: "수면 개선 이완·아로마 명상",
      is_example: true,
    },
    itinerary: {
      date: "2026-06-20",
      steps: [
        { time: "09:45", activity: "KTX 탑승", place: "청량리역" },
        { time: "11:00", activity: "산림치유 프로그램", place: "잣향기 푸른숲" },
        {
          time: "13:30",
          activity: "점심 (예시)",
          place: "인근 식당",
          link: "https://",
        },
        { time: "15:30", activity: "귀가 KTX", place: "인근역" },
      ],
    },
    nearby_food: [
      {
        name: "느티나무 손칼국수",
        category: "한식",
        rating: 4.4,
        link: "https://",
      },
    ],
    ai_note:
      "피톤치드 잠재력은 국립산림과학원 연구 기반의 상대 지표이며, 오전 9~11시 방문을 권합니다. 수면 곤란이 오래 지속되면 전문가 상담도 함께 고려해 보세요.",
    cta: "이 처방을 저장하고, 방문 3일 후 변화 기록 알림을 받아보세요.",
  },
  disclaimers: [
    "피톤치드 잠재력 지수는 절대 농도가 아닌 상대 지표입니다.",
    "미세먼지는 방문 1~2일 전 예보로 다시 확인하세요.",
  ],
};

export const EXPLORER_DEMO: PrescribeOutput = {
  session_id: "anon_2b7e91",
  generated_at: "2026-06-15T20:30:30+09:00",
  user_summary: {
    user_type: "explorer",
    health_goal: "스트레스",
    ai_state_reading:
      "전반적으로 활력이 높고 큰 이상은 없는 상태로, 치료보다는 질 높은 숲 경험을 통한 스트레스 해소·예방에 적합합니다.",
  },
  ranking: [
    {
      rank: 1,
      engine_score: 86.7,
      forest_name: "축령산 편백 치유의 숲",
      engine_breakdown: {
        distance_km: 237,
        phytoncide_index: 100,
        pm25: 10,
        air_label: "쾌적",
        species: "편백",
      },
      ai_reason:
        "활력이 충분해 거리 부담을 감당할 수 있고, 피톤치드 잠재력 100점의 편백림은 깊은 숲 경험을 원하는 분께 가장 잘 맞습니다.",
    },
    {
      rank: 2,
      engine_score: 84.7,
      forest_name: "장흥 편백 치유의 숲",
      engine_breakdown: {
        distance_km: 319,
        phytoncide_index: 100,
        pm25: 12,
        air_label: "쾌적",
        species: "편백",
      },
      ai_reason: "동일하게 피톤치드 최상위 편백림으로, 남도 여행을 겸할 때 좋은 선택입니다.",
      detail: {
        ai_personal_plan: [
          "편백 군락 깊은 곳까지 1시간가량 능동적으로 걷기",
          "가족과 향이 진한 지점을 정해 머물며 깊게 호흡하기",
        ],
        recommended_program: { title: "장흥 편백 숲 치유 걷기", is_example: true },
        itinerary: {
          date: "2026-06-21",
          steps: [
            { time: "07:30", activity: "출발 (자가용)", place: "서울" },
            { time: "11:30", activity: "편백 숲길 걷기", place: "장흥 편백 치유의 숲" },
            { time: "13:30", activity: "점심 (예시)", place: "장흥 인근 식당" },
            { time: "15:00", activity: "남도 여행 (예시)", place: "장흥 일대" },
          ],
        },
        ai_note:
          "축령산과 같은 최상위 편백림으로, 남도 여행을 겸할 때 좋은 선택입니다.",
      },
    },
    {
      rank: 3,
      engine_score: 76.5,
      forest_name: "대관령 치유의 숲",
      engine_breakdown: {
        distance_km: 155,
        phytoncide_index: 80,
        pm25: 9,
        air_label: "쾌적",
        species: "소나무",
      },
      ai_reason:
        "편백보다는 낮지만 접근성이 좋아, 이동을 줄이고 싶을 때 균형 잡힌 대안입니다.",
      detail: {
        ai_personal_plan: [
          "솔숲 능선길을 활기차게 걸으며 풍경 즐기기",
          "전망 포인트에서 가족과 함께 멈춰 호흡하기",
        ],
        recommended_program: {
          title: "대관령 솔숲 트레킹 명상",
          is_example: true,
        },
        itinerary: {
          date: "2026-06-21",
          steps: [
            { time: "08:00", activity: "출발 (자가용)", place: "서울" },
            { time: "11:00", activity: "솔숲 트레킹", place: "대관령 치유의 숲" },
            { time: "13:00", activity: "점심 (예시)", place: "평창 인근 식당" },
            { time: "14:30", activity: "주변 관광 (예시)", place: "대관령 일대" },
          ],
        },
        ai_note: "접근성이 좋아 이동을 줄이고 싶을 때 균형 잡힌 대안입니다.",
      },
    },
  ],
  top_pick_detail: {
    forest_name: "축령산 편백 치유의 숲",
    ai_personal_plan: [
      "활력이 좋은 만큼 편백 숲길을 1~2시간 능동적으로 걸으며 깊게 호흡하기",
      "가족 동행이므로 함께 멈춰 향을 느끼는 지점을 정해 천천히 이동하기",
      "스트레스 해소가 목표이니 휴대폰을 끄고 숲에 집중하는 디지털 디톡스 시간 갖기",
    ],
    recommended_program: {
      title: "편백 숲길 걷기 명상",
      is_example: true,
    },
    itinerary: {
      date: "2026-06-21",
      steps: [
        { time: "08:00", activity: "출발 (자가용)", place: "서울" },
        {
          time: "11:30",
          activity: "편백 숲길 명상",
          place: "축령산 편백 치유의 숲",
        },
        {
          time: "13:30",
          activity: "점심 (예시)",
          place: "장성 인근 식당",
          link: "https://",
        },
        { time: "15:00", activity: "주변 관광 (예시)", place: "축령산 일대" },
      ],
    },
    nearby_food: [
      {
        name: "축령산 산채정식",
        category: "한정식",
        rating: 4.5,
        link: "https://",
      },
    ],
    ai_note:
      "피톤치드 잠재력은 국립산림과학원 연구(편백>소나무>낙엽송>잣, p<.01) 기반의 상대 지표이며, 오전 9~11시 방문을 권합니다.",
    cta: "이 처방을 저장하고, 방문 후 변화를 기록해 다음 숲 추천을 받아보세요.",
  },
  disclaimers: [
    "피톤치드 잠재력 지수는 절대 농도가 아닌 상대 지표입니다.",
    "미세먼지는 방문 1~2일 전 예보로 다시 확인하세요.",
  ],
};

/** user_type → 데모 처방 선택. */
export function pickDemoOutput(userType: string): PrescribeOutput {
  return userType === "explorer" ? EXPLORER_DEMO : COMFORT_DEMO;
}
