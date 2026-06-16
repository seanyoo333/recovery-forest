import { dominantSpecies } from "./phytoncide-index";
import {
  airLabel,
  buildWhy,
  optimalTime,
  FALLBACK_PM25,
  type ForestScore,
  type UserType,
} from "./forest-ranking";
import type { KpomsbScores } from "../schemas/prescribe-input.schema";
import type {
  ForestDetail,
  PrescribeOutput,
  RankingItem,
} from "../schemas/prescribe-output.schema";

/**
 * 엔진 3축 랭킹(ForestScore[]) + 사용자 입력 → 화면 출력 스키마(PrescribeOutput).
 *
 * engine_* 필드(점수·거리·피톤치드·미세먼지·수종)는 엔진 계산값 그대로 싣는다.
 * ai_* 서술 필드는 Phase 1에서 규칙 기반 템플릿으로 채운다(Phase 3에서 LLM 으로 교체).
 * 엔진이 고른 숲·숫자는 절대 바꾸지 않는다.
 */

export type BuildArgs = {
  scored: ForestScore[];
  userType: UserType;
  healthGoal: string;
  visitDate: string;
  month: number;
  arrivalHour: number;
  note: string;
  kpomsb: KpomsbScores;
};

const PROGRAM_EXAMPLES: Record<string, string> = {
  수면: "수면 개선 이완·아로마 명상",
  스트레스: "긴장 완화 숲 호흡",
  피로: "피로 회복 숲 걷기",
  우울: "햇빛 노출 가벼운 숲 산책",
  면역: "사계절 숲 기운 회복",
};

const DISCLAIMERS = [
  "피톤치드 잠재력 지수는 절대 농도가 아닌 상대 지표입니다.",
  "미세먼지는 방문 1~2일 전 예보로 다시 확인하세요.",
  "입력하신 상태는 자가보고이며 의료 진단이 아닙니다.",
];

function pad2(h: number): string {
  return String(Math.max(0, Math.min(23, h))).padStart(2, "0");
}

/** K-POMS-B 패턴을 비진단 서술로(규칙 기반 임시 — Phase 3 LLM 교체 대상). */
function stateReading(k: KpomsbScores, note: string): string {
  const high: string[] = [];
  if (k.긴장 >= 8) high.push("긴장");
  if (k.피로 >= 8) high.push("피로");
  if (k.우울 >= 8) high.push("가라앉음");
  if (k.혼란 >= 8) high.push("주의 분산");
  if (k.분노 >= 8) high.push("예민함");
  const lowVitality = k.활력 <= 5;

  const empathy = note ? `“${note}”라고 하신 마음을 함께 살펴보면, ` : "";
  let body: string;
  if (high.length > 0) {
    body = `${high.join("·")}이 다소 높은 편${lowVitality ? "이고 활력은 낮은 편" : ""}으로 보입니다`;
  } else if (lowVitality) {
    body = "활력이 낮은 편으로, 가벼운 회복이 필요한 상태로 보입니다";
  } else {
    body = "전반적으로 안정적인 편으로, 예방·유지에 가까운 상태로 보입니다";
  }
  return `${empathy}${body}. (자가보고 기반이며 진단이 아닙니다)`;
}

function personalPlan(
  userType: UserType,
  healthGoal: string,
  species: string,
): string[] {
  if (userType === "comfort") {
    return [
      `도착 후 무리한 코스 대신 ${species} 그늘에서 20~30분 천천히 머무르며 호흡을 고르기`,
      `${healthGoal} 회복이 목표이니 한낮보다 오전 빛을 쬐며 짧게 걷기`,
      "일정에 쫓기지 말고 숲 소리에 집중하는 조용한 휴식 넣기",
    ];
  }
  return [
    `${species}림 숲길을 1~2시간 능동적으로 걸으며 향과 풍경을 충분히 느끼기`,
    "중간중간 멈춰 그늘·계곡 등 향이 짙은 지점에서 깊게 호흡하기",
    "휴대폰을 멀리하고 숲에 집중하는 디지털 디톡스 시간 갖기",
  ];
}

