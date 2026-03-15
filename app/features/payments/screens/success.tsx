/**
 * Payment Success Page Component
 *
 * This file implements the payment success page that verifies and processes
 * successful payments from Toss Payments. It demonstrates a complete payment
 * verification flow with proper security checks and database recording.
 *
 * Key features:
 * - Authentication protection to prevent unauthorized access
 * - Payment verification with the Toss Payments API
 * - Validation of payment parameters and response data
 * - Security checks for payment amount verification
 * - Database recording of verified payments
 * - Detailed success page with payment information
 */
import type { Route } from "./+types/success";

import { CheckCircle2, FileText, LayoutDashboard, Receipt } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Link, redirect } from "react-router";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  HEALTH_REPORT_PAGE_PATH,
  HEALTH_REPORT_PENDING_KEY,
} from "~/core/lib/health-report";
import {
  getCheckoutUrl,
  isAllowedPaymentAmount,
  PAYMENT_METADATA_TYPE,
} from "~/core/lib/payment-constants";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/features/admin/guards.server";

/**
 * Meta function for setting page metadata
 *
 * This function sets the page title for the payment success page,
 * indicating to the user that their payment has been completed successfully.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => [
  {
    title: `결제 완료 | ${import.meta.env.VITE_APP_NAME}`,
  },
];

/**
 * Validation schema for URL parameters from Toss Payments redirect
 *
 * This schema defines the required parameters that Toss Payments includes
 * in the redirect URL after a successful payment:
 * - orderId: Unique identifier for the order
 * - paymentKey: Unique identifier for the payment transaction
 * - amount: Payment amount
 * - paymentType: Method of payment (card, transfer, etc.)
 */
const paramsSchema = z.object({
  orderId: z.string(),
  paymentKey: z.string(),
  amount: z.coerce.number(),
  paymentType: z.string(),
});

/**
 * Validation schema for Toss Payments API response
 *
 * This schema defines the expected structure of the response from the
 * Toss Payments confirmation API. It includes:
 * - Transaction identifiers (paymentKey, orderId)
 * - Order details (orderName)
 * - Payment status and timestamps
 * - Receipt information
 * - Payment amount and additional metadata
 */
const paymentResponseSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  orderName: z.string(),
  status: z.string(),
  requestedAt: z.string(),
  approvedAt: z.string(),
  receipt: z.object({
    url: z.string(),
  }),
  totalAmount: z.number(),
  metadata: z.record(z.string()),
});

