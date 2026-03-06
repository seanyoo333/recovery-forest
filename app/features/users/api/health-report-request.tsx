/**
 * Health Report Request API - n8n Webhook Proxy
 *
 * A안: 요청은 최소, 데이터는 서버/워크플로가 권위 있게 조회
 * 1. report_requests에 요청 스냅샷(input_json) 저장
 * 2. webhook에 request_id + form 입력값 전달 → n8n이 추적 및 입력값 활용
 * 3. webhook 실패 시 insert 롤백(삭제) → 고아 행 방지
 */
import type { Json } from "database.types";
import type { Route } from "./+types/health-report-request";

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
    const { error } = await client
      .from("report_requests")
      .delete()
      .eq("id", requestId);
    if (error) {
      console.error("Health report rollback (delete) error:", error);
    }
  } catch (e) {
    console.error("Health report rollback (delete) threw:", e);
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);

    const body = (await request.json()) as Record<string, unknown>;
    const { user_id: _uid, ...inputJson } = body;
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
    console.error("Health report request error:", e);
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
