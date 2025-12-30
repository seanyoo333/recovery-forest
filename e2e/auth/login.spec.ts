/**
 * User Login E2E Tests
 * 
 * This file contains end-to-end tests for the user login flow, including:
 * 1. UI validation for the login form
 * 2. Form validation for various input scenarios
 * 3. Error handling for invalid credentials
 * 4. Email confirmation flow for unverified accounts
 * 5. Successful login and redirection
 * 
 * The tests use Playwright for browser automation and interact with the database
 * directly to verify and manipulate test data.
 */

import { expect, test } from "@playwright/test";
import {
  checkInvalidField,
  confirmUser,
  deleteUser,
  loginUser,
  registerUser,
} from "e2e/utils/test-helpers";

/**
 * Test email for login flow
 * 
 * This email is used to create a test user for the login flow tests.
 * It must be set in the environment variables to run these tests.
 * Using an environment variable allows for different test emails in different environments.
 */
const TEST_EMAIL = process.env.LOGIN_TEST_USER_EMAIL;

// Ensure the test email is configured before running tests
if (!TEST_EMAIL) {
  throw new Error("LOGIN_TEST_USER_EMAIL must be set in .env");
}

/**
 * Test suite for the User Login UI components
 * 
 * These tests verify the UI elements, form validation, and navigation links
 * of the login form without completing the actual login flow.
 */
