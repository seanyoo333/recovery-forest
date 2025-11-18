/**
 * Contact Form Page with CAPTCHA Integration
 *
 * This module implements a contact form with Turnstile CAPTCHA protection.
 * Turnstile is Cloudflare's privacy-focused CAPTCHA alternative that provides
 * bot protection without requiring user interaction in most cases.
 *
 * The form includes:
 * - Basic contact information fields (name, email, message)
 * - Server-side validation using Zod schemas
 * - CAPTCHA verification with Turnstile
 * - Email sending via Resend API
 * - Form state management and user feedback
 *
 * This implementation demonstrates how to implement robust form protection
 * and validation in a production application.
 */
import type { Route } from "./+types/contact-us";

import { useEffect, useRef, useState } from "react";
import { Form, data } from "react-router";
import Turnstile, { useTurnstile } from "react-turnstile";
import { toast } from "sonner";
import { z } from "zod";

import FormButton from "~/core/components/form-button";
import FormErrors from "~/core/components/form-error";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import resendClient from "~/core/lib/resend-client.server";

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the Contact Us page,
 * using the application name from environment variables.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Contact Us | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Validates a Turnstile CAPTCHA token with Cloudflare's API
 *
 * This function sends the token received from the client-side Turnstile widget
 * to Cloudflare's verification endpoint to confirm that the user successfully
 * completed the CAPTCHA challenge.
 *
 * The verification process:
 * 1. Sends the token and secret key to Cloudflare's verification endpoint
 * 2. Parses the JSON response to determine if the token is valid
 * 3. Returns a boolean indicating success or failure
 * 4. Handles errors gracefully, logging them and returning false
 *
 * @param token - The token received from the client-side Turnstile widget
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
async function isTurnstileTokenValid(token: string) {
  try {
    // Cloudflare's verification endpoint
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    // Send verification request to Cloudflare
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Parse response and return success status
    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    // Log error and return false on failure
    console.error(error);
    return false;
  }
}

/**
 * Validation schema for contact form submissions
 *
 * This schema defines the required fields and validation rules for the contact form:
 * - name: Required, must be at least 1 character
 * - email: Required, must be a valid email format
 * - message: Required, must be at least 1 character
 * - turnstile: Required, must contain a valid Turnstile token
 *
 * The schema is used with Zod's safeParse method to validate form submissions
 * before processing them further.
 */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  turnstile: z.string().min(1),
});

/**
 * Action handler for processing contact form submissions
 *
 * This function processes form submissions from the contact page. It follows these steps:
 * 1. Extracts and validates form data using the Zod schema
 * 2. Verifies the Turnstile CAPTCHA token with Cloudflare's API
 * 3. Sends an email to the admin with the contact information
 * 4. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates all form fields to prevent invalid data
 * - Verifies CAPTCHA token to prevent spam and automated submissions
 * - Uses server-side validation to prevent client-side bypass
 * - Handles errors gracefully with appropriate status codes
 *
 * @param request - The incoming HTTP request with form data
 * @returns JSON response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Extract form data from the request
  const formData = await request.formData();

  // Validate form data using the Zod schema
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    // Return validation errors if the form data is invalid
    return data(
      { fieldErrors: result.error.flatten().fieldErrors, success: false },
      { status: 400 },
    );
  }

  // Extract validated data
  const { name, email, message, turnstile } = result.data;

  // Verify Turnstile CAPTCHA token
  const validTurnstile = await isTurnstileTokenValid(turnstile);

  // Return error if CAPTCHA verification fails
  if (!validTurnstile) {
    return data(
      {
        errors: {
          turnstile: ["Invalid captcha, please try again"],
        },
        success: false,
      },
      { status: 400 },
    );
  }

  // Send email to admin with contact information
  const { error } = await resendClient.emails.send({
    from: "Supaplate <hello@supaplate.com>",
    to: [process.env.ADMIN_EMAIL!],
    subject: "New contact from Supaplate",
    html: `
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b> ${message}</p>
    `,
  });

  // Handle email sending errors
  if (error) {
    return data({ error, success: false }, { status: 500 });
  }

  // Return success response
  return {
    success: true,
    error: null,
  };
}

/**
 * Contact Us Form Component
 *
 * This component renders a contact form with Turnstile CAPTCHA protection.
 * It manages form state, CAPTCHA tokens, and provides user feedback
 * based on the form submission results.
 *
 * @param actionData - Data returned from the action function after form submission
 */
