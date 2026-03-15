/**
 * Health Report Complete Payment API
 *
 * 카드로 건강 보고서 결제 후, 결제 성공 페이지에서 호출합니다.
 * payments 테이블에 이미 기록된 결제를 검증하고 report_requests를 생성한 뒤 웹훅을 호출합니다.
 * (포인트 차감 없음 - 카드 결제로 이미 완료됨)
 */
import type { Json } from "database.types";
import type { Route } from "./+types/health-report-complete-payment";

import makeServerClient from "~/core/lib/supa-client.server";
import { HEALTH_REPORT_WEBHOOK_FAILED_MESSAGE } from "~/core/lib/health-report";
import { getLoggedInUserId } from "~/features/users/queries";

const WEBHOOK_URL =
  "https://primary-production-42934.up.railway.app/webhook-test/health-report-request";

async function rollbackInsert(
  client: Awaited<ReturnType<typeof makeServerClient>>[0],
  requestId: string,
): Promise<void> {
  try {
    await client.from("report_requests").delete().eq("id", requestId);
  } catch (e) {
    console.error("Health report complete rollback error:", e);
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    const body = (await request.json()) as {
      payload: Record<string, unknown>;
      orderId: string;
      paymentKey: string;
    };

    const { payload, orderId, paymentKey } = body;
    if (!payload || !orderId || !paymentKey) {
      return Response.json(
        { success: false, error: "payload, orderId, paymentKey가 필요합니다." },
        { status: 400 },
      );
    }

    // 결제 검증: payments 테이블에 해당 order_id, profile_id로 기록이 있는지
    const { data: payment } = await client
      .from("payments")
      .select("payment_id")
      .eq("profile_id", userId)
      .eq("order_id", orderId)
      .eq("payment_key", paymentKey)
      .single();

    if (!payment) {
      return Response.json(
        { success: false, error: "유효한 결제 정보를 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    const { user_id: _uid, ...inputJson } = payload;
    const inputJsonForDb = JSON.parse(
      JSON.stringify(inputJson),
    ) as Json;

    const { data: inserted, error: insertError } = await client
      .from("report_requests")
      .insert({
        user_id: userId,
        status: "requested",
        input_json: inputJsonForDb,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      console.error("report_requests insert error:", insertError);
      return Response.json(
        { success: false, error: "요청 기록 생성 실패" },
        { status: 500 },
      );
    }

    const requestId = inserted.id;
    const webhookPayload = { request_id: requestId, ...inputJson };

    let webhookRes: Response;
    try {
      webhookRes = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });
    } catch (fetchError) {
      await rollbackInsert(client, requestId);
      console.error("Health report webhook fetch error:", fetchError);
      return Response.json(
        { success: false, error: HEALTH_REPORT_WEBHOOK_FAILED_MESSAGE },
        { status: 502 },
      );
    }

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      await rollbackInsert(client, requestId);
      return Response.json(
        {
          success: false,
          error: text.trim() || HEALTH_REPORT_WEBHOOK_FAILED_MESSAGE,
        },
        { status: webhookRes.status >= 500 ? 502 : webhookRes.status },
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Response && e.status === 302) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : "네트워크 오류";
    console.error("Health report complete payment error:", e);
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