test.describe("User Login UI", () => {
  // Navigate to the login page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#email", { state: "visible" });
  });

  /**
   * Test that verifies all essential UI elements are present on the login form
   * 
   * Checks for:
   * - Page title
   * - Email input field
   * - Password input field
   */
  test("should display login form", async ({ page }) => {
    // CardTitle은 div로 렌더링되므로 data-slot 속성 또는 클래스를 이용해 찾기
    // 방법 1: data-slot 속성 사용 (가장 안정적)
    await expect(
      page.locator('[data-slot="card-title"]').filter({ hasText: "로그인" }),
    ).toBeVisible({ timeout: 10000 });
    
    // 방법 2: 또는 CardTitle의 클래스를 이용
    // await expect(
    //   page.locator(".text-2xl.font-semibold").filter({ hasText: "로그인" }),
    // ).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toBeVisible();
  });

  /**
   * Test that verifies all alternative login methods are displayed
   * 
   * This ensures that users have multiple authentication options beyond
   * the traditional email/password approach, including:
   * - Social logins (Google, GitHub, Kakao)
   * 
   * Note: OTP and Magic Link are currently disabled in the UI
   */
  test("should show alternative login methods", async ({ page }) => {
    // 실제 표시되는 소셜 로그인 버튼들만 확인
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with Github")).toBeVisible(); // 소문자 'h'
    await expect(page.getByText("Continue with Kakao")).toBeVisible();
    
    // OTP와 Magic Link는 현재 주석 처리되어 있으므로 테스트에서 제외
    // 만약 나중에 활성화되면 아래 주석을 해제하세요:
    // await expect(page.getByText("Continue with OTP")).toBeVisible();
    // await expect(page.getByText("Continue with Magic Link")).toBeVisible();
  });

  /**
   * Test that verifies the link to the forgot password page works correctly
   * 
   * This ensures users can easily navigate to the password recovery flow
   * if they've forgotten their password, improving the user experience
   */
  test("should have a link to forgot password page", async ({ page }) => {
    // 실제 한국어 텍스트로 수정
    const link = page.getByText("비밀번호 찾기", { exact: true });
    await expect(link).toBeVisible();
    
    // viewTransition을 고려한 네비게이션 대기
    await Promise.all([
      page.waitForURL("/auth/forgot-password/reset", { timeout: 10000 }),
      link.click(),
    ]);
    
    await expect(page).toHaveURL("/auth/forgot-password/reset");
  });

  /**
   * Test that verifies the link to the registration page works correctly
   * 
   * This ensures new users can easily navigate to the registration page
   * if they don't have an account yet, improving the user experience
   */
  test("should have a link to sign in page", async ({ page }) => {
    // 실제 한국어 텍스트로 수정
    await expect(
      page.getByText("계정이 없으신가요?", { exact: false }),
    ).toBeVisible();
    await page.getByTestId("form-signup-link").click();
    await expect(page).toHaveURL("/join");
  });

  /**
   * Test that verifies password length validation
   * 
   * Attempts to log in with a password that is too short
   * and verifies that the appropriate validation error appears
   */
  test("should show error for short password", async ({ page }) => {
    await page.locator("#email").fill("john.doe@example.com");
    await page.locator("#password").fill("short"); // Too short password
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(
      page.getByText("Password must be at least 8 characters long", {
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * Test that verifies form validation for empty fields
   * 
   * Attempts to submit the form without filling any fields
   * and verifies that appropriate validation errors appear for each field
   */
  test("should show error when submitting with empty fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "로그인" }).click();
    await checkInvalidField(page, "email");
    await checkInvalidField(page, "password");
  });

  /**
   * Test that verifies error handling for invalid credentials
   * 
   * Attempts to log in with an email that doesn't exist in the system
   * and verifies that the appropriate error message is displayed
   * 
   * Note: This test uses a deliberately non-existent email address
   */
  test("should show error for invalid credentials", async ({ page }) => {
    await page
      .locator("#email")
      .fill("thisuserdoesnotexist@seriouslyimsure.com"); // Non-existent email
    await page.locator("#password").fill("password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(
      page.getByText("Invalid login credentials", { exact: true }),
    ).toBeVisible();
  });
});

/**
 * Test suite for the complete User Login flow
 * 
 * These tests verify the end-to-end login process including:
 * - Email confirmation alerts for unverified accounts
 * - Resending confirmation emails
 * - Successful login and redirection after email confirmation
 * 
 * This suite uses .serial to ensure tests run in sequence and share state
 */
test.describe.serial("User Login Flow", () => {
  /**
   * Setup: Create an unconfirmed test user before running the test suite
   * 
   * This creates a user account without confirming the email address,
   * which is needed to test the email confirmation alert flow
   */
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      /*
       * Create a test user that is not confirmed to test the email confirmation alert
       */
      await registerUser(page, TEST_EMAIL, "password");
      
      // 성공 메시지가 완전히 표시될 때까지 대기
      await page.waitForSelector("text=계정 생성 완료!", { 
        state: "visible",
        timeout: 10000 
      });
      
      // 네트워크 요청이 완료될 때까지 대기
      await page.waitForLoadState("networkidle");
      
      // 서버 처리 시간 고려한 추가 대기
      await page.waitForTimeout(1000);
    } catch (error) {
      console.error("Failed to register test user:", error);
      // 에러 발생 시 스크린샷 저장 (디버깅용)
      await page.screenshot({ 
        path: `test-results/register-error-${Date.now()}.png`,
        fullPage: true 
      });
      throw error;
    } finally {
      // 컨텍스트를 안전하게 닫기
      await context.close();
    }
  });

  /**
   * Cleanup: Delete the test user after all tests are complete
   * 
   * This ensures that test data doesn't accumulate in the database
   * and that tests can be run repeatedly without conflicts
   */
  test.afterAll(async () => {
    /*
     * Delete the test user that was created in the beforeAll
     */
    await deleteUser(TEST_EMAIL);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // Wait for page to load
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#email", { state: "visible" });
  });

  /**
   * Test for the email confirmation alert flow
   * 
   * This test verifies that users with unconfirmed email addresses
   * are shown an appropriate alert and can resend the confirmation email
   */
  test("Email Confirmation Alert", async ({ page }) => {
    /**
     * Step 1: Verify the email confirmation alert appears
     * 
     * Attempt to log in with an unconfirmed email address and verify
     * that the appropriate alert message is displayed
     */
    await test.step("should show email confirmation alert when email is unverified", async () => {
      await page.locator("#email").fill(TEST_EMAIL);
      await page.locator("#password").fill("password");
      await page.getByRole("button", { name: "로그인" }).click();
      
      // Verify the alert appears with an extended timeout
      // This allows time for the server to process the login attempt
      // 실제 한국어 텍스트로 수정
      await expect(
        page.getByText("이메일 인증이 필요합니다.", {
          exact: true,
        }),
      ).toBeVisible({
        timeout: 10000, // Extended timeout for server processing
      });
    });

    /**
     * Step 2: Verify the resend confirmation email functionality
     * 
     * Click the resend button and verify that the loading spinner appears,
     * indicating that the system is processing the request
     */
    await test.step("should be able to resend confirmation email", async () => {
      // 실제 한국어 텍스트로 수정
      await page.getByText("이메일 인증 메일 재발송").click();
      await expect(
        page.getByTestId("resend-confirmation-email-spinner"),
      ).toBeVisible();
    });
  });

  /**
   * Test for successful login after email confirmation
   * 
   * This test verifies that users can successfully log in after confirming
   * their email address and are redirected to the home page
   */
  test("should redirect to homepage after successful login", async ({
    page,
  }) => {
    // Confirm the test user's email address
    await confirmUser(page, TEST_EMAIL);
    
    /*
     * When the email of the user is confirmed for the first time it will automatically be logged in.
     * This is why we need to log out first so we can test the login flow after the email is confirmed.
     */
    await page.goto("/logout");
    
    // Log in with the confirmed user
    await loginUser(page, TEST_EMAIL, "password");
    
    // Verify successful login by checking redirect to home page
    await expect(page).toHaveURL("/");
  });
});
