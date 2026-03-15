/**
 * Health Report PDF 생성 API - n8n Webhook Proxy
 *
 * request_id로 PDF 생성 요청 → n8n 처리 후 반환:
 * { ok, request_id, pdf_status, pdf_path }
 * Private 버킷이므로 pdf_path 저장, 다운로드는 /api/health-report-pdf-download에서 signed URL로 처리
 */
import type { Route } from "./+types/health-report-pdf";

import { HEALTH_REPORT_PDF_FAILED_MESSAGE } from "~/core/lib/health-report";
import makeServerClient from "~/core/lib/supa-client.server";
import {
  getLoggedInUserId,
  updateHealthReportPdfInfo,
} from "~/features/users/queries";

const WEBHOOK_URL =
  "https://primary-production-42934.up.railway.app/webhook-test/health-report-pdf";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const [client] = makeServerClient(request);
    const userId = await getLoggedInUserId(client);
    if (!userId) {
      return Response.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const requestId = (formData.get("request_id") as string | null)?.trim();

    if (!requestId) {
      return Response.json(
        { success: false, error: "request_id가 필요합니다." },
        { status: 400 },
      );
    }

    const { data: req } = await client
      .from("report_requests")
      .select("id")
      .eq("id", requestId)
      .eq("user_id", userId)
      .single();

    if (!req) {
      return Response.json(
        { success: false, error: "요청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, user_id: userId }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      return Response.json(
        {
          success: false,
          error: text.trim() || HEALTH_REPORT_PDF_FAILED_MESSAGE,
        },
        { status: webhookRes.status >= 500 ? 502 : webhookRes.status },
      );
    }

    const data = (await webhookRes.json()) as {
      ok?: boolean;
      request_id?: string;
      pdf_status?: string;
      pdf_path?: string;
    };

    if (!data.ok) {
      return Response.json(
        { success: false, error: "PDF 생성 결과를 받지 못했습니다." },
        { status: 502 },
      );
    }

    const pdfPath = typeof data.pdf_path === "string" && data.pdf_path.trim() ? data.pdf_path.trim() : null;
    const pdfStatus = (data.pdf_status === "pdf_ready" || data.pdf_status === "pdf_generating"
      ? data.pdf_status
      : pdfPath ? "pdf_ready" : null) as "pdf_ready" | "pdf_generating" | null;

    if (pdfPath && pdfStatus) {
      await updateHealthReportPdfInfo(client, {
        requestId,
        userId,
        pdfPath,
        pdfStatus,
      });
    }

    return Response.json({
      success: true,
      pdf_status: pdfStatus ?? data.pdf_status,
      pdf_path: pdfPath ?? data.pdf_path,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "네트워크 오류";
    console.error("Health report PDF error:", e);
    return Response.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