export default function ContactUs({ actionData }: Route.ComponentProps) {
  // State for storing CAPTCHA token
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // State to control when to render CAPTCHA widget (prevents SSR issues)
  const [renderCaptcha, setRenderCaptcha] = useState<boolean>(false);

  // References to interact with CAPTCHA widget and form
  const turnstile = useTurnstile(); // Hook for Turnstile widget interactions
  const formRef = useRef<HTMLFormElement>(null); // Reference to the form element
  const isMountedRef = useRef<boolean>(true); // Track if component is mounted

  // Get sitekey from environment variables
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Check if sitekey is valid
  const hasValidSiteKey = Boolean(
    turnstileSiteKey && turnstileSiteKey.trim() !== "",
  );

  // Debug: Log sitekey status (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("=== Turnstile Debug Info ===");
      console.log("Site Key exists:", !!turnstileSiteKey);
      console.log(
        "Site Key value:",
        turnstileSiteKey
          ? `${turnstileSiteKey.substring(0, 10)}...`
          : "undefined",
      );
      console.log("Has valid site key:", hasValidSiteKey);
      console.log("Render captcha:", renderCaptcha);
      console.log("Is mounted:", isMountedRef.current);
      console.log("Turnstile token:", turnstileToken ? "exists" : "empty");
      console.log("===========================");
    }
  }, [turnstileSiteKey, hasValidSiteKey, renderCaptcha, turnstileToken]);

  /**
   * Effect for handling form submission results
   *
   * This effect runs whenever actionData changes (after form submission).
   * It handles:
   * 1. Resetting the CAPTCHA widget
   * 2. Clearing CAPTCHA token
   * 3. Showing success or error messages
   * 4. Resetting the form on successful submission
   */
  useEffect(() => {
    if (!actionData || !isMountedRef.current) return;

    // Reset CAPTCHA widget and token safely
    try {
      if (turnstile && typeof turnstile.reset === "function") {
        turnstile.reset();
      }
    } catch (error) {
      // Ignore errors if Turnstile is not available
      console.debug("Turnstile reset error:", error);
    }

    if (isMountedRef.current) {
      setTurnstileToken("");
    }

    // Handle successful submission
    if (actionData?.success && isMountedRef.current) {
      // Show success message
      toast.success("Email sent successfully");

      // Reset form and remove focus from inputs
      if (formRef.current) {
        formRef.current.reset();
        formRef.current.querySelectorAll("input").forEach((input) => {
          input.blur();
        });
      }
    }
    // Handle error in submission
    else if (
      "error" in actionData &&
      actionData.error &&
      isMountedRef.current
    ) {
      toast.error(actionData.error.message);
    }
  }, [actionData, turnstile]);

  /**
   * Effect for cleaning up CAPTCHA widget on unmount
   *
   * This effect runs when the component unmounts and ensures
   * that the CAPTCHA widget is properly cleaned up to prevent
   * errors when navigating away from the page.
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Mark component as unmounted first to prevent any callbacks
      isMountedRef.current = false;

      // Prevent CAPTCHA widget from rendering during unmount
      setRenderCaptcha(false);

      // Cleanup function: reset token when component unmounts
      setTurnstileToken("");
    };
  }, []);

  /**
   * Effect for delayed rendering of CAPTCHA widget
   *
   * This effect runs once on component mount and enables CAPTCHA rendering.
   * The delayed rendering prevents hydration mismatches and other SSR issues
   * that can occur with third-party CAPTCHA widgets.
   */
  useEffect(() => {
    if (isMountedRef.current) {
      setRenderCaptcha(true);
    }

    return () => {
      // Ensure CAPTCHA widget is not rendered during unmount
      setRenderCaptcha(false);
    };
  }, []);
  /**
   * Render the contact form with Turnstile CAPTCHA protection
   *
   * The component renders:
   * 1. A header section with title and description
   * 2. A form with name, email, and message fields
   * 3. A Turnstile CAPTCHA widget
   * 4. A submit button that is disabled until the CAPTCHA is verified
   * 5. Error messages for field validation and CAPTCHA verification
   */
  return (
    <div className="flex flex-col items-center gap-20">
      {/* Header section */}
      <div>
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          문의하기
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          문의하신 내용을 바탕으로 최대한 빠르게 답변드리겠습니다.
        </p>
      </div>

      {/* Contact form */}
      <Form
        method="post"
        ref={formRef}
        className="flex w-full max-w-2xl flex-col gap-5"
      >
        {/* Name field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="name" className="flex flex-col items-start gap-1">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            required
            type="text"
            placeholder="이름을 입력해주세요."
          />
          {/* Display name field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.name ? (
            <FormErrors errors={actionData.fieldErrors.name} />
          ) : null}
        </div>

        {/* Email field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="email" className="flex flex-col items-start gap-1">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            required
            type="email"
            placeholder="이메일을 입력해주세요."
          />
          {/* Display email field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.email ? (
            <FormErrors errors={actionData.fieldErrors.email} />
          ) : null}
        </div>

        {/* Message field */}
        <div className="flex flex-col items-start space-y-2">
          <Label htmlFor="message" className="flex flex-col items-start gap-1">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            required
            placeholder="문의하실 내용을 입력해주세요."
            className="h-32 resize-none"
          />
          {/* Display message field validation errors if any */}
          {actionData &&
          "fieldErrors" in actionData &&
          actionData.fieldErrors?.message ? (
            <FormErrors errors={actionData.fieldErrors.message} />
          ) : null}
        </div>

        {/* Hidden field for CAPTCHA token */}
        <input type="hidden" name="turnstile" value={turnstileToken} required />

        {/* CAPTCHA widget - only rendered after initial mount to prevent SSR issues */}
        {renderCaptcha && isMountedRef.current && hasValidSiteKey ? (
          <div className="flex flex-col items-center justify-center">
            {/* Turnstile widget */}
            <div>
              {isMountedRef.current &&
                turnstileSiteKey &&
                turnstileSiteKey.trim() !== "" && (
                  <Turnstile
                    key="turnstile-widget"
                    sitekey={turnstileSiteKey}
                    onVerify={(token) => {
                      if (import.meta.env.DEV) {
                        console.log(
                          "✅ Turnstile verified! Token received:",
                          token.substring(0, 20) + "...",
                        );
                      }
                      if (isMountedRef.current) {
                        setTurnstileToken(token);
                      }
                    }}
                    onError={(error) => {
                      // Log errors for debugging
                      if (!isMountedRef.current) return;
                      console.error("❌ Turnstile error:", error);
                      // Show user-friendly error message in development
                      if (import.meta.env.DEV) {
                        toast.error(
                          `Turnstile error: ${error.message || "Unknown error"}`,
                        );
                      }
                    }}
                    onExpire={() => {
                      if (import.meta.env.DEV) {
                        console.log("⚠️ Turnstile token expired");
                      }
                      if (isMountedRef.current) {
                        setTurnstileToken("");
                      }
                    }}
                    onLoad={() => {
                      if (import.meta.env.DEV) {
                        console.log("✅ Turnstile widget loaded successfully");
                      }
                    }}
                  />
                )}
              {/* Display Turnstile verification errors if any */}
              {actionData &&
              "errors" in actionData &&
              actionData.errors?.turnstile ? (
                <FormErrors
                  key="turnstile"
                  errors={actionData.errors.turnstile}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Submit button - disabled until CAPTCHA is verified */}
        <FormButton
          type="submit"
          className="w-full font-bold"
          disabled={!turnstileToken}
          label="보내기"
        />
      </Form>
    </div>
  );
}
