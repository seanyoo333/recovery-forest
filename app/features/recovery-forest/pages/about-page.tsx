import type { Route } from "./+types/about-page";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "서비스 소개 · 회복의 숲" }];
}

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">회복의 숲 소개</h1>
        <p className="text-gray-600">
          오늘 내 몸 상태와 환경 데이터를 읽고, 회복에 필요한 자연 자원을
          매칭하는 산림복지 서비스입니다.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">우리가 푸는 문제</h2>
        <p className="leading-relaxed text-gray-700">
          전국에 치유의숲·자연휴양림·도시숲·둘레길이 흩어져 있지만,
          "오늘 내 상태에 맞는 숲"을 찾는 방법은 없습니다. 회복의 숲은
          공공데이터와 AI로 그 매칭을 자동화합니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">사용 데이터</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>산림청 치유의숲 정보</li>
          <li>산림청 둘레길 정보</li>
          <li>산림청 자연휴양림 / 도시숲 정보</li>
          <li>기상청 단기예보 (온도·습도·풍속)</li>
          <li>에어코리아 실시간 미세먼지</li>
          <li>4곳 치유의숲 피톤치드 실측 데이터 기반 전국 예측 모델</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">팀</h2>
        <p className="text-gray-700">
          개발: 에비던스 베이스 주식회사 · AI 데이터 기반 건강관리 플랫폼
        </p>
        <p className="text-gray-700">
          현장 실증 파트너: 한국통합치유협동조합 · 산림치유 프로그램 운영
        </p>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        본 서비스는 의료 진단·처방을 제공하지 않습니다. 건강 상태에 의문이
        있으시면 의료진과 상담하시기를 권장합니다.
      </section>
    </main>
  );
}
