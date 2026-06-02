import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("should_show_hero_and_navigate_to_recommend", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("회복");
    await page.getByRole("link", { name: /오늘의 회복 숲 찾기/ }).click();
    await expect(page).toHaveURL(/\/recommend/);
  });
});
