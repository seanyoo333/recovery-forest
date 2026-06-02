import { Link } from "react-router";

import type { Route } from "./+types/forest-detail-page";

import { makeRecoveryServerClient } from "~/lib/supabase.server";

import { FOREST_TYPE_LABELS } from "../schemas/recommendation.schema";
import {
  getForestById,
  getProgramsByForestId,
} from "../services/forest.repository";

export function meta({ data }: Route.MetaArgs) {
  const forest = (data as LoaderData | undefined)?.forest;
  const name = forest?.name ?? "산림치유 공간";
  return [{ title: `${name} · 회복의 숲` }];
}

type LoaderData = {
  forest: Awaited<ReturnType<typeof getForestById>>;
  programs: Awaited<ReturnType<typeof getProgramsByForestId>>;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const forestId = params.forestId;
  if (!forestId) {
    throw new Response("forest id missing", { status: 400 });
  }
  const [client, headers] = makeRecoveryServerClient(request);
  const forest = await getForestById(client, forestId);
  if (!forest) {
    throw new Response("forest not found", { status: 404 });
  }
  const programs = await getProgramsByForestId(client, forestId);
  const payload: LoaderData = { forest, programs };
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(headers.entries()),
    },
  });
}

export default function ForestDetailPage({ loaderData }: Route.ComponentProps) {
  const { forest, programs } = loaderData as unknown as LoaderData;
  if (!forest) return null;

  const mapUrl = `https://map.naver.com/p?lng=${forest.longitude}&lat=${forest.latitude}&zoom=14&searchType=address`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
          {FOREST_TYPE_LABELS[forest.type]}
        </span>
        <h1 className="text-3xl font-bold">{forest.name}</h1>
        <p className="text-gray-600">{forest.region}</p>
      </header>

      {forest.image_url ? (
        <img
          src={forest.image_url}
          alt={forest.name}
          className="aspect-video w-full rounded-2xl object-cover"
        />
      ) : null}

      {forest.description ? (
        <section className="leading-relaxed text-gray-800">{forest.description}</section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <InfoBox label="수종">
          {forest.tree_species.length > 0 ? forest.tree_species.join(", ") : "정보 없음"}
        </InfoBox>
        <InfoBox label="고도">
          {forest.altitude_m ? `${forest.altitude_m} m` : "정보 없음"}
        </InfoBox>
        <InfoBox label="면적">
          {forest.area_ha ? `${forest.area_ha} ha` : "정보 없음"}
        </InfoBox>
        <InfoBox label="트레일 길이/난이도">
          {forest.trail_length_km ? `${forest.trail_length_km} km` : "정보 없음"}
          {forest.trail_difficulty ? ` · ${forest.trail_difficulty}` : ""}
        </InfoBox>
        <InfoBox label="평균 운동강도">
          {forest.exercise_intensity_met
            ? `${forest.exercise_intensity_met} METs`
            : "정보 없음"}
        </InfoBox>
        <InfoBox label="예상 피톤치드 baseline">
          {forest.baseline_phytoncide_pptv
            ? `${Math.round(forest.baseline_phytoncide_pptv)} pptv`
            : "정보 없음"}
        </InfoBox>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">접근성</h2>
        <p className="mt-2 text-gray-700">
          접근성 점수 {forest.accessibility_score ?? "—"} / 100
        </p>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-10 items-center rounded-full border border-gray-300 px-4 text-sm"
        >
          네이버 지도에서 보기
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">연계 산림치유 프로그램</h2>
        {programs.length === 0 ? (
          <p className="text-gray-500">연계 프로그램 정보가 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {programs.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <h3 className="font-semibold">{p.name}</h3>
                {p.target_group ? (
                  <p className="text-sm text-gray-600">대상: {p.target_group}</p>
                ) : null}
                {p.schedule_text ? (
                  <p className="text-sm text-gray-600">일정: {p.schedule_text}</p>
                ) : null}
                {p.duration_min ? (
                  <p className="text-sm text-gray-600">
                    소요 시간: {p.duration_min}분
                  </p>
                ) : null}
                {p.description ? (
                  <p className="mt-2 text-sm text-gray-700">{p.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        to="/recommend"
        className="inline-flex h-12 items-center justify-center self-start rounded-full border border-emerald-600 px-6 text-emerald-700"
      >
        다시 추천 받기
      </Link>

      {forest.source_url ? (
        <footer className="text-xs text-gray-500">
          데이터 출처: <a href={forest.source_url} className="underline">{forest.source_url}</a>
        </footer>
      ) : null}
    </main>
  );
}

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{children}</p>
    </div>
  );
}
