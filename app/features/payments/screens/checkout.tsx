/**
 * Checkout Page Component
 *
 * 결제 이원화 구조:
 * - type=point: 포인트 충전 (10k/20k/30k 패키지, 보너스 적용)
 * - type=health_report: 건강 보고서 직접 결제 (9,900원)
 */
import type { Route } from "./+types/checkout";

import {
  type TossPaymentsWidgets,
  loadTossPayments,
} from "@tosspayments/tosspayments-sdk";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, redirect } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  HEALTH_REPORT_POINT_PRICE,
  HEALTH_REPORT_PRODUCT_DESCRIPTION,
  HEALTH_REPORT_PRODUCT_NAME,
} from "~/core/lib/health-report";
import {
  type CheckoutType,
  PAYMENT_METADATA_TYPE,
  getCheckoutUrl,
} from "~/core/lib/payment-constants";
import {
  POINT_PACKAGES,
  type PointPackage,
  getDefaultPointPackage,
  getPointPackage,
  isValidPointPackageId,
} from "~/core/lib/point-packages";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { requireAuthentication } from "~/features/admin/guards.server";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `결제 | ${import.meta.env.VITE_APP_NAME}` },
    {
      name: "color-scheme",
      content: "light",
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw redirect("/login");

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") ?? "point") as CheckoutType;
  const packageId = url.searchParams.get("package");

  // 포인트 충전: package 검증
  if (type === "point") {
    const pkg =
      packageId && isValidPointPackageId(packageId)
        ? getPointPackage(packageId as "10000" | "20000" | "30000")!
        : getDefaultPointPackage();
    return {
      userId: user.id,
      userName: user.user_metadata?.name,
      userEmail: user.email,
      type: "point" as const,
      package: pkg,
    };
  }

  // 건강 보고서 직접 결제
  if (type === "health_report") {
    return {
      userId: user.id,
      userName: user.user_metadata?.name,
      userEmail: user.email,
      type: "health_report" as const,
      package: null,
    };
  }

  throw redirect(getCheckoutUrl("point"));
}

