/**
 * Profile Payments Page
 *
 * 프로필 내 구매내역 및 포인트 관리 페이지.
 * 본인 프로필에서만 접근 가능하며, 보유 포인트, 구매내역, 포인트 충전 버튼을 제공합니다.
 */
import type { Route } from "./+types/profile-payments-page";

import { Link, redirect } from "react-router";

import { CoinsIcon, ReceiptIcon } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { getCheckoutUrl } from "~/core/lib/payment-constants";
import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/features/admin/guards.server";

import { getPayments, getPointPayments } from "../../payments/queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "결제 내역 | Evidence Base" }];
};

/** 결제 내역을 날짜 기준으로 정렬하여 병합 */
type PaymentRecord = {
  id: number;
  order_id: string;
  order_name: string;
  total_amount: number;
  status: string;
  receipt_url: string;
  created_at: string;
  approved_at: string;
  type: "payment" | "point_payment";
  metadataType?: string;
  points?: number;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw redirect("/login");

  // 본인 프로필인지 확인 (username으로 프로필 조회)
  const { data: profile } = await client
    .from("profiles")
    .select("profile_id, username, points")
    .eq("profile_id", user.id)
    .single();

  if (!profile || profile.username !== params.username) {
    return redirect(`/users/${params.username}`);
  }

  const [payments, pointPayments] = await Promise.all([
    getPayments(client, { profileId: user.id }),
    getPointPayments(client, { profileId: user.id }),
  ]);

  const allPayments: PaymentRecord[] = [
    ...payments.map((p) => ({
      id: p.payment_id,
      order_id: p.order_id,
      order_name: p.order_name,
      total_amount: p.total_amount,
      status: p.status,
      receipt_url: p.receipt_url,
      created_at: p.created_at,
      approved_at: p.approved_at,
      type: "payment" as const,
      metadataType: (p.metadata as { type?: string })?.type,
    })),
    ...pointPayments.map((p) => ({
      id: p.payment_id,
      order_id: p.order_id,
      order_name: p.order_name,
      total_amount: p.total_amount,
      status: p.status,
      receipt_url: p.receipt_url,
      created_at: p.created_at,
      approved_at: p.approved_at,
      type: "point_payment" as const,
      points: parseInt(
        String((p.metadata as { points?: string | number })?.points ?? "0"),
        10,
      ),
    })),
  ].sort(
    (a, b) =>
      new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime(),
  );

  return {
    points: Number(profile.points ?? 0),
    payments: allPayments,
  };
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePaymentsPage({
  loaderData,
}: Route.ComponentProps) {
  const { points, payments } = loaderData;

  return (
    <div className="flex flex-col gap-8">
      {/* 보유 포인트 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">보유 포인트</CardTitle>
          <CoinsIcon className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-2xl font-bold">{points.toLocaleString()}P</span>
            <Button asChild size="sm">
              <Link to={getCheckoutUrl("point")}>
                포인트 구매하기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 구매 내역 */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold">구매 내역</h4>
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <ReceiptIcon className="text-muted-foreground size-12" />
              <p className="text-muted-foreground">결제 내역이 없습니다.</p>
              <Button asChild variant="outline">
                <Link to={getCheckoutUrl("point")}>
                  포인트 구매하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문명</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead className="text-right">영수증</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={`${payment.type}-${payment.id}`}>
                    <TableCell className="font-medium">
                      {payment.order_name}
                    </TableCell>
                    <TableCell>
                      {payment.type === "point_payment" ? (
                        <span className="text-muted-foreground text-sm">
                          포인트 충전
                          {payment.points ? ` +${payment.points}P` : ""}
                        </span>
                      ) : payment.metadataType === "health_report" ? (
                        <span className="text-muted-foreground text-sm">
                          건강 보고서
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          일반 결제
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.total_amount.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(payment.approved_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                      >
                        영수증 보기
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
