import { Link } from "react-router";

import type { Route } from "./+types/landing-page";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "회복의 숲 — 오늘 내 몸에 맞는 숲을 찾다" },
    {
      name: "description",
      content:
        "산림 공공데이터와 AI가 오늘의 미세먼지·기상·체력을 분석해 맞춤 숲을 추천합니다.",
    },
  ];
}

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm text-emerald-700">
          산림청 공공데이터 + AI
        </span>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          오늘 내 몸에 맞는
          <br />
          회복의 숲을 찾다
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-gray-600">
          지금의 마음과 출발지만 알려주시면, AI가 상태를 헤아리고 산림
          공공데이터로 오늘 가장 알맞은 치유의 숲을 골라드립니다.
        </p>
        <Link
          to="/prescribe"
          className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-600 px-10 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700 hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          오늘의 회복 숲 찾기
        </Link>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FlowStep
          step="1"
          title="마음 헤아리기"
          body="지금 마음·출발지·날짜를 한 번에 하나씩, 1분이면 충분합니다."
        />
        <FlowStep
          step="2"
          title="데이터 분석"
          body="AI가 기분 상태를 해석하고, 거리·피톤치드·미세먼지 3축 엔진이 숲을 계산합니다."
        />
        <FlowStep
          step="3"
          title="맞춤 숲 처방"
          body="가장 알맞은 숲과 방문 동선·AI 실천 계획을 받습니다."
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-sm font-semibold text-gray-500">데이터 출처</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700 md:grid-cols-3">
          <li>산림청 치유의숲 38곳</li>
          <li>에어코리아 실시간 미세먼지</li>
          <li>기상청 단기예보</li>
          <li>국립산림과학원 피톤치드 연구</li>
          <li>K-POMS-B 기분 척도</li>
          <li>카카오 지오코딩 좌표</li>
        </ul>
      </section>

      <footer className="text-center text-sm text-gray-500">
        <p>회복의 숲은 의료 진단·처방을 제공하지 않습니다.</p>
        <p className="mt-1">
          Developed by Evidence Base · Field Validation Partner: 한국통합치유협동조합
        </p>
      </footer>
    </main>
  );
}

function FlowStep({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5">
      <span className="text-sm font-semibold text-emerald-600">STEP {step}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  );
}
