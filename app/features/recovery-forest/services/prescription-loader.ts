import { makeRecoveryServerClient } from "~/lib/supabase.server";

import {
  COMFORT_INPUT_DEMO,
  EXPLORER_INPUT_DEMO,
  pickDemoOutput,
} from "../fixtures/prescription-demo";
import type { KpomsbScores, UserType } from "../schemas/prescribe-input.schema";
import type { PrescribeOutput } from "../schemas/prescribe-output.schema";
import { generatePrescriptionNarrative } from "./ai-prescription.service";
import { enrichForests } from "./forest-enrich.service";
import { optimalTime, rankForests } from "./forest-ranking";
import { loadRankableForests } from "./healing-forest.repository";
import { applyNarrative, buildPrescribeOutput } from "./prescribe-output.builder";

/**
 * 처방 결과 데이터 — 결과 화면과 여행 일정표 화면이 공유한다.
 * 동일 쿼리 파라미터로 같은 처방을 결정적으로 재생성하므로 저장 불필요.
 */
export type PrescriptionData = {
  output: PrescribeOutput;
  kpomsb: KpomsbScores;
  overlay: { label: string; date: string; goal: string; note: string };
};

function parseKpomsb(raw: string | null): KpomsbScores | null {
  if (!raw) return null;
  const p = raw.split(",").map(Number);
  if (p.length !== 6 || p.some((n) => !Number.isFinite(n))) return null;
  // 순서: 긴장,우울,분노,활력,피로,혼란 (입력 submit 과 동일)
  return { 긴장: p[0], 우울: p[1], 분노: p[2], 활력: p[3], 피로: p[4], 혼란: p[5] };
}

function monthFromDate(date: string): number {
  const t = Date.parse(date);
  return Number.isNaN(t) ? new Date().getMonth() + 1 : new Date(t).getMonth() + 1;
}

export async function loadPrescription(request: Request): Promise<PrescriptionData> {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const userType: UserType =
    sp.get("user_type") === "explorer" ? "explorer" : "comfort";
  const goal = sp.get("health_goal") ?? "일반";
  const label = sp.get("loc_label") ?? "";
  const date = sp.get("visit_date") ?? "";
  const note = (sp.get("note") ?? "").trim();
  const lat = Number(sp.get("loc_lat"));
  const lon = Number(sp.get("loc_lon"));
  const arrivalHour = Number(sp.get("arrival_hour")) || 10;
  const fallbackInput =
    userType === "explorer" ? EXPLORER_INPUT_DEMO : COMFORT_INPUT_DEMO;
  const kpomsb = parseKpomsb(sp.get("kpomsb")) ?? fallbackInput.kpomsb_pre;
  const month = monthFromDate(date);

  // 실제 엔진 경로: 좌표가 있으면 healing_forests 38개로 3축 랭킹 후 화면 스키마로 매핑.
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) {
    try {
      const [client] = makeRecoveryServerClient(request);
      const forests = await loadRankableForests(client);
      if (forests.length > 0) {
        // 실시간/예보 미세먼지·기상 주입(실패해도 폴백 상수로 graceful degrade).
        const enriched = await enrichForests(forests, date, arrivalHour).catch(
          () => forests,
        );
        const scored = rankForests({
          user: { lat, lon },
          userType,
          forests: enriched,
          month,
          hour: arrivalHour,
        });
        const output = buildPrescribeOutput({
          scored,
          userType,
          healthGoal: goal,
          visitDate: date,
          month,
          arrivalHour,
          note,
          kpomsb,
        });

        // AI 서술(LLM): 1순위 개인화 문구를 덮어쓴다. 실패/키없음이면 규칙 템플릿 유지.
        const top = output.ranking[0];
        const narrative = await generatePrescriptionNarrative({
          user: {
            user_type: userType,
            health_goal: goal,
            free_text: note,
            kpomsb_pre: kpomsb,
          },
          engine_pick: {
            name: top.forest_name,
            score: top.engine_score,
            phytoncide_index: top.engine_breakdown.phytoncide_index,
            distance_km: top.engine_breakdown.distance_km,
            pm25: top.engine_breakdown.pm25,
            air_label: top.engine_breakdown.air_label,
            species: top.engine_breakdown.species,
            visit_time_tip: optimalTime(top.engine_breakdown.species, month),
          },
        });
        if (narrative) applyNarrative(output, narrative);

        return { output, kpomsb, overlay: { label, date, goal, note } };
      }
    } catch {
      // env 미설정·DB 오류 시 픽스처로 폴백(데모 안전).
    }
  }

  // 폴백: 좌표 없거나 데이터 로드 실패 → 픽스처 데모.
  const output = pickDemoOutput(userType);
  return {
    output,
    kpomsb,
    overlay: {
      label: label || fallbackInput.location.label || "",
      date: date || fallbackInput.visit_plan.date,
      goal: goal || output.user_summary.health_goal,
      note,
    },
  };
}