/**
 * Loader function for payment verification and processing
 *
 * This function handles the complete payment verification flow:
 * 1. Authenticates the user to prevent unauthorized access
 * 2. Validates URL parameters from Toss Payments redirect
 * 3. Verifies the payment with Toss Payments API
 * 4. Validates the payment amount to prevent fraud
 * 5. Records the verified payment in the database
 *
 * Security considerations:
 * - Requires authentication to access the success page
 * - Validates all payment parameters with Zod schemas
 * - Verifies payment with Toss Payments API using secret key
 * - Validates payment amount to prevent tampering
 * - Uses admin client for secure database operations
 *
 * @param request - The incoming HTTP request with payment parameters
 * @returns Object with payment data for the success page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Create a server-side Supabase client with the user's session
  const [client] = makeServerClient(request);

  // Verify the user is authenticated, redirects to login if not
  await requireAuthentication(client);

  // Get the authenticated user's information
  const {
    data: { user },
  } = await client.auth.getUser();

  // Redirect to checkout if user is not found
  if (!user) {
    throw redirect(getCheckoutUrl("point"));
  }

  // Extract and validate payment parameters from URL
  const url = new URL(request.url);
  const result = paramsSchema.safeParse(Object.fromEntries(url.searchParams));

  // Redirect to failure page if parameters are invalid
  if (!result.success) {
    return redirect(`/payments/failure?`);
  }

  // Prepare authorization header for Toss Payments API
  const encryptedSecretKey =
    "Basic " +
    Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY + ":").toString("base64");

  // Verify payment with Toss Payments API
  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: result.data.orderId,
        amount: result.data.amount,
        paymentKey: result.data.paymentKey,
      }),
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
    },
  );

  // Parse API response
  const data = await response.json();

  // Handle API errors by redirecting to failure page with error details
  if (response.status !== 200 && data.code && data.message) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent(data.code)}&message=${encodeURIComponent(data.message)}`,
    );
  }

  // Validate API response structure
  const paymentResponse = paymentResponseSchema.safeParse(data);
  if (!paymentResponse.success) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent("validation-error")}&message=${encodeURIComponent("Invalid response from Toss")}`,
    );
  }

  // CRITICAL SECURITY CHECK: Validate payment amount (whitelist)
  if (!isAllowedPaymentAmount(paymentResponse.data.totalAmount)) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent("validation-error")}&message=${encodeURIComponent("Invalid amount")}`,
    );
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("profile_id")
    .eq("profile_id", user!.id)
    .single();

  if (!profile) {
    throw redirect(
      `/payments/failure?code=${encodeURIComponent("profile-error")}&message=${encodeURIComponent("Profile not found")}`,
    );
  }

  const isPointPurchase =
    paymentResponse.data.metadata?.type === PAYMENT_METADATA_TYPE.POINT_PURCHASE;
  const isHealthReport =
    paymentResponse.data.metadata?.type === PAYMENT_METADATA_TYPE.HEALTH_REPORT;

  if (isPointPurchase) {
    // 포인트 충전: point_payments에 기록하고 profiles.points 증가
    const pointsToAdd = parseInt(
      String(paymentResponse.data.metadata?.points ?? "9900"),
      10,
    );

    await adminClient.from("point_payments").insert({
      payment_key: paymentResponse.data.paymentKey,
      order_id: paymentResponse.data.orderId,
      order_name: paymentResponse.data.orderName,
      total_amount: paymentResponse.data.totalAmount,
      receipt_url: paymentResponse.data.receipt.url,
      status: paymentResponse.data.status,
      approved_at: paymentResponse.data.approvedAt,
      requested_at: paymentResponse.data.requestedAt,
      metadata: paymentResponse.data.metadata,
      raw_data: data,
      profile_id: profile.profile_id,
    });

    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("points")
      .eq("profile_id", user!.id)
      .single();

    const currentPoints = Number(currentProfile?.points ?? 0);
    await adminClient
      .from("profiles")
      .update({
        points: currentPoints + pointsToAdd,
        points_updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user!.id);
  } else {
    // 일반 결제: payments에 기록
    await adminClient.from("payments").insert({
      payment_key: paymentResponse.data.paymentKey,
      order_id: paymentResponse.data.orderId,
      order_name: paymentResponse.data.orderName,
      total_amount: paymentResponse.data.totalAmount,
      receipt_url: paymentResponse.data.receipt.url,
      status: paymentResponse.data.status,
      approved_at: paymentResponse.data.approvedAt,
      requested_at: paymentResponse.data.requestedAt,
      metadata: paymentResponse.data.metadata,
      raw_data: data,
      profile_id: profile.profile_id,
    });
  }

  return {
    data,
    isPointPurchase,
    isHealthReport: isHealthReport ?? false,
    orderId: paymentResponse.data.orderId,
    paymentKey: paymentResponse.data.paymentKey,
  };
}

/** 결제 승인 시각을 읽기 쉬운 형식으로 포맷 */
function formatApprovedAt(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

/**
 * Success component for displaying payment confirmation
 *
 * 프로덕션 환경에 맞는 사용자 친화적 결제 완료 화면
 * - 포인트 충전: 적립 포인트, 영수증 링크, 건강리포트 요청 CTA
 * - 일반 결제: 주문 정보, 영수증 링크
 */
export default function Success({ loaderData }: Route.ComponentProps) {
  const { data, isPointPurchase, isHealthReport, orderId, paymentKey } =
    loaderData;
  const pointsAdded = isPointPurchase
    ? parseInt(String(data.metadata?.points ?? "0"), 10)
    : 0;

  // 건강 보고서 카드 결제 후: sessionStorage payload로 report_requests 생성
  useEffect(() => {
    if (!isHealthReport || !orderId || !paymentKey) return;
    const raw = typeof window !== "undefined" && sessionStorage.getItem(HEALTH_REPORT_PENDING_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw) as Record<string, unknown>;
    fetch("/api/health-report-complete-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, orderId, paymentKey }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          sessionStorage.removeItem(HEALTH_REPORT_PENDING_KEY);
        } else {
          toast.error(res.error ?? "건강 보고서 요청 처리에 실패했습니다.");
        }
      })
      .catch(() => toast.error("건강 보고서 요청 처리에 실패했습니다."));
  }, [isHealthReport, orderId, paymentKey]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-12">
      <Card className="w-full overflow-hidden border-green-200/60 bg-green-50/30 shadow-sm dark:border-green-900/40 dark:bg-green-950/20">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-center text-2xl font-semibold">
            결제가 완료되었습니다
          </CardTitle>
          <CardDescription className="text-center text-base">
            {isPointPurchase
              ? "포인트가 정상적으로 적립되었습니다."
              : isHealthReport
                ? "건강 보고서 요청이 접수되었습니다. 결과는 대시보드에서 확인할 수 있습니다."
                : "결제가 성공적으로 처리되었습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="space-y-2 rounded-lg border bg-background/80 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">주문명</span>
              <span className="font-medium">{data.orderName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="font-medium">
                {data.totalAmount?.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">결제 시각</span>
              <span className="font-medium">
                {formatApprovedAt(data.approvedAt ?? data.requestedAt ?? "")}
              </span>
            </div>
            {isPointPurchase && pointsAdded > 0 && (
              <div className="flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">적립 포인트</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +{pointsAdded.toLocaleString()}P
                </span>
              </div>
            )}
          </div>
          {data.receipt?.url && (
            <a
              href={data.receipt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-colors"
            >
              <Receipt className="size-4" />
              영수증 보기
            </a>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 px-6">
          {(isPointPurchase || isHealthReport) && (
            <Button asChild className="w-full" size="lg">
              <Link to={HEALTH_REPORT_PAGE_PATH}>
                <FileText className="mr-2 size-4" />
                {isHealthReport ? "건강리포트 결과 보기" : "건강리포트 요청하기"}
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/my/dashboard">
              <LayoutDashboard className="mr-2 size-4" />
              대시보드로 이동
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
