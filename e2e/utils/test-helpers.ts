/**
 * E2E Test Helper Functions
 *
 * This file contains utility functions used across multiple E2E test files to:
 * 1. Validate form fields and error messages
 * 2. Create, login, and manage test users
 * 3. Handle email confirmation flows
 * 4. Clean up test data after tests
 *
 * These helpers ensure consistent testing patterns and reduce code duplication
 * across the test suite, making tests more maintainable and readable.
 */
import { type Page, expect } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import db from "~/core/db/drizzle-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";

/**
 * Check if a form field has validation errors
 *
 * This function verifies that a field is invalid and has a non-empty validation message.
 * It uses the browser's built-in form validation API to check validity and retrieve
 * the validation message, ensuring consistent validation testing across forms.
 *
 * @param page - The Playwright Page object
 * @param fieldId - The HTML id attribute of the input field to check
 */
export async function checkInvalidField(page: Page, fieldId: string) {
  // Check if the field is marked as invalid by the browser
  const isValid = await page.$eval(
    `#${fieldId}`,
    (el: HTMLInputElement) => el.validity.valid,
  );
  expect(isValid).toBe(false);

  // Verify that there is a non-empty validation message
  const message = await page.$eval(
    `#${fieldId}`,
    (el: HTMLInputElement) => el.validationMessage,
  );
  expect(message).not.toBe("");
}

/**
 * Create a test user (placeholder function)
 *
 * This is a placeholder for a potential helper function to create test users.
 * Currently not implemented, but kept as a stub for future expansion.
 *
 * @param page - The Playwright Page object
 */
export async function createTestUser(page: Page) {}

/**
 * Log in a user with email and password
 *
 * This function navigates to the login page, fills in the credentials,
 * submits the form, and waits for the login process to complete.
 *
 * The extended timeout (15 seconds) allows for server-side processing,
 * potential redirects, and session establishment to complete.
 *
 * @param page - The Playwright Page object
 * @param email - The email address of the user to log in
 * @param password - The password for the user account
 */
export async function loginUser(page: Page, email: string, password: string) {
  // Navigate to the login page
  await page.goto("/login");
  // Wait for page to load
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#email", { state: "visible" });
  // Fill in the email and password fields
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  // Click the login button (한국어 텍스트)
  await page.getByRole("button", { name: "로그인" }).click();
  // Wait for login process to complete (including potential redirects)
  await page.waitForTimeout(15000);
}

/**
 * Register a new user account
 *
 * This function navigates to the registration page, fills in all required fields,
 * opts into marketing emails, submits the form, and waits for the success message.
 *
 * The function automatically generates a name from the email address by using
 * the part before the @ symbol, which is useful for automated testing.
 *
 * @param page - The Playwright Page object
 * @param email - The email address for the new user
 * @param password - The password for the new user account
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
) {
  // Navigate to the registration page
  await page.goto("/join");
  // Wait for page to load completely
  await page.waitForLoadState("networkidle");
  // Wait for React to initialize - ensure the page is fully interactive
  await page.waitForSelector("#name", { state: "visible" });
  // Additional wait to ensure React components are fully mounted
  await page.waitForTimeout(1000);

  // Fill in the registration form
  await page.locator("#name").fill(email.split("@")[0]); // Use part before @ as name
  await page.locator("#username").fill(email.split("@")[0]); // Username field
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);

  // Select role (required field) - Radix UI Select 드롭다운 방식으로 선택
  // Wait for combobox to be ready and clickable
  const combobox = page.getByRole("combobox");
  await expect(combobox).toBeVisible({ timeout: 10000 });
  await expect(combobox).toBeEnabled({ timeout: 5000 });

  // Click to open the dropdown
  await combobox.click();

  // 드롭다운이 열릴 때까지 대기 (타임아웃 증가)
  await page.waitForSelector('[role="option"]', {
    state: "visible",
    timeout: 10000,
  });

  // 옵션 선택 (value="healthy"인 "비 암경험자")
  const option = page.getByRole("option", { name: "비 암경험자" });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();

  // 선택이 완료될 때까지 대기
  await page.waitForTimeout(500);

  // Opt into marketing emails (ID로 직접 찾기 - 더 안정적)
  await page.locator("#marketing").check();

  // Submit the registration form (한국어 텍스트)
  await page.getByRole("button", { name: "계정 생성 하기" }).click();

  // Wait for success message to confirm registration completed (한국어 텍스트)
  // AlertTitle의 텍스트를 직접 찾기
  await expect(page.getByText("계정 생성 완료!", { exact: true })).toBeVisible({
    timeout: 30000,
  });

  // 네트워크 요청이 완료될 때까지 대기
  await page.waitForLoadState("networkidle");
}

/**
 * Confirm a user's email address
 *
 * This function confirms a user's email address using Supabase Admin API.
 * It first tries to get the confirmation token from the database, but if that fails,
 * it uses the Admin API to directly confirm the user's email.
 *
 * This approach allows testing the email confirmation flow without actually
 * sending or intercepting emails, which simplifies the testing process.
 *
 * @param page - The Playwright Page object
 * @param email - The email address of the user to confirm
 */
export async function confirmUser(page: Page, email: string) {
  // First, try to get the user ID from the database
  const users = await db.execute<{
    id: string;
    email_confirmed_at: string | null;
  }>(sql`SELECT id, email_confirmed_at FROM auth.users WHERE email = ${email}`);

  if (!users || users.length === 0) {
    throw new Error(`User with email ${email} not found`);
  }

  const [{ id, email_confirmed_at }] = users;

  // If already confirmed, just navigate to home
  if (email_confirmed_at) {
    await page.goto("/");
    return;
  }

  // Try to get confirmation token from database first
  let confirmation_token: string | null = null;
  let retries = 5;

  while (retries > 0 && !confirmation_token) {
    const results = await db.execute<{
      confirmation_token: string | null;
    }>(sql`SELECT confirmation_token FROM auth.users WHERE email = ${email}`);

    if (results.length > 0 && results[0].confirmation_token) {
      confirmation_token = results[0].confirmation_token;
      break;
    }

    // Wait 1 second before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
    retries--;
  }

  // If token exists, use it (preferred method)
  if (confirmation_token) {
    await page.goto(
      `/auth/confirm?token_hash=${confirmation_token}&type=email&next=/&testid=316873`,
    );
    await page.waitForURL("/", { timeout: 10000 });
    return;
  }

  // If no token, use Admin API to confirm the user directly
  // This is a fallback when confirmation_token is not available in the database
  const { error } = await adminClient.auth.admin.updateUserById(id, {
    email_confirm: true,
  });

  if (error) {
    throw new Error(
      `Failed to confirm user ${email} using Admin API: ${error.message}`,
    );
  }

  // Navigate to home page after confirmation
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/**
 * Delete a test user from the database
 *
 * This function removes a user account from the database by email address.
 * It's used in test cleanup to ensure test data doesn't accumulate and
 * that tests can be run repeatedly without conflicts.
 *
 * The function uses Drizzle ORM to perform a direct database deletion,
 * bypassing the application's API for efficiency and reliability in tests.
 *
 * @param email - The email address of the user to delete
 */
export async function deleteUser(email: string) {
  await db.delete(authUsers).where(eq(authUsers.email, email));
}