export default function Checkout({ loaderData }: Route.ComponentProps) {
  const widgets = useRef<TossPaymentsWidgets | null>(null);
  const initedToss = useRef<boolean>(false);
  const [agreementStatus, setAgreementStatus] = useState<boolean>(true);
  const [canPay, setCanPay] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage>(
    loaderData.type === "point" ? loaderData.package : POINT_PACKAGES[0],
  );

  const isPointCharge = loaderData.type === "point";
  const isHealthReport = loaderData.type === "health_report";
  const amount = isPointCharge
    ? selectedPackage.amount
    : HEALTH_REPORT_POINT_PRICE;
  const orderName = isPointCharge
    ? `포인트 충전 ${selectedPackage.points.toLocaleString()}P`
    : `${HEALTH_REPORT_PRODUCT_NAME} (${HEALTH_REPORT_POINT_PRICE.toLocaleString()}P)`;

  useEffect(() => {
    async function initToss() {
      if (initedToss.current) return;
      initedToss.current = true;

      const toss = await loadTossPayments(
        import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY,
      );
      widgets.current = await toss.widgets({
        customerKey: loaderData.userId,
      });

      const amt = isPointCharge
        ? selectedPackage.amount
        : HEALTH_REPORT_POINT_PRICE;
      await widgets.current.setAmount({
        value: amt,
        currency: "KRW",
      });

      const [paymentMethods, agreement] = await Promise.all([
        widgets.current.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        }),
        widgets.current.renderAgreement({
          selector: "#toss-payment-agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      agreement.on("agreementStatusChange", ({ agreedRequiredTerms }) => {
        setAgreementStatus(agreedRequiredTerms);
      });
      setCanPay(true);
    }
    initToss();
  }, [loaderData.userId, isPointCharge, selectedPackage.amount]);

  // 패키지 변경 시 amount 업데이트
  useEffect(() => {
    if (!widgets.current || !isPointCharge) return;
    widgets.current.setAmount({
      value: selectedPackage.amount,
      currency: "KRW",
    });
  }, [selectedPackage.id, isPointCharge]);

  const handleClick = async () => {
    try {
      const metaTags = document.querySelectorAll('meta[name="color-scheme"]');
      metaTags.forEach((tag) => tag.setAttribute("content", "light"));

      const amt = isPointCharge
        ? selectedPackage.amount
        : HEALTH_REPORT_POINT_PRICE;
      const name = isPointCharge
        ? `포인트 충전 ${selectedPackage.points.toLocaleString()}P`
        : `${HEALTH_REPORT_PRODUCT_NAME} (${HEALTH_REPORT_POINT_PRICE.toLocaleString()}P)`;

      const metadata = isPointCharge
        ? {
            type: PAYMENT_METADATA_TYPE.POINT_PURCHASE,
            points: String(selectedPackage.points),
            package_id: selectedPackage.id,
          }
        : {
            type: PAYMENT_METADATA_TYPE.HEALTH_REPORT,
            points: String(HEALTH_REPORT_POINT_PRICE),
          };

      await widgets.current?.requestPayment({
        windowTarget: "iframe",
        orderId: crypto.randomUUID(),
        orderName: name,
        customerEmail: loaderData.userEmail,
        customerName: loaderData.userName,
        metadata,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/failure`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-20">
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <img
            src="/middle-man-before.png"
            alt={isPointCharge ? "포인트 충전" : HEALTH_REPORT_PRODUCT_NAME}
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>

        <div className="flex flex-col items-start gap-10">
          <h1 className="text-center text-4xl font-semibold tracking-tight lg:text-5xl">
            {isPointCharge ? "포인트 충전" : HEALTH_REPORT_PRODUCT_NAME}
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            {isPointCharge
              ? "어려운 개인 건강 데이터를 AI 기반 리포트, 시각화 도구, 챗봇 등을 통해 쉽고 간편하게 관리하세요. 포인트 충전시 패키지별 보너스가 차등 적용됩니다."
              : HEALTH_REPORT_PRODUCT_DESCRIPTION}
          </p>

          {/* 포인트 패키지 선택 (포인트 충전일 때만) */}
          {isPointCharge && (
            <div className="flex w-full flex-col gap-4">
              <span className="text-sm font-medium">패키지 선택</span>
              <div className="grid grid-cols-3 gap-4">
                {POINT_PACKAGES.map((pkg) => (
                  <Button
                    key={pkg.id}
                    type="button"
                    variant={
                      selectedPackage.id === pkg.id ? "default" : "outline"
                    }
                    className="flex min-h-[4.5rem] flex-col items-center justify-center gap-2 px-6 py-5"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <span className="font-semibold">{pkg.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {pkg.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isHealthReport && (
            <div className="bg-muted/30 w-full rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품</span>
                <span className="font-medium">
                  {HEALTH_REPORT_PRODUCT_NAME}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">결제 금액</span>
                <span className="font-semibold">
                  {HEALTH_REPORT_POINT_PRICE.toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          {!canPay ? (
            <div className="flex w-full flex-col items-center justify-center gap-2">
              <Loader2Icon className="text-muted-foreground size-10 animate-spin" />
              <span className="text-muted-foreground text-lg">
                결제 수단을 불러오는 중...
              </span>
            </div>
          ) : null}

          <div
            className={cn(
              "flex w-full flex-col gap-5 transition-opacity duration-300",
              canPay ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="border-border w-full overflow-hidden rounded-2xl border md:p-4">
              <div
                id="toss-payment-methods"
                className="bg-background overflow-hidden rounded-t-2xl"
              />
              <div
                id="toss-payment-agreement"
                className="bg-background overflow-hidden rounded-b-2xl"
              />
            </div>

            {/* 베타 안내 (결제 버튼 바로 위) */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                현재 서비스는 베타 테스트 단계입니다.
              </p>
              <p className="text-muted-foreground mt-1.5 text-xs">
                일부 분석 결과는 보완 중일 수 있으며, 결과는 건강관리 참고용으로 제공됩니다.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                문제 발생 시 신속히 재검토 또는 환불해드립니다.
              </p>
            </div>

            {/* 환불 안내 (결제 버튼 위) */}
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">
                디지털 콘텐츠 특성상 결제 완료 후 환불이 제한될 수 있으며,
                서비스 오류 등 회사의 귀책 사유가 있는 경우 환불이 가능합니다.{" "}
                <Link
                  to="/legal/refund-policy"
                  viewTransition
                  className="text-muted-foreground hover:text-foreground underline"
                >
                  환불정책 자세히 보기
                </Link>
              </p>
              <ul className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="text-foreground">✓</span> 결제 후 즉시 리포트
                  제공
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-foreground">✓</span> 데이터 기반 분석
                  결과 제공
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-foreground">✓</span> 문제 발생 시 환불
                  가능
                </li>
              </ul>
            </div>

            {canPay ? (
              <Button
                className="w-full rounded-2xl py-7.5 text-lg dark:bg-white"
                size="lg"
                onClick={handleClick}
                disabled={!agreementStatus}
              >
                {isPointCharge
                  ? `${selectedPackage.amount.toLocaleString()}원 결제 (${selectedPackage.points.toLocaleString()}P 적립)`
                  : `${HEALTH_REPORT_POINT_PRICE.toLocaleString()}원 결제하기`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
