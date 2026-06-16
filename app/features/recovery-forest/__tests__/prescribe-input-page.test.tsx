import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import PrescribeInputPage from "../pages/prescribe-input-page";

function renderPage() {
  return render(
    <MemoryRouter>
      <PrescribeInputPage />
    </MemoryRouter>,
  );
}

describe("처방 입력 — 스텝 플로우", () => {
  it("처음에는 첫 질문만 보이고 출발지 질문은 아직 보이지 않는다", () => {
    renderPage();
    expect(screen.getByText("오늘, 어떤 휴식이 필요하세요?")).toBeTruthy();
    expect(screen.queryByText("어디서 출발하세요?")).toBeNull();
  });

  it("진행 점은 전체 스텝 수(4)만큼 표시된다", () => {
    const { container } = renderPage();
    const dots = container.querySelectorAll("[data-step-dot]");
    expect(dots.length).toBe(4);
  });

  it("마음을 고르고 다음을 누르면 출발지 스텝으로 넘어간다", () => {
    renderPage();
    fireEvent.click(screen.getByText("많이 지쳐 있어요"));
    // 자동 전환하지 않음 — 주관식을 적을 수 있게. 첫 질문이 그대로 보인다.
    expect(screen.getByText("오늘, 어떤 휴식이 필요하세요?")).toBeTruthy();
    fireEvent.click(screen.getByText("천천히 다음으로"));
    expect(screen.getByText("어디서 출발하세요?")).toBeTruthy();
  });

  it("주관식 입력이 동작한다", () => {
    renderPage();
    const ta = screen.getByPlaceholderText(/요즘 잠이 얕고/);
    fireEvent.change(ta, { target: { value: "조용히 쉬고 싶어요" } });
    expect((ta as HTMLTextAreaElement).value).toBe("조용히 쉬고 싶어요");
  });

  it("뒤로 가기로 이전 스텝으로 돌아간다", () => {
    renderPage();
    fireEvent.click(screen.getByText("많이 지쳐 있어요"));
    fireEvent.click(screen.getByText("천천히 다음으로"));
    fireEvent.click(screen.getByText("이전"));
    expect(screen.getByText("오늘, 어떤 휴식이 필요하세요?")).toBeTruthy();
  });

  it("번호 접두사(①②③④)를 더 이상 쓰지 않는다", () => {
    const { container } = renderPage();
    const text = container.textContent ?? "";
    expect(text).not.toContain("①");
    expect(text).not.toContain("②");
  });
});
