import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import {
  COMFORT_DEMO,
  COMFORT_INPUT_DEMO,
} from "../fixtures/prescription-demo";
import PrescribeResultPage from "../pages/prescribe-result-page";

// 컴포넌트는 loaderData 만 사용한다. RR7 ComponentProps 전체를 흉내내지 않도록
// loaderData 단일 prop 함수로 좁혀서 렌더한다(any 금지).
const Page = PrescribeResultPage as unknown as (props: {
  loaderData: {
    output: typeof COMFORT_DEMO;
    kpomsb: typeof COMFORT_INPUT_DEMO.kpomsb_pre;
    overlay: { label: string; date: string; goal: string };
  };
}) => React.ReactNode;

describe("처방 결과 페이지", () => {
  it("AI 상태해석·1위 숲·타임라인 스텝·출처 배지를 렌더한다", () => {
    const { container } = render(
      <MemoryRouter>
        <Page
          loaderData={{
            output: COMFORT_DEMO,
            kpomsb: COMFORT_INPUT_DEMO.kpomsb_pre,
            overlay: { label: "서울 강남구", date: "2026-06-20", goal: "수면" },
          }}
        />
      </MemoryRouter>,
    );

    const text = container.textContent ?? "";
    expect(text).toContain(COMFORT_DEMO.user_summary.ai_state_reading);
    expect(text).toContain("잣향기 푸른숲");
    expect(text).toContain("청량리역"); // 타임라인 스텝
    expect(text).toContain("오늘 이렇게 하세요"); // AI 맞춤 행동 섹션
    expect(text).toContain("이 숲의 강점"); // 피톤치드 막대 섹션
    expect(text).toContain("산음 치유의 숲"); // 2순위 요약 카드
  });
});