function itinerary(visitDate: string, arrivalHour: number, forestName: string) {
  return {
    date: visitDate,
    steps: [
      { time: `${pad2(arrivalHour - 1)}:30`, activity: "출발", place: "출발지" },
      { time: `${pad2(arrivalHour)}:00`, activity: "도착·숲 산책 시작", place: forestName },
      { time: `${pad2(arrivalHour + 1)}:00`, activity: "산림치유 프로그램", place: forestName },
      { time: `${pad2(arrivalHour + 2)}:30`, activity: "점심·휴식", place: "주변 식당" },
      { time: `${pad2(arrivalHour + 4)}:00`, activity: "귀가", place: "출발지" },
    ],
  };
}

function aiNote(species: string, month: number): string {
  return (
    `피톤치드 잠재력은 국립산림과학원 연구 기반의 상대 지표이며, ` +
    `${optimalTime(species, month)} 방문을 권합니다. ` +
    `미세먼지는 방문 1~2일 전 예보로 다시 확인하세요.`
  );
}

function cta(userType: UserType): string {
  return userType === "comfort"
    ? "이 처방을 저장하고, 방문 3일 후 변화 기록 알림을 받아보세요."
    : "이 처방을 저장하고, 방문 후 변화를 기록해 다음 숲 추천을 받아보세요.";
}

function detailFor(
  scoredForestName: string,
  userType: UserType,
  healthGoal: string,
  species: string,
  visitDate: string,
  month: number,
  arrivalHour: number,
): ForestDetail {
  return {
    ai_personal_plan: personalPlan(userType, healthGoal, species),
    recommended_program: {
      title: PROGRAM_EXAMPLES[healthGoal] ?? "산림치유 기본 프로그램",
      is_example: true,
    },
    itinerary: itinerary(visitDate, arrivalHour, scoredForestName),
    ai_note: aiNote(species, month),
  };
}

export function buildPrescribeOutput(args: BuildArgs): PrescribeOutput {
  const { scored, userType, healthGoal, visitDate, month, arrivalHour, note, kpomsb } =
    args;
  const top3 = scored.slice(0, 3);

  const ranking: RankingItem[] = top3.map((s, i) => {
    const species = dominantSpecies(s.forest.treeSpecies);
    const pm25 = s.forest.pm25 ?? FALLBACK_PM25;
    return {
      rank: i + 1,
      engine_score: s.total,
      forest_name: s.forest.name,
      engine_breakdown: {
        distance_km: s.components.distanceKm,
        phytoncide_index: s.components.phyto,
        pm25,
        air_label: airLabel(pm25),
        species,
      },
      ai_reason: buildWhy(s, userType),
      // 2·3위도 펼치면 1위처럼 일정을 본다. 1위는 top_pick_detail 사용.
      detail:
        i === 0
          ? undefined
          : detailFor(
              s.forest.name,
              userType,
              healthGoal,
              species,
              visitDate,
              month,
              arrivalHour,
            ),
    };
  });

  const top = top3[0];
  const topSpecies = dominantSpecies(top.forest.treeSpecies);

  return {
    session_id: `anon_${Date.now().toString(36)}`,
    generated_at: new Date().toISOString(),
    user_summary: {
      user_type: userType,
      health_goal: healthGoal,
      ai_state_reading: stateReading(kpomsb, note),
    },
    ranking,
    top_pick_detail: {
      forest_name: top.forest.name,
      ai_personal_plan: personalPlan(userType, healthGoal, topSpecies),
      recommended_program: {
        title: PROGRAM_EXAMPLES[healthGoal] ?? "산림치유 기본 프로그램",
        is_example: true,
      },
      itinerary: itinerary(visitDate, arrivalHour, top.forest.name),
      nearby_food: [],
      ai_note: aiNote(topSpecies, month),
      cta: cta(userType),
    },
    disclaimers: DISCLAIMERS,
  };
}
