/**
 * Edit Profile E2E Tests
 *
 * This file contains end-to-end tests for the profile editing functionality, including:
 * 1. Name update
 * 2. Avatar image upload and storage
 * 3. Database verification of profile changes
 *
 * The tests verify that users can update their profile information and that
 * these changes are correctly persisted in the database and reflected in the UI.
 *
 * The tests use Playwright for browser automation and directly query
 * the database to verify data persistence. They also interact with
 * Supabase storage for avatar image handling.
 *
 * Note: Marketing consent is not editable on the profile settings page,
 * so it is not tested in this suite.
 */
import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import {
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

import db from "~/core/db/drizzle-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import { profiles } from "~/features/users/schema";

/**
 * Test email for profile editing flow
 *
 * This email is used to create a test user for the profile editing tests.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments
 * and prevents hardcoding sensitive information in the test files.
 */
const TEST_EMAIL = process.env.EDIT_PROFILE_TEST_USER_EMAIL!;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("EDIT_PROFILE_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the profile editing functionality
 *
 * This suite tests the complete profile editing flow, including
 * updating personal information, toggling preferences, and uploading an avatar.
 */
test.describe("Edit Profile", () => {
  /**
   * User ID variable to store the test user's ID for cleanup
   * This is needed to remove the avatar from storage after tests
   */
  let userId: string;

  /**
   * Setup: Create and confirm a test user before running the test suite
   *
   * This creates a user account that will be used to test the profile editing features.
   * The user is confirmed to ensure they have full account access.
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerUser(page, TEST_EMAIL, "password");
    await confirmUser(page, TEST_EMAIL);
    await context.close();
  });

  /**
   * Cleanup: Delete the test user and their avatar after all tests are complete
   *
   * This ensures that test data doesn't accumulate in the database or storage.
   * The avatar is explicitly removed from Supabase storage to prevent orphaned files.
   */
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
    await adminClient.storage.from("avatars").remove([userId]);
  });

  /**
   * Comprehensive test for the complete profile editing flow
   *
   * This test verifies the entire profile editing process including:
   * - Updating the display name
   * - Uploading an avatar image
   * - Verifying changes in both the UI and database
   */
  test("should update name, avatar and verify in DB", async ({ page }) => {
    // Define test constants
    const NEW_NAME = "Avatar Updated";
    const IMAGE_PATH = "e2e/assets/avatar-test.jpg";

    // Get the user ID from the database for later verification and cleanup
    const [{ id }] = await db.execute<{ id: string }>(
      sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL}`,
    );
    userId = id;

    // Log in with the test user account
    await loginUser(page, TEST_EMAIL, "password");
    // Navigate to the profile settings page
    await page.goto("/my/profile/settings");
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#name", { state: "visible", timeout: 10000 });

    /**
     * Step 1: Update name field and submit the form
     *
     * This step changes the display name and submits the form.
     * It then verifies that the success message appears.
     */
    await test.step("submit form with updated name", async () => {
      // Update the display name
      await page.locator("#name").fill(NEW_NAME);
      // Submit the form (한국어 텍스트)
      await page.getByRole("button", { name: "프로필 수정" }).click();
      // Wait for success message (한국어 텍스트)
      await expect(
        page.getByText("프로필이 성공적으로 업데이트되었습니다."),
      ).toBeVisible({ timeout: 10000 });
    });

    /**
     * Step 2: Upload avatar image
     *
     * This step uploads a new avatar image using the file selection button.
     * The avatar input is hidden, so we need to click the "파일 선택" button first.
     */
    await test.step("upload avatar image", async () => {
      // Wait for the avatar form to be visible
      await page.waitForSelector('input[name="avatar"]', { state: "attached" });
      // Set the file input directly (Playwright can set files on hidden inputs)
      await page.setInputFiles('input[name="avatar"]', IMAGE_PATH);
      // Submit the avatar form
      await page.getByRole("button", { name: "아바타 수정" }).click();
      // Wait for success message
      await expect(
        page.getByText("아바타가 성공적으로 업데이트 되었습니다."),
      ).toBeVisible({ timeout: 10000 });
    });

    /**
     * Step 3: Verify the avatar image is updated in the UI
     *
     * This step reloads the page and checks that the avatar image
     * is visible and that its source URL points to the Supabase storage.
     * This verifies that the image was successfully uploaded and is being displayed.
     */
    await test.step("verify avatar image preview is updated", async () => {
      // Reload the page to ensure we're seeing the latest data
      await page.reload();
      await page.waitForLoadState("networkidle");
      // Wait for the avatar container to be visible
      await page.waitForSelector(".size-40.overflow-hidden.rounded-full", {
        state: "visible",
        timeout: 10000,
      });
      // Locate the avatar image element inside the avatar container
      const avatarImage = page
        .locator(".size-40.overflow-hidden.rounded-full img")
        .first();
      // Verify the image is visible
      await expect(avatarImage).toBeVisible({ timeout: 10000 });
      // Get the image source URL
      const src = await avatarImage.getAttribute("src");
      // Verify the URL points to Supabase storage
      expect(src).toMatch(/avatars/);
    });

    /**
     * Step 4: Verify profile data was correctly saved to the database
     *
     * This step directly queries the database to confirm that all profile changes
     * (name, avatar URL) were correctly persisted.
     * Note: marketing_consent is not editable on this page, so we don't test it.
     */
    await test.step("verify profile data was saved to database", async () => {
      // Get the user ID from the database
      const [{ id }] = await db.execute<{ id: string }>(
        sql`SELECT id FROM auth.users WHERE email = ${TEST_EMAIL}`,
      );
      // Query the profiles table for the user's profile
      const results = await db
        .select()
        .from(profiles)
        .where(eq(profiles.profile_id, id));

      // Verify that exactly one profile was found
      expect(results.length).toBe(1);

      // Extract the profile data
      const profile = results[0];
      // Verify the name was updated
      expect(profile.name).toBe(NEW_NAME);
      // Verify the avatar URL is a valid URL
      expect(profile.avatar).toMatch(/^https?:\/\//);
    });
  });
});
