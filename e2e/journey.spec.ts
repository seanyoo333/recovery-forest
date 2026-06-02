import { expect, test } from "@playwright/test";

/**
 * Evidence Engine 여정 happy path (동의 → 사전 → 처방 → 사후 → 리포트).
 *
 * 마이그레이션이 적용된 Supabase + PRESCRIPTION_MODE=stub 가 필요하다.
 * DB 없이 도는 CI 에서 실패하지 않도록 E2E_DB=1 일 때만 실행한다.
 */
const dbReady = !!process.env.E2E_DB;

test.describe("evidence engine journey", () => {
  test.skip(!dbReady, "needs a migrated Supabase (set E2E_DB=1)");

  test("should_close_loop_from_consent_to_report", async ({ page }) => {
    await page.goto("/journey/start");

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /동의하고 시작하기/ }).click();

    await expect(page).toHaveURL(/\/journey\/.+\/pre-survey/);
    await page.getByPlaceholder("시·도 (예: 서울)").fill("서울");
    await page.getByPlaceholder("시·군·구 (예: 강북구)").fill("강북구");
    await page.getByRole("button", { name: "스트레스 완화" }).click();
    await page.getByText("보통", { exact: true }).click();
    await page.getByText("60분", { exact: true }).click();
    await page.getByText("산책", { exact: true }).click();
    await page.getByRole("button", { name: /처방 받기/ }).click();

    await expect(page).toHaveURL(/\/journey\/.+\/prescription/);
    await expect(
      page.getByText(/나의 산림치유 처방전/),
    ).toBeVisible();
    await page.getByRole("link", { name: /사후 자가보고 하기/ }).click();

    await expect(page).toHaveURL(/\/journey\/.+\/post-survey/);
    await page.getByRole("button", { name: /변화 리포트 받기/ }).click();

    await expect(page).toHaveURL(/\/journey\/.+\/report/);
    await expect(
      page.getByRole("heading", { name: /방문 전후/ }),
    ).toBeVisible();
  });
});
