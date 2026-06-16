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

  it("마음 카드를 고르면 다음 스텝(출발지)으로 부드럽게 넘어간다", () => {
    renderPage();
    fireEvent.click(screen.getByText("많이 지쳐 있어요"));
    expect(screen.getByText("어디서 출발하세요?")).toBeTruthy();
    expect(screen.queryByText("오늘, 어떤 휴식이 필요하세요?")).toBeNull();
  });

  it("뒤로 가기로 이전 스텝으로 돌아간다", () => {
    renderPage();
    fireEvent.click(screen.getByText("많이 지쳐 있어요"));
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
